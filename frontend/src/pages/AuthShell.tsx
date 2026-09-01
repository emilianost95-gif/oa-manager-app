import type { ReactNode } from 'react';
import { ListChecks } from 'lucide-react';

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <div className="hidden bg-brand-600 lg:flex lg:w-1/2 lg:flex-col lg:justify-between lg:p-12">
        <div className="flex items-center gap-3 text-on-accent">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
            <ListChecks className="h-6 w-6" aria-hidden />
          </span>
          <span className="text-lg font-semibold">Objetivos de Aprendizaje</span>
        </div>

        <div className="max-w-md text-on-accent">
          <h2 className="text-3xl font-bold leading-tight">
            Toda tu planificación, ordenada en un solo lugar.
          </h2>
          <p className="mt-4 text-brand-100">
            Crea asignaturas, cursos y unidades, arrastra tus objetivos para ordenarlos y sigue el
            avance del curso con indicadores claros.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-brand-50">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-surface" aria-hidden />
              Reordena objetivos arrastrando y el orden queda guardado.
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-surface" aria-hidden />
              Importa tus OA desde Excel o CSV.
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-surface" aria-hidden />
              Exporta lo que estás viendo en CSV, Excel o PDF.
            </li>
          </ul>
        </div>

        <p className="text-sm text-brand-200">Hecho para profesoras y profesores.</p>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-on-accent">
              <ListChecks className="h-6 w-6" aria-hidden />
            </span>
            <span className="text-lg font-semibold text-slate-900">Objetivos de Aprendizaje</span>
          </div>

          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          <p className="mt-1.5 mb-8 text-sm text-slate-500">{subtitle}</p>

          {children}

          <p className="mt-8 text-center text-sm text-slate-600">{footer}</p>
        </div>
      </div>
    </div>
  );
}
