import { Sparkles } from 'lucide-react';
import { useGuide } from '../../context/GuideContext';

/**
 * Aviso para las secciones que sólo tienen sentido con datos reales
 * (importar y exportar). No se muestra fuera del modo demo.
 */
export function DemoNotice({ feature }: { feature: string }) {
  const { isDemo, exitDemo } = useGuide();
  if (!isDemo) return null;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between">
      <p className="flex items-start gap-3">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <span>
          Estás en <span className="font-semibold">modo demo</span>. {feature} funciona sólo con tus
          datos reales.
        </span>
      </p>
      <button
        type="button"
        onClick={exitDemo}
        className="shrink-0 self-start rounded-xl border border-amber-300 bg-surface px-3 py-1.5 text-sm font-medium text-amber-900 transition hover:bg-amber-100 sm:self-auto"
      >
        Salir de demo
      </button>
    </div>
  );
}
