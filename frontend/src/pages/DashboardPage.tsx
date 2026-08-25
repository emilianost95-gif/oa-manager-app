import { Link } from 'react-router-dom';
import {
  BookOpen,
  CheckCircle2,
  Circle,
  Clock,
  GraduationCap,
  Layers,
  ListChecks,
  Plus,
  Upload,
} from 'lucide-react';
import { useDashboardStats } from '../hooks/useObjectives';
import { StatCard } from '../components/dashboard/StatCard';
import { ProgressBar, ProgressRing } from '../components/ui/ProgressBar';
import { EmptyState, ErrorState, StatSkeleton, Skeleton } from '../components/ui/Feedback';
import { StatusBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { formatDate } from '../lib/labels';

export function DashboardPage() {
  const { data, isLoading, isError, error, refetch } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatSkeleton key={i} />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-64 lg:col-span-1" />
          <Skeleton className="h-64 lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return <ErrorState message={error?.message} onRetry={() => void refetch()} />;
  }

  const { totals, byPriority, bySubject, recent } = data;

  if (totals.objectives === 0) {
    return (
      <EmptyState
        icon={<ListChecks className="h-7 w-7" aria-hidden />}
        title="Aún no tienes objetivos cargados"
        description="Empieza creando un curso y una asignatura, o importa tus Objetivos de Aprendizaje desde un archivo Excel o CSV."
        action={
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link to="/objetivos">
              <Button icon={<Plus className="h-4 w-4" aria-hidden />}>Crear objetivo</Button>
            </Link>
            <Link to="/importar">
              <Button variant="outline" icon={<Upload className="h-4 w-4" aria-hidden />}>
                Importar desde archivo
              </Button>
            </Link>
          </div>
        }
      />
    );
  }

  const distribution = [
    { label: 'Pendientes', value: totals.pending, className: 'bg-slate-400' },
    { label: 'En proceso', value: totals.inProgress, className: 'bg-amber-500' },
    { label: 'Logrados', value: totals.completed, className: 'bg-emerald-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Objetivos totales" value={totals.objectives} icon={ListChecks} tone="brand" />
        <StatCard label="Pendientes" value={totals.pending} icon={Circle} tone="slate" />
        <StatCard label="En proceso" value={totals.inProgress} icon={Clock} tone="amber" />
        <StatCard label="Logrados" value={totals.completed} icon={CheckCircle2} tone="emerald" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="card flex flex-col items-center justify-center p-6">
          <h2 className="mb-4 self-start text-sm font-semibold text-slate-900">Progreso general</h2>
          <ProgressRing value={totals.progress} />
          <p className="mt-4 text-center text-sm text-slate-500">
            {totals.completed} de {totals.objectives} objetivos logrados
          </p>

          <div className="mt-6 w-full space-y-3">
            {distribution.map((item) => (
              <div key={item.label}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-slate-600">
                    <span className={`h-2 w-2 rounded-full ${item.className}`} aria-hidden />
                    {item.label}
                  </span>
                  <span className="font-semibold tabular-nums text-slate-700">{item.value}</span>
                </div>
                <ProgressBar
                  size="sm"
                  value={totals.objectives ? (item.value / totals.objectives) * 100 : 0}
                  barClassName={item.className}
                />
              </div>
            ))}
          </div>
        </section>

        <section className="card p-6 lg:col-span-2">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-slate-900">Progreso por asignatura</h2>
            <Link
              to="/asignaturas"
              className="text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              Ver todas
            </Link>
          </div>

          {bySubject.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              Todavía no hay asignaturas creadas.
            </p>
          ) : (
            <ul className="space-y-4">
              {bySubject.map((subject) => (
                <li key={subject.id}>
                  <Link to={`/asignaturas/${subject.id}`} className="block group">
                    <div className="mb-1.5 flex items-center justify-between gap-3">
                      <span className="flex min-w-0 items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: subject.color }}
                          aria-hidden
                        />
                        <span className="truncate text-sm font-medium text-slate-700 group-hover:text-brand-700">
                          {subject.name}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs text-slate-500 tabular-nums">
                        {subject.completed}/{subject.total}
                      </span>
                    </div>
                    <ProgressBar value={subject.progress} showLabel color={subject.color} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Asignaturas" value={totals.subjects} icon={BookOpen} tone="violet" />
        <StatCard label="Unidades" value={totals.units} icon={Layers} tone="brand" />
        <StatCard label="Cursos" value={totals.courses} icon={GraduationCap} tone="slate" />
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-3">
        <section className="card p-6">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Objetivos por prioridad</h2>
          <ul className="space-y-4">
            {(
              [
                ['Alta', byPriority.HIGH, 'bg-rose-500'],
                ['Media', byPriority.MEDIUM, 'bg-indigo-500'],
                ['Baja', byPriority.LOW, 'bg-sky-500'],
              ] as const
            ).map(([label, value, color]) => (
              <li key={label}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-slate-600">{label}</span>
                  <span className="font-semibold tabular-nums text-slate-700">{value}</span>
                </div>
                <ProgressBar
                  size="sm"
                  value={totals.objectives ? (value / totals.objectives) * 100 : 0}
                  barClassName={color}
                />
              </li>
            ))}
          </ul>
        </section>

        <section className="card p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-slate-900">Actividad reciente</h2>
            <Link to="/objetivos" className="text-sm font-medium text-brand-600 hover:text-brand-700">
              Ver objetivos
            </Link>
          </div>
          <ul className="divide-y divide-slate-100">
            {recent.map((objective) => (
              <li key={objective.id} className="flex items-center gap-3 py-3">
                <span
                  className="hidden h-8 w-1 shrink-0 rounded-full sm:block"
                  style={{ backgroundColor: objective.subject.color }}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">
                    <span className="font-mono text-xs text-slate-500">{objective.code}</span>{' '}
                    {objective.title}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {objective.subject.name} · {objective.course.name} ·{' '}
                    {formatDate(objective.updatedAt)}
                  </p>
                </div>
                <StatusBadge status={objective.status} />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
