import { Check, Monitor, Moon, Palette, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../lib/cn';
import { ACCENT_OPTIONS, THEME_OPTIONS, type ThemeChoice } from '../../lib/theme';

const THEME_ICON: Record<ThemeChoice, typeof Sun> = {
  claro: Sun,
  oscuro: Moon,
  'azul-noche': Moon,
  'azul-educativo': Palette,
  auto: Monitor,
};

/** Miniatura del tema: fondo, tarjeta y un trazo del acento. */
function ThemePreview({ colors }: { colors: [string, string, string] }) {
  const [background, card, accent] = colors;
  return (
    <span
      className="flex h-14 w-full items-center gap-1.5 overflow-hidden rounded-lg border border-slate-200 p-2"
      style={{ backgroundColor: background }}
      aria-hidden
    >
      <span className="h-full w-2.5 shrink-0 rounded" style={{ backgroundColor: accent }} />
      <span
        className="flex h-full flex-1 flex-col justify-center gap-1 rounded px-1.5"
        style={{ backgroundColor: card }}
      >
        <span className="block h-1 w-3/4 rounded-full" style={{ backgroundColor: accent }} />
        <span className="block h-1 w-1/2 rounded-full opacity-40" style={{ backgroundColor: accent }} />
      </span>
    </span>
  );
}

export function AppearancePanel() {
  const { theme, resolvedTheme, accent, setTheme, setAccent } = useTheme();

  return (
    <section className="card p-6">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <Palette className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h3 className="text-base font-semibold text-slate-900">Apariencia</h3>
          <p className="text-sm text-slate-500">Personaliza OA Manager según tu preferencia.</p>
        </div>
      </div>

      {/* ------------------------------- Temas ------------------------------- */}
      <fieldset>
        <legend className="field-label mb-3">Tema</legend>
        <div
          role="radiogroup"
          aria-label="Tema de la aplicación"
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          {THEME_OPTIONS.map((option) => {
            const Icon = THEME_ICON[option.value];
            const selected = theme === option.value;
            // "Automático" muestra la miniatura del tema que realmente se
            // aplicaría ahora mismo, para que la vista previa no mienta.
            const preview =
              option.value === 'auto'
                ? (THEME_OPTIONS.find((o) => o.value === resolvedTheme)?.preview ?? option.preview)
                : option.preview;

            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setTheme(option.value)}
                className={cn(
                  'group relative flex flex-col gap-2.5 rounded-xl border p-3 text-left transition',
                  'hover:border-brand-400 hover:bg-slate-50',
                  selected
                    ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-200'
                    : 'border-slate-200 bg-surface',
                )}
              >
                <ThemePreview colors={preview} />

                <span className="flex items-start gap-2">
                  <Icon
                    className={cn(
                      'mt-0.5 h-4 w-4 shrink-0',
                      selected ? 'text-brand-600' : 'text-slate-400',
                    )}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          'text-sm font-semibold',
                          selected ? 'text-brand-700' : 'text-slate-800',
                        )}
                      >
                        {option.label}
                      </span>
                      {selected && (
                        <Check className="h-3.5 w-3.5 shrink-0 text-brand-600" aria-hidden />
                      )}
                    </span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">
                      {option.description}
                    </span>
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {theme === 'auto' && (
          <p className="mt-3 text-xs text-slate-500">
            Tu dispositivo está en modo{' '}
            <span className="font-medium text-slate-700">
              {resolvedTheme === 'claro' ? 'claro' : 'oscuro'}
            </span>
            , así que se está usando ese tema.
          </p>
        )}
      </fieldset>

      {/* ------------------------------ Acento ------------------------------- */}
      <fieldset className="mt-7">
        <legend className="field-label mb-3">Color de acento</legend>
        <div
          role="radiogroup"
          aria-label="Color de acento"
          className="flex flex-wrap gap-2"
        >
          {ACCENT_OPTIONS.map((option) => {
            const selected = accent === option.value;

            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setAccent(option.value)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition',
                  'hover:border-brand-400 hover:bg-slate-50',
                  selected
                    ? 'border-brand-600 bg-brand-50 text-brand-700 ring-2 ring-brand-200'
                    : 'border-slate-200 bg-surface text-slate-700',
                )}
              >
                <span
                  className="h-4 w-4 shrink-0 rounded-full ring-1 ring-slate-900/10"
                  style={{ backgroundColor: option.swatch }}
                  aria-hidden
                />
                {option.label}
                {selected && <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-slate-500">
          El acento se aplica a botones, enlaces, iconos activos e indicadores. El resto de la
          interfaz mantiene sus colores.
        </p>
      </fieldset>
    </section>
  );
}
