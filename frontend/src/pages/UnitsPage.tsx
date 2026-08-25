import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Info, Layers, ListChecks, Pencil, Plus, Save, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCourses, useSubjects, useUnitMutations, useUnits } from '../hooks/useCatalog';
import { SortableList } from '../components/objectives/SortableList';
import { SortableRow } from '../components/catalog/SortableRow';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Select, TextArea, TextInput } from '../components/ui/Field';
import { ProgressBar } from '../components/ui/ProgressBar';
import { EmptyState, ErrorState, ListSkeleton } from '../components/ui/Feedback';
import { ApiError } from '../lib/api';
import type { Unit } from '../types';

export function UnitsPage() {
  const [subjectId, setSubjectId] = useState('');
  const [courseId, setCourseId] = useState('');

  const filters = useMemo(
    () => ({ subjectId: subjectId || undefined, courseId: courseId || undefined }),
    [subjectId, courseId],
  );

  const { data, isLoading, isError, error, refetch } = useUnits(filters);
  const { data: subjects = [] } = useSubjects();
  const { data: courses = [] } = useCourses();
  const { create, update, remove, reorder } = useUnitMutations();

  const [ordered, setOrdered] = useState<Unit[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Unit | null>(null);
  const [deleting, setDeleting] = useState<Unit | null>(null);
  const [form, setForm] = useState({ name: '', description: '', subjectId: '', courseId: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (data) setOrdered(data);
  }, [data]);

  const catalogReady = subjects.length > 0 && courses.length > 0;

  // Sólo se puede reordenar dentro de una misma asignatura y curso.
  const canDrag = Boolean(subjectId && courseId);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '', subjectId, courseId });
    setErrors({});
    setFormOpen(true);
  };

  const openEdit = (unit: Unit) => {
    setEditing(unit);
    setForm({
      name: unit.name,
      description: unit.description ?? '',
      subjectId: unit.subjectId,
      courseId: unit.courseId,
    });
    setErrors({});
    setFormOpen(true);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = 'El nombre de la unidad es obligatorio.';
    if (!form.subjectId) next.subjectId = 'Elige una asignatura.';
    if (!form.courseId) next.courseId = 'Elige un curso.';
    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      subjectId: form.subjectId,
      courseId: form.courseId,
    };

    try {
      if (editing) await update.mutateAsync({ id: editing.id, ...payload });
      else await create.mutateAsync(payload);
      setFormOpen(false);
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.fieldErrors);
    }
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Unidades</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Cada unidad pertenece a una asignatura y a un curso.
          </p>
        </div>
        <Button
          onClick={openCreate}
          disabled={!catalogReady}
          title={catalogReady ? undefined : 'Primero crea al menos un curso y una asignatura'}
          icon={<Plus className="h-4 w-4" aria-hidden />}
        >
          Nueva unidad
        </Button>
      </header>

      {!catalogReady && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>
            Para crear unidades necesitas al menos un{' '}
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

      <section className="card grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
        <Select
          label="Asignatura"
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
        >
          <option value="">Todas las asignaturas</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
        <Select label="Curso" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
          <option value="">Todos los cursos</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </section>

      {!canDrag && ordered.length > 1 && (
        <p className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-xs text-slate-600">
          <Info className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Selecciona una asignatura y un curso para poder reordenar las unidades arrastrándolas.
        </p>
      )}

      {isLoading ? (
        <ListSkeleton count={3} />
      ) : isError ? (
        <ErrorState message={error?.message} onRetry={() => void refetch()} />
      ) : ordered.length === 0 ? (
        <EmptyState
          icon={<Layers className="h-7 w-7" aria-hidden />}
          title="Aún no hay unidades"
          description="Crea unidades para agrupar los objetivos dentro de cada asignatura."
          action={
            <Button
              onClick={openCreate}
              disabled={!catalogReady}
              icon={<Plus className="h-4 w-4" aria-hidden />}
            >
              Crear unidad
            </Button>
          }
        />
      ) : (
        <SortableList
          items={ordered}
          disabled={!canDrag}
          onReorder={(items, ids) => {
            setOrdered(items);
            reorder.mutate(ids);
          }}
        >
          <div className="space-y-3">
            {ordered.map((unit) => (
              <SortableRow key={unit.id} id={unit.id} draggable={canDrag} label={unit.name}>
                <span
                  className="mt-1 hidden h-10 w-1.5 shrink-0 rounded-full sm:block"
                  style={{ backgroundColor: unit.subject.color }}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold text-slate-900">{unit.name}</h3>
                  {unit.description && (
                    <p className="mt-1 text-sm text-slate-600">{unit.description}</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-500">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5">
                      {unit.subject.name}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5">{unit.course.name}</span>
                    <span className="inline-flex items-center gap-1.5">
                      <ListChecks className="h-3.5 w-3.5" aria-hidden />
                      {unit.objectiveCount} {unit.objectiveCount === 1 ? 'objetivo' : 'objetivos'}
                    </span>
                  </div>
                  {unit.objectiveCount > 0 && (
                    <ProgressBar
                      className="mt-3 max-w-md"
                      value={unit.progress}
                      color={unit.subject.color}
                      showLabel
                      size="sm"
                    />
                  )}
                </div>

                <div className="flex shrink-0 gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => openEdit(unit)}
                    aria-label={`Editar ${unit.name}`}
                  >
                    <Pencil className="h-4 w-4" aria-hidden />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-rose-600 hover:bg-rose-50"
                    onClick={() => setDeleting(unit)}
                    aria-label={`Eliminar ${unit.name}`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </Button>
                </div>
              </SortableRow>
            ))}
          </div>
        </SortableList>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Editar unidad' : 'Nueva unidad'}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancelar
            </Button>
            <Button
              form="unit-form"
              type="submit"
              loading={create.isPending || update.isPending}
              loadingText="Guardando..."
              icon={<Save className="h-4 w-4" aria-hidden />}
            >
              Guardar
            </Button>
          </>
        }
      >
        <form id="unit-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
          <TextInput
            label="Nombre"
            placeholder="Unidad 1 — Números"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            error={errors.name}
            required
          />
          <Select
            label="Asignatura"
            value={form.subjectId}
            onChange={(e) => setForm((p) => ({ ...p, subjectId: e.target.value }))}
            error={errors.subjectId}
            required
          >
            <option value="">Selecciona una asignatura</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
          <Select
            label="Curso"
            value={form.courseId}
            onChange={(e) => setForm((p) => ({ ...p, courseId: e.target.value }))}
            error={errors.courseId}
            required
          >
            <option value="">Selecciona un curso</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <TextArea
            label="Descripción"
            placeholder="Contenidos y habilidades de la unidad."
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            error={errors.description}
          />
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Eliminar unidad"
        message={`¿Seguro que deseas eliminar "${deleting?.name}"? Los ${deleting?.objectiveCount ?? 0} objetivos de esta unidad quedarán sin unidad asignada.`}
        loading={remove.isPending}
        onConfirm={() =>
          deleting && remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) })
        }
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
