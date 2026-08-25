import ExcelJS from 'exceljs';
import Papa from 'papaparse';
import { z } from 'zod';
import { badRequest } from '../lib/errors';

export const IMPORT_COLUMNS = [
  'codigo',
  'titulo',
  'descripcion',
  'curso',
  'asignatura',
  'unidad',
  'prioridad',
  'estado',
  'observaciones',
] as const;

export type ImportColumn = (typeof IMPORT_COLUMNS)[number];

/** Quita tildes y normaliza a minúsculas para comparar encabezados/valores. */
export function normalizeKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');
}

const HEADER_ALIASES: Record<string, ImportColumn> = {
  codigo: 'codigo',
  code: 'codigo',
  oa: 'codigo',
  codigo_oa: 'codigo',
  titulo: 'titulo',
  title: 'titulo',
  nombre: 'titulo',
  descripcion: 'descripcion',
  description: 'descripcion',
  detalle: 'descripcion',
  curso: 'curso',
  course: 'curso',
  nivel: 'curso',
  asignatura: 'asignatura',
  subject: 'asignatura',
  materia: 'asignatura',
  unidad: 'unidad',
  unit: 'unidad',
  prioridad: 'prioridad',
  priority: 'prioridad',
  estado: 'estado',
  status: 'estado',
  observaciones: 'observaciones',
  notes: 'observaciones',
  observacion: 'observaciones',
  notas: 'observaciones',
};

const STATUS_MAP: Record<string, 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'> = {
  pendiente: 'PENDING',
  pending: 'PENDING',
  '': 'PENDING',
  en_proceso: 'IN_PROGRESS',
  proceso: 'IN_PROGRESS',
  in_progress: 'IN_PROGRESS',
  en_curso: 'IN_PROGRESS',
  logrado: 'COMPLETED',
  logrados: 'COMPLETED',
  completado: 'COMPLETED',
  completed: 'COMPLETED',
  terminado: 'COMPLETED',
};

const PRIORITY_MAP: Record<string, 'LOW' | 'MEDIUM' | 'HIGH'> = {
  baja: 'LOW',
  low: 'LOW',
  media: 'MEDIUM',
  medium: 'MEDIUM',
  normal: 'MEDIUM',
  '': 'MEDIUM',
  alta: 'HIGH',
  high: 'HIGH',
};

export type RawRow = Record<string, string>;

/** Convierte el archivo subido en filas con claves normalizadas. */
export async function parseImportFile(file: {
  originalname: string;
  buffer: Buffer;
  mimetype: string;
}): Promise<RawRow[]> {
  const name = file.originalname.toLowerCase();

  if (name.endsWith('.csv') || file.mimetype === 'text/csv') {
    const text = file.buffer.toString('utf8').replace(/^\uFEFF/, '');
    const parsed = Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (h) => HEADER_ALIASES[normalizeKey(h)] ?? normalizeKey(h),
    });
    if (parsed.errors.length && parsed.data.length === 0) {
      throw badRequest('No pudimos leer el archivo CSV. Verifica el formato.');
    }
    return parsed.data.map((r) => mapValues(r));
  }

  if (name.endsWith('.xlsx') || name.endsWith('.xlsm')) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(file.buffer as unknown as ArrayBuffer);
    const sheet = workbook.worksheets[0];
    if (!sheet) throw badRequest('El archivo Excel no tiene hojas.');

    const headerRow = sheet.getRow(1);
    const headers: string[] = [];
    headerRow.eachCell({ includeEmpty: true }, (cell, col) => {
      const raw = String(cell.value ?? '').trim();
      headers[col] = HEADER_ALIASES[normalizeKey(raw)] ?? normalizeKey(raw);
    });

    const rows: RawRow[] = [];
    sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return;
      const obj: RawRow = {};
      let hasContent = false;
      row.eachCell({ includeEmpty: true }, (cell, col) => {
        const key = headers[col];
        if (!key) return;
        const value = cellToString(cell.value);
        if (value) hasContent = true;
        obj[key] = value;
      });
      if (hasContent) rows.push(obj);
    });
    return rows;
  }

  throw badRequest('Formato no soportado. Sube un archivo .csv o .xlsx.');
}

function cellToString(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    if ('text' in value && typeof value.text === 'string') return value.text.trim();
    if ('result' in value) return String(value.result ?? '').trim();
    if ('richText' in value) {
      return (value.richText as { text: string }[]).map((t) => t.text).join('').trim();
    }
    if (value instanceof Date) return value.toISOString();
  }
  return String(value).trim();
}

function mapValues(row: Record<string, unknown>): RawRow {
  const out: RawRow = {};
  for (const [k, v] of Object.entries(row)) {
    out[k] = v === null || v === undefined ? '' : String(v).trim();
  }
  return out;
}

export interface ImportIssue {
  field: string;
  message: string;
}

export interface NormalizedRow {
  rowNumber: number;
  codigo: string;
  titulo: string;
  descripcion: string | null;
  curso: string;
  asignatura: string;
  unidad: string | null;
  prioridad: 'LOW' | 'MEDIUM' | 'HIGH';
  estado: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  observaciones: string | null;
}

export interface ValidatedRow {
  rowNumber: number;
  valid: boolean;
  issues: ImportIssue[];
  warnings: string[];
  /** true si ya existe un OA con el mismo código en esa asignatura y curso. */
  duplicate?: boolean;
  data: NormalizedRow | null;
  raw: RawRow;
}

const rowSchema = z.object({
  codigo: z.string().trim().min(1, 'El código es obligatorio.').max(30, 'Código demasiado largo (máx. 30).'),
  titulo: z.string().trim().min(3, 'El título debe tener al menos 3 caracteres.').max(200, 'Título demasiado largo (máx. 200).'),
  descripcion: z.string().trim().max(2000, 'Descripción demasiado larga (máx. 2000).').optional(),
  curso: z.string().trim().min(1, 'El curso es obligatorio.').max(80, 'Nombre de curso demasiado largo.'),
  asignatura: z.string().trim().min(1, 'La asignatura es obligatoria.').max(80, 'Nombre de asignatura demasiado largo.'),
  unidad: z.string().trim().max(120, 'Nombre de unidad demasiado largo.').optional(),
  observaciones: z.string().trim().max(2000, 'Observaciones demasiado largas (máx. 2000).').optional(),
});

/** Valida una fila cruda y devuelve el detalle exacto de cada problema. */
export function validateRow(raw: RawRow, rowNumber: number): ValidatedRow {
  const issues: ImportIssue[] = [];
  const warnings: string[] = [];

  const parsed = rowSchema.safeParse({
    codigo: raw.codigo ?? '',
    titulo: raw.titulo ?? '',
    descripcion: raw.descripcion ?? '',
    curso: raw.curso ?? '',
    asignatura: raw.asignatura ?? '',
    unidad: raw.unidad ?? '',
    observaciones: raw.observaciones ?? '',
  });

  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      issues.push({ field: String(issue.path[0] ?? 'fila'), message: issue.message });
    }
  }

  const rawStatus = normalizeKey(raw.estado ?? '');
  const status = STATUS_MAP[rawStatus];
  if (status === undefined) {
    issues.push({
      field: 'estado',
      message: `Estado "${raw.estado}" no reconocido. Usa: pendiente, en proceso o logrado.`,
    });
  }

  const rawPriority = normalizeKey(raw.prioridad ?? '');
  const priority = PRIORITY_MAP[rawPriority];
  if (priority === undefined) {
    issues.push({
      field: 'prioridad',
      message: `Prioridad "${raw.prioridad}" no reconocida. Usa: baja, media o alta.`,
    });
  }

  if (!raw.unidad) {
    warnings.push('Sin unidad: el objetivo quedará sin unidad asignada.');
  }

  const valid = issues.length === 0 && parsed.success;

  return {
    rowNumber,
    valid,
    issues,
    warnings,
    raw,
    data:
      valid && parsed.success
        ? {
            rowNumber,
            codigo: parsed.data.codigo,
            titulo: parsed.data.titulo,
            descripcion: parsed.data.descripcion || null,
            curso: parsed.data.curso,
            asignatura: parsed.data.asignatura,
            unidad: parsed.data.unidad || null,
            prioridad: priority ?? 'MEDIUM',
            estado: status ?? 'PENDING',
            observaciones: parsed.data.observaciones || null,
          }
        : null,
  };
}
