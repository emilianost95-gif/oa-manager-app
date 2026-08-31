import {
  BookOpen,
  Download,
  GraduationCap,
  Info,
  Layers,
  ListChecks,
  LogOut,
  PlayCircle,
  Sparkles,
  Upload,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useGuide } from '../../context/GuideContext';

const FEATURES = [
  {
    icon: GraduationCap,
    title: 'Cursos',
    body: 'Los niveles con los que trabajas, por ejemplo 1° Medio.',
  },
  {
    icon: BookOpen,
    title: 'Asignaturas',
    body: 'Las materias que impartes. Cada una tiene su color y su progreso.',
  },
  {
    icon: Layers,
    title: 'Unidades',
    body: 'Bloques de contenido dentro de una asignatura y un curso.',
  },
  {
    icon: ListChecks,
    title: 'Objetivos',
    body: 'El corazón de la app: código, título, estado y prioridad de cada OA.',
  },
  {
    icon: Upload,
    title: 'Importar',
    body: 'Carga tus objetivos desde un archivo CSV o Excel, con vista previa.',
  },
  {
    icon: Download,
    title: 'Exportar',
    body: 'Descarga lo que estás viendo en CSV, Excel o PDF.',
  },
];

export function HelpPanel() {
  const { helpOpen, closeHelp, isDemo, requestDemo, exitDemo, startTour } = useGuide();

  return (
    <Modal
      open={helpOpen}
      onClose={closeHelp}
      title="Ayuda"
      description="Todo lo necesario para empezar, en menos de un minuto."
      footer={
        <Button variant="outline" onClick={closeHelp}>
          Cerrar
        </Button>
      }
    >
      <div className="space-y-6">
        <section>
          <h3 className="text-sm font-semibold text-slate-900">¿Qué es esta aplicación?</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
            Un gestor para llevar el seguimiento de tus Objetivos de Aprendizaje. Organizas el
            contenido en <span className="font-medium text-slate-700">cursos</span>,{' '}
            <span className="font-medium text-slate-700">asignaturas</span> y{' '}
            <span className="font-medium text-slate-700">unidades</span>, y marcas cada objetivo
            como pendiente, en proceso o logrado.
          </p>
        </section>

        <section>
          <h3 className="text-sm font-semibold text-slate-900">Funciones principales</h3>
          <ul className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex gap-2.5 rounded-xl bg-slate-50 p-3">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden />
                <div>
                  <p className="text-sm font-medium text-slate-800">{title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-slate-200 p-3.5">
          <div className="flex gap-2.5">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden />
            <p className="text-sm leading-relaxed text-slate-600">
              ¿Dudas con un campo? Toca el icono{' '}
              <Info className="inline h-3.5 w-3.5 align-text-bottom text-slate-400" aria-hidden />{' '}
              que aparece junto a su nombre en los formularios: te explica qué escribir y muestra un
              ejemplo.
            </p>
          </div>
        </section>

        <section className="flex flex-col gap-2 sm:flex-row">
          {isDemo ? (
            <Button
              variant="outline"
              className="justify-center"
              onClick={() => {
                exitDemo();
                closeHelp();
              }}
              icon={<LogOut className="h-4 w-4" aria-hidden />}
            >
              Salir del modo demo
            </Button>
          ) : (
            <Button
              className="justify-center"
              onClick={requestDemo}
              icon={<Sparkles className="h-4 w-4" aria-hidden />}
            >
              Ver demo
            </Button>
          )}
          <Button
            variant="outline"
            className="justify-center"
            onClick={startTour}
            icon={<PlayCircle className="h-4 w-4" aria-hidden />}
          >
            Ver el tutorial otra vez
          </Button>
        </section>
      </div>
    </Modal>
  );
}
