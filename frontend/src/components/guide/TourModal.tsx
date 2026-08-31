import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Info,
  LayoutDashboard,
  ListChecks,
  Sparkles,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { cn } from '../../lib/cn';
import { useGuide } from '../../context/GuideContext';

const STEPS = [
  {
    icon: LayoutDashboard,
    title: 'Organiza tu año escolar',
    body: 'Aquí registras tus Objetivos de Aprendizaje y ves cuántos están pendientes, en proceso o logrados.',
  },
  {
    icon: ListChecks,
    title: 'Arma tu estructura',
    body: 'Primero crea un curso (por ejemplo 1° Medio) y una asignatura. Después agrega unidades y, dentro de ellas, tus objetivos.',
  },
  {
    icon: Check,
    title: 'Haz el seguimiento',
    body: 'Cambia el estado de un objetivo con un clic, ordénalos arrastrando y usa los filtros para encontrar lo que necesitas.',
  },
  {
    icon: Sparkles,
    title: 'Explora sin miedo',
    body: 'Toca el icono ⓘ junto a cada campo para saber qué escribir, o activa el modo demo para probar todo con datos de ejemplo.',
  },
];

export function TourModal() {
  const { tourOpen, closeTour, requestDemo } = useGuide();
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (tourOpen) setStep(0);
  }, [tourOpen]);

  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];
  const Icon = current.icon;

  return (
    <Modal
      open={tourOpen}
      onClose={closeTour}
      title={`Paso ${step + 1} de ${STEPS.length}`}
      size="sm"
      footer={
        <>
          {step > 0 && (
            <Button
              variant="outline"
              onClick={() => setStep((s) => s - 1)}
              icon={<ArrowLeft className="h-4 w-4" aria-hidden />}
            >
              Anterior
            </Button>
          )}
          {isLast ? (
            <Button onClick={closeTour} icon={<Check className="h-4 w-4" aria-hidden />}>
              Comenzar
            </Button>
          ) : (
            <Button
              onClick={() => setStep((s) => s + 1)}
              icon={<ArrowRight className="h-4 w-4" aria-hidden />}
            >
              Siguiente
            </Button>
          )}
        </>
      }
    >
      <div className="text-center sm:text-left">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
            <Icon className="h-6 w-6" aria-hidden />
          </span>
          <div>
            <h3 className="text-base font-semibold text-slate-900">{current.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{current.body}</p>
          </div>
        </div>

        {isLast && (
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              className="shrink-0 justify-center whitespace-nowrap"
              onClick={() => {
                closeTour();
                requestDemo();
              }}
              icon={<Sparkles className="h-4 w-4" aria-hidden />}
            >
              Ver demo
            </Button>
            <p className="flex min-w-0 items-center justify-center gap-1.5 text-xs text-slate-500 sm:justify-start">
              <Info className="h-3.5 w-3.5 shrink-0" aria-hidden />
              También está en el botón Ayuda.
            </p>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between gap-3">
          <div className="flex gap-1.5" aria-hidden>
            {STEPS.map((_, index) => (
              <span
                key={index}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-200',
                  index === step ? 'w-6 bg-brand-600' : 'w-1.5 bg-slate-300',
                )}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={closeTour}
            className="rounded-lg px-1 text-xs font-medium text-slate-500 transition hover:text-slate-800"
          >
            Omitir tutorial
          </button>
        </div>
      </div>
    </Modal>
  );
}
