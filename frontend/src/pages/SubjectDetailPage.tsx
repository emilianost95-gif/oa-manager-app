import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Circle, Clock, GraduationCap, Layers } from 'lucide-react';
import { useSubjectDetail } from '../hooks/useCatalog';
import { ProgressBar, ProgressRing } from '../components/ui/ProgressBar';
import { EmptyState, ErrorState, Skeleton } from '../components/ui/Feedback';
import { StatusBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export function SubjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError, error, refetch } = useSubjectDetail(id);

  if (isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-40" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (isError || !data) {
    return <ErrorState message={error?.message} onRetry={() => void refetch()} />;
  }

  const { stats } = data;

  return (
    <div className="space-y-5">
      <Link
        to="/asignaturas"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-brand-700"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Volver a asignaturas
      </Link>

      <section className="card overflow-hidden">
        <div className="h-2 w-full" style={{ backgroundColor: data.color }} aria-hidden />
        <div className="grid gap-6 p-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{data.name}</h2>
            {data.description && <p className="mt-1.5 text-sm text-slate-600">{data.description}</p>}

            {data.courses.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
                  <GraduationCap className="h-3.5 w-3.5" aria-hidden />
                  Cursos:
                </span>
                {data.courses.map((c) => (
                  <span
                    key={c.id}
                    className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
                  >
                    {c.name}
                  </span>
                ))}
              </div>
            )}

            <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: 'Unidades', value: stats.unitCount, icon: Layers },
                { label: 'Pendientes', value: stats.pending, icon: Circle },
                { label: 'En proceso', value: stats.inProgress, icon: Clock },
                { label: 'Logrados', value: stats.completed, icon: CheckCircle2 },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="rounded-xl bg-slate-50 p-3">
                  <dt className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                    {label}
                  </dt>
                  <dd className="mt-1 text-xl font-bold tabular-nums text-slate-900">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="flex justify-center lg:pl-6">
            <ProgressRing value={stats.progress} />
          </div>
        </div>
      </section>

      {data.units.length === 0 ? (
        <EmptyState
          icon={<Layers className="h-7 w-7" aria-hidden />}
          title="Esta asignatura aún no tiene unidades"
          description="Crea unidades para agrupar los objetivos de aprendizaje."
          action={
            <Link to="/unidades">
              <Button>Ir a Unidades</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {data.units.map((unit) => (
            <section key={unit.id} className="card p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-slate-900">{unit.name}</h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {unit.course.name} · {unit.completedCount}/{unit.objectiveCount} logrados
                  </p>
                </div>
                <ProgressBar
                  className="sm:w-56"
                  value={unit.progress}
                  color={data.color}
                  showLabel
                />
              </div>

              {unit.objectives.length === 0 ? (
                <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
                  Todavía no hay objetivos en esta unidad.
                </p>
              ) : (
                <ul className="mt-4 divide-y divide-slate-100">
                  {unit.objectives.map((objective) => (
                    <li
                      key={objective.id}
                      className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <p className="min-w-0 text-sm text-slate-800">
                        <span className="font-mono text-xs text-slate-500">{objective.code}</span>{' '}
                        {objective.title}
                      </p>
                      <StatusBadge status={objective.status} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          {stats.unassigned > 0 && (
            <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Hay {stats.unassigned} objetivo{stats.unassigned === 1 ? '' : 's'} de esta asignatura
              sin unidad asignada.{' '}
              <Link to={`/objetivos`} className="font-semibold underline">
                Revisarlos
              </Link>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
