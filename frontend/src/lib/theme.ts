/**
 * Sistema de apariencia: temas y color de acento.
 *
 * La preferencia vive en localStorage y se aplica sobre <html> como atributos
 * `data-theme` y `data-accent`. Toda la paleta cuelga de esos dos atributos
 * (ver index.css), así que aplicar un tema es cambiar un atributo.
 */

export type ThemeChoice = 'claro' | 'oscuro' | 'azul-noche' | 'azul-educativo' | 'auto';
export type ResolvedTheme = Exclude<ThemeChoice, 'auto'>;
export type AccentChoice = 'azul' | 'verde' | 'violeta' | 'naranja';

export const THEME_STORAGE_KEY = 'oa-manager:theme';
export const ACCENT_STORAGE_KEY = 'oa-manager:accent';

export const DEFAULT_THEME: ThemeChoice = 'auto';
export const DEFAULT_ACCENT: AccentChoice = 'azul';

export interface ThemeOption {
  value: ThemeChoice;
  label: string;
  description: string;
  /** Colores de la vista previa: [fondo, tarjeta, acento]. */
  preview: [string, string, string];
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    value: 'claro',
    label: 'Claro',
    description: 'Interfaz clara y limpia',
    preview: ['#f8fafc', '#ffffff', '#2563eb'],
  },
  {
    value: 'oscuro',
    label: 'Oscuro',
    description: 'Ideal para trabajar con poca luz',
    preview: ['#141922', '#1e2430', '#60a5fa'],
  },
  {
    value: 'azul-noche',
    label: 'Azul Noche',
    description: 'Moderno y tecnológico',
    preview: ['#0d1425', '#17203a', '#60a5fa'],
  },
  {
    value: 'azul-educativo',
    label: 'Azul Educativo',
    description: 'Diseñado para entornos educativos',
    preview: ['#eef4fd', '#ffffff', '#2563eb'],
  },
  {
    value: 'auto',
    label: 'Automático',
    description: 'Usa la configuración de tu dispositivo',
    preview: ['#f8fafc', '#141922', '#2563eb'],
  },
];

export interface AccentOption {
  value: AccentChoice;
  label: string;
  /** Muestra del color, para el punto de la interfaz. */
  swatch: string;
}

export const ACCENT_OPTIONS: AccentOption[] = [
  { value: 'azul', label: 'Azul', swatch: '#2563eb' },
  { value: 'verde', label: 'Verde', swatch: '#059669' },
  { value: 'violeta', label: 'Violeta', swatch: '#7c3aed' },
  { value: 'naranja', label: 'Naranja', swatch: '#ea580c' },
];

const THEME_VALUES = THEME_OPTIONS.map((option) => option.value);
const ACCENT_VALUES = ACCENT_OPTIONS.map((option) => option.value);

export function isThemeChoice(value: unknown): value is ThemeChoice {
  return typeof value === 'string' && (THEME_VALUES as string[]).includes(value);
}

export function isAccentChoice(value: unknown): value is AccentChoice {
  return typeof value === 'string' && (ACCENT_VALUES as string[]).includes(value);
}

/** ¿El sistema operativo pide modo oscuro? */
export function prefersDark(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
}

/** Traduce `auto` al tema concreto que corresponde en este momento. */
export function resolveTheme(choice: ThemeChoice): ResolvedTheme {
  if (choice !== 'auto') return choice;
  return prefersDark() ? 'oscuro' : 'claro';
}

/** Escribe los atributos en <html>. Es lo único que hace falta para pintar. */
export function applyAppearance(theme: ThemeChoice, accent: AccentChoice): void {
  const root = document.documentElement;
  root.dataset.theme = resolveTheme(theme);
  root.dataset.accent = accent;
}

export function readStoredTheme(): ThemeChoice {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeChoice(saved) ? saved : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

export function readStoredAccent(): AccentChoice {
  try {
    const saved = localStorage.getItem(ACCENT_STORAGE_KEY);
    return isAccentChoice(saved) ? saved : DEFAULT_ACCENT;
  } catch {
    return DEFAULT_ACCENT;
  }
}
