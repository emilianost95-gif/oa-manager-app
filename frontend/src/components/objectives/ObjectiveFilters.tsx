import { Search, SlidersHorizontal, X } from 'lucide-react';
import { cn } from '../../lib/cn';
import { Button } from '../ui/Button';
import { Select } from '../ui/Field';
import {
  PRIORITY_LABEL,
  PRIORITY_ORDER,
  SORT_OPTIONS,
  STATUS_LABEL,
  STATUS_ORDER,
} from '../../lib/labels';
import type {
  Course,
  ObjectiveFiltersState,
  ObjectivePriority,
  ObjectiveStatus,
  Subject,
  Unit,
} from '../../types';

interface ObjectiveFiltersProps {
  filters: ObjectiveFiltersState;
  onChange: (filters: ObjectiveFiltersState) => void;
  onReset: () => void;
  courses: Course[];
  subjects: Subject[];
  units: Unit[];
  activeCount: number;
  expanded: boolean;
  onToggleExpanded: () => void;
}

export function ObjectiveFilters({
  filters,
  onChange,
  onReset,
  courses,
  subjects,
  units,
  activeCount,
  expanded,
  onToggleExpanded,
}: ObjectiveFiltersProps) {
  const set = <K extends keyof ObjectiveFiltersState>(
    key: K,
    value: ObjectiveFiltersState[K],
  ) => onChange({ ...filters, [key]: value });

  const toggleStatus = (status: ObjectiveStatus) =>
    set(
      'status',
      filters.status.includes(status)
        ? filters.status.filter((s) => s !== status)
        : [...filters.status, status],
    );

  const togglePriority = (priority: ObjectivePriority) =>
    set(
      'priority',
      filters.priority.includes(priority)
        ? filters.priority.filter((p) => p !== priority)
        : [...filters.priority, priority],
    );

  // Las unidades disponibles dependen de la asignatura y curso elegidos.
  const availableUnits = units.filter(
    (u) =>
      (!filters.subjectId || u.subjectId === filters.subjectId) &&
      (!filters.courseId || u.courseId === filters.courseId),
  );

  return (
    <section className="card p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <input
            type="search"
            value={filters.search}
            onChange={(e) => set('search', e.target.value)}
            placeholder="Buscar por código, título, descripción u observaciones..."
            className="input-base pl-10"
            aria-label="Buscar objetivos"
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant={expanded ? 'primary' : 'outline'}
            onClick={onToggleExpanded}
            icon={<SlidersHorizontal className="h-4 w-4" aria-hidden />}
            className="flex-1 sm:flex-none"
          >
            Filtros
            {activeCount > 0 && (
              <span
                className={cn(
                  'ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold',
                  expanded ? 'bg-white/25 text-white' : 'bg-brand-100 text-brand-700',
                )}
              >
                {activeCount}
              </span>
            )}
          </Button>

          {activeCount > 0 && (
            <Button
              variant="ghost"
              onClick={onReset}
              icon={<X className="h-4 w-4" aria-hidden />}
              title="Limpiar filtros"
            >
              Limpiar
            </Button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="mt-5 space-y-5 border-t border-slate-100 pt-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Select
              label="Curso"
              value={filters.courseId}
              onChange={(e) => onChange({ ...filters, courseId: e.target.value, unitId: '' })}
            >
              <option value="">Todos los cursos</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>

            <Select
              label="Asignatura"
              value={filters.subjectId}
              onChange={(e) => onChange({ ...filters, subjectId: e.target.value, unitId: '' })}
            >
              <option value="">Todas las asignaturas</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>

            <Select
              label="Unidad"
              value={filters.unitId}
              onChange={(e) => set('unitId', e.target.value)}
            >
              <option value="">Todas las unidades</option>
              {availableUnits.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} · {u.course.name}
                </option>
              ))}
            </Select>

            <div className="grid grid-cols-[1fr_auto] gap-2">
              <Select
                label="Ordenar por"
                value={filters.sort}
                onChange={(e) =>
                  set('sort', e.target.value as ObjectiveFiltersState['sort'])
                }
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
              <Select
                label="Dirección"
                value={filters.direction}
                onChange={(e) => set('direction', e.target.value as 'asc' | 'desc')}
                className="w-24"
              >
                <option value="asc">Asc.</option>
                <option value="desc">Desc.</option>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <fieldset>
              <legend className="field-label">Estado</legend>
              <div className="flex flex-wrap gap-2">
                {STATUS_ORDER.map((status) => {
                  const active = filters.status.includes(status);
                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() => toggleStatus(status)}
                      aria-pressed={active}
                      className={cn(
                        'rounded-full border px-3.5 py-1.5 text-sm font-medium transition',
                        active
                          ? 'border-brand-600 bg-brand-600 text-white'
                          : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50',
                      )}
                    >
                      {STATUS_LABEL[status]}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <fieldset>
              <legend className="field-label">Prioridad</legend>
              <div className="flex flex-wrap gap-2">
                {PRIORITY_ORDER.map((priority) => {
                  const active = filters.priority.includes(priority);
                  return (
                    <button
                      key={priority}
                      type="button"
                      onClick={() => togglePriority(priority)}
                      aria-pressed={active}
                      className={cn(
                        'rounded-full border px-3.5 py-1.5 text-sm font-medium transition',
                        active
                          ? 'border-brand-600 bg-brand-600 text-white'
                          : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50',
                      )}
                    >
                      {PRIORITY_LABEL[priority]}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </div>
        </div>
      )}
    </section>
  );
}
