import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Info, ListChecks, Plus, Upload } from 'lucide-react';
import { useObjectiveMutations, useObjectives, EMPTY_FILTERS } from '../hooks/useObjectives';
import { countActiveFilters } from '../hooks/useObjectives';
import { useCourses, useSubjects, useUnits } from '../hooks/useCatalog';
import { useDebounce } from '../hooks/useDebounce';
import { ObjectiveFilters } from '../components/objectives/ObjectiveFilters';
import { ObjectiveCard } from '../components/objectives/ObjectiveCard';
import { ObjectiveFormModal } from '../components/objectives/ObjectiveFormModal';
import { SortableList } from '../components/objectives/SortableList';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState, ErrorState, ListSkeleton } from '../components/ui/Feedback';
import { nextStatus } from '../lib/labels';
import type { LearningObjective, ObjectiveFiltersState } from '../types';

export function ObjectivesPage() {
  const [filters, setFilters] = useState<ObjectiveFiltersState>(EMPTY_FILTERS);
  const [expanded, setExpanded] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<LearningObjective | null>(null);
  const [deleting, setDeleting] = useState<LearningObjective | null>(null);
  const [statusPendingId, setStatusPendingId] = useState<string | null>(null);
  const [ordered, setOrdered] = useState<LearningObjective[]>([]);

  const debouncedSearch = useDebounce(filters.search, 350);
  const queryFilters = useMemo(
    () => ({ ...filters, search: debouncedSearch }),
    [filters, debouncedSearch],
  );

  const { data, isLoading, isError, error, refetch, isFetching } = useObjectives(queryFilters);
  const { data: courses = [] } = useCourses();
  const { data: subjects = [] } = useSubjects();
  const { data: units = [] } = useUnits();
  const mutations = useObjectiveMutations();

  useEffect(() => {
    if (data?.items) setOrdered(data.items);
  }, [data?.items]);

  const canDrag = filters.sort === 'order' && filters.direction === 'asc';
  const activeCount = countActiveFilters(queryFilters);
  const catalogReady = courses.length > 0 && subjects.length > 0;

  const handleReorder = (items: LearningObjective[], ids: string[]) => {
    setOrdered(items);
    mutations.reorder.mutate(ids);
  };

  const handleCycleStatus = (objective: LearningObjective) => {
    setStatusPendingId(objective.id);
    mutations.changeStatus.mutate(
      { id: objective.id, status: nextStatus(objective.status) },
      { onSettled: () => setStatusPendingId(null) },
    );
  };

  const handleDelete = () => {
    if (!deleting) return;
    mutations.remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) });
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Objetivos de Aprendizaje</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {data ? `${data.total} objetivo${data.total === 1 ? '' : 's'}` : 'Cargando...'}
            {activeCount > 0 && ' con los filtros aplicados'}
          </p>
        </div>

        <div className="flex gap-2">
          <Link to="/importar" className="flex-1 sm:flex-none">
            <Button variant="outline" className="w-full justify-center" icon={<Upload className="h-4 w-4" aria-hidden />}>
              Importar
            </Button>
          </Link>
          <Button
            className="flex-1 justify-center sm:flex-none"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            disabled={!catalogReady}
            title={catalogReady ? undefined : 'Primero crea al menos un curso y una asignatura'}
            icon={<Plus className="h-4 w-4" aria-hidden />}
          >
            Nuevo objetivo
          </Button>
        </div>
      </header>

      {!catalogReady && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>
            Para crear objetivos necesitas al menos un{' '}
            <Link to="/cursos" className="font-semibold underline">
              curso
            </Link>{' '}
            y una{' '}
            <Link to="/asignaturas" className="font-semibold underline">
              asignatura
            </Link>
            .
          </p>
        </div>
      )}

      <ObjectiveFilters
        filters={filters}
        onChange={setFilters}
        onReset={() => setFilters(EMPTY_FILTERS)}
        courses={courses}
        subjects={subjects}
        units={units}
        activeCount={activeCount}
        expanded={expanded}
        onToggleExpanded={() => setExpanded((v) => !v)}
      />

      {!canDrag && ordered.length > 1 && (
        <p className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-xs text-slate-600">
          <Info className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Para reordenar arrastrando, selecciona «Orden personalizado» ascendente en los filtros.
        </p>
      )}

      {isLoading ? (
        <ListSkeleton count={5} />
      ) : isError ? (
        <ErrorState message={error?.message} onRetry={() => void refetch()} />
      ) : ordered.length === 0 ? (
        <EmptyState
          icon={<ListChecks className="h-7 w-7" aria-hidden />}
          title={activeCount > 0 ? 'Sin resultados' : 'Aún no hay objetivos'}
          description={
            activeCount > 0
              ? 'Prueba ajustando o limpiando los filtros de búsqueda.'
              : 'Crea tu primer objetivo o impórtalos desde un archivo Excel o CSV.'
          }
          action={
            activeCount > 0 ? (
              <Button variant="outline" onClick={() => setFilters(EMPTY_FILTERS)}>
                Limpiar filtros
              </Button>
            ) : (
              <Button
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
                disabled={!catalogReady}
                icon={<Plus className="h-4 w-4" aria-hidden />}
              >
                Crear objetivo
              </Button>
            )
          }
        />
      ) : (
        <div className={isFetching ? 'opacity-70 transition-opacity' : 'transition-opacity'}>
          <SortableList
            items={ordered}
            onReorder={handleReorder}
            disabled={!canDrag}
            renderOverlay={(item) => (
              <div className="card p-5 shadow-xl ring-2 ring-brand-400">
                <p className="font-mono text-xs text-slate-500">{item.code}</p>
                <p className="mt-1 font-semibold text-slate-900">{item.title}</p>
              </div>
            )}
          >
            <div className="space-y-3">
              {ordered.map((objective) => (
                <ObjectiveCard
                  key={objective.id}
                  objective={objective}
                  draggable={canDrag}
                  statusPending={statusPendingId === objective.id}
                  onEdit={(o) => {
                    setEditing(o);
                    setFormOpen(true);
                  }}
                  onDelete={setDeleting}
                  onCycleStatus={handleCycleStatus}
                />
              ))}
            </div>
          </SortableList>
        </div>
      )}

      <ObjectiveFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        objective={editing}
        courses={courses}
        subjects={subjects}
        units={units}
        saving={mutations.create.isPending || mutations.update.isPending}
        onSubmit={(payload) =>
          editing
            ? mutations.update.mutateAsync({ id: editing.id, ...payload })
            : mutations.create.mutateAsync(payload)
        }
        defaults={{
          subjectId: filters.subjectId,
          courseId: filters.courseId,
          unitId: filters.unitId,
        }}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Eliminar objetivo"
        message={`¿Seguro que deseas eliminar "${deleting?.code} — ${deleting?.title}"? Esta acción no se puede deshacer.`}
        loading={mutations.remove.isPending}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
