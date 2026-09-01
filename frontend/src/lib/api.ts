import { isDemoActive } from './demoMode';
import { handleDemoRequest, isDemoPath } from './demoApi';

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:4000/api';

export interface FieldIssue {
  field: string;
  message: string;
}

/** Error normalizado: `message` siempre es apto para mostrar a la usuaria. */
export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly issues: FieldIssue[];

  constructor(message: string, status: number, code = 'ERROR', issues: FieldIssue[] = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.issues = issues;
  }

  /** Mapa campo -> mensaje, para pintar los errores en el formulario. */
  get fieldErrors(): Record<string, string> {
    return this.issues.reduce<Record<string, string>>((acc, issue) => {
      if (!acc[issue.field]) acc[issue.field] = issue.message;
      return acc;
    }, {});
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  query?: Record<string, unknown>;
  /** No registrar en consola el 401 esperado (por ejemplo al comprobar la sesión). */
  quiet401?: boolean;
  /** No registrar en consola ningún error: la respuesta de error es un caso esperado. */
  quiet?: boolean;
}

export function buildQuery(query: Record<string, unknown> = {}): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) {
      if (value.length === 0) continue;
      params.set(key, value.join(','));
    } else {
      params.set(key, String(value));
    }
  }
  const s = params.toString();
  return s ? `?${s}` : '';
}

export function apiUrl(path: string, query?: Record<string, unknown>): string {
  return `${BASE_URL}${path}${buildQuery(query)}`;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, query, headers, quiet401 = false, quiet = false, ...rest } = options;

  // Modo demo: las rutas de contenido se resuelven en memoria y nunca llegan al
  // servidor, así que los datos reales de la usuaria quedan intactos.
  if (isDemoActive() && isDemoPath(path)) {
    const result = await handleDemoRequest<T>(rest.method ?? 'GET', path, body, query ?? {});
    if (result.ok) return result.data;
    throw new ApiError(result.message, result.status, result.code);
  }

  const isFormData = body instanceof FormData;

  let response: Response;
  try {
    response = await fetch(apiUrl(path, query), {
      ...rest,
      credentials: 'include',
      headers: {
        ...(isFormData ? {} : body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
      body: isFormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    console.error('[api] network error', error);
    throw new ApiError(
      'No pudimos conectar con el servidor. Revisa que el backend esté iniciado.',
      0,
      'NETWORK_ERROR',
    );
  }

  if (response.status === 204) return undefined as T;

  const contentType = response.headers.get('content-type') ?? '';

  if (!response.ok) {
    let message = 'Ocurrió un problema. Inténtalo nuevamente.';
    let code = 'ERROR';
    let issues: FieldIssue[] = [];

    if (contentType.includes('application/json')) {
      try {
        const payload = (await response.json()) as {
          error?: { message?: string; code?: string; details?: FieldIssue[] };
        };
        if (payload.error?.message) message = payload.error.message;
        if (payload.error?.code) code = payload.error.code;
        if (Array.isArray(payload.error?.details)) issues = payload.error.details;
      } catch {
        /* respuesta sin JSON válido: se usa el mensaje genérico */
      }
    }

    if (!quiet && !(quiet401 && response.status === 401)) {
      console.error(`[api] ${response.status} ${path}`, { message, code, issues });
    }
    throw new ApiError(message, response.status, code, issues);
  }

  if (contentType.includes('application/json')) {
    return (await response.json()) as T;
  }

  return (await response.text()) as T;
}

export const api = {
  get: <T>(path: string, query?: Record<string, unknown>) =>
    request<T>(path, { method: 'GET', query }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

/** Descarga un archivo generado por la API respetando la sesión (cookie). */
export async function downloadFile(
  path: string,
  query: Record<string, unknown>,
  fallbackName: string,
): Promise<void> {
  if (isDemoActive() && isDemoPath(path)) {
    throw new ApiError(
      'La descarga de archivos no está disponible en el modo demo. Sal del modo demo para usarla con tus datos reales.',
      400,
      'DEMO_UNSUPPORTED',
    );
  }

  const response = await fetch(apiUrl(path, query), { credentials: 'include' });

  if (!response.ok) {
    throw new ApiError('No pudimos generar el archivo. Inténtalo nuevamente.', response.status);
  }

  const disposition = response.headers.get('Content-Disposition') ?? '';
  const match = /filename="?([^"]+)"?/.exec(disposition);
  const fileName = match?.[1] ?? fallbackName;

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
