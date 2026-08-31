import { useEffect, useState, type FormEvent } from 'react';
import { GraduationCap, Layers, ListChecks, Pencil, Plus, Save, Trash2 } from 'lucide-react';
import { useCourseMutations, useCourses } from '../hooks/useCatalog';
import { SortableList } from '../components/objectives/SortableList';
import { SortableRow } from '../components/catalog/SortableRow';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { TextArea, TextInput } from '../components/ui/Field';
import { EmptyState, ErrorState, ListSkeleton } from '../components/ui/Feedback';
import { ApiError } from '../lib/api';
import { HELP } from '../lib/helpContent';
import type { Course } from '../types';

export function CoursesPage() {
  const { data, isLoading, isError, error, refetch } = useCourses();
  const { create, update, remove, reorder } = useCourseMutations();

  const [ordered, setOrdered] = useState<Course[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [deleting, setDeleting] = useState<Course | null>(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (data) setOrdered(data);
  }, [data]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '' });
    setErrors({});
    setFormOpen(true);
  };

  const openEdit = (course: Course) => {
    setEditing(course);
    setForm({ name: course.name, description: course.description ?? '' });
    setErrors({});
    setFormOpen(true);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setErrors({ name: 'El nombre del curso es obligatorio.' });
      return;
    }

    const payload = { name: form.name.trim(), description: form.description.trim() || null };

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
          <h2 className="text-xl font-bold text-slate-900">Cursos</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Los niveles con los que trabajas, por ejemplo 1° Medio o 4° Medio.
          </p>
        </div>
        <Button onClick={openCreate} icon={<Plus className="h-4 w-4" aria-hidden />}>
          Nuevo curso
        </Button>
      </header>

      {isLoading ? (
        <ListSkeleton count={3} />
      ) : isError ? (
        <ErrorState message={error?.message} onRetry={() => void refetch()} />
      ) : ordered.length === 0 ? (
        <EmptyState
          icon={<GraduationCap className="h-7 w-7" aria-hidden />}
          title="Aún no hay cursos"
          description="Crea los niveles con los que trabajas para poder organizar tus objetivos."
          action={
            <Button onClick={openCreate} icon={<Plus className="h-4 w-4" aria-hidden />}>
              Crear curso
            </Button>
          }
        />
      ) : (
        <SortableList
          items={ordered}
          onReorder={(items, ids) => {
            setOrdered(items);
            reorder.mutate(ids);
          }}
        >
          <div className="space-y-3">
            {ordered.map((course) => (
              <SortableRow key={course.id} id={course.id} label={course.name}>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold text-slate-900">{course.name}</h3>
                  {course.description && (
                    <p className="mt-1 text-sm text-slate-600">{course.description}</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5" aria-hidden />
                      {course.unitCount} {course.unitCount === 1 ? 'unidad' : 'unidades'}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <ListChecks className="h-3.5 w-3.5" aria-hidden />
                      {course.objectiveCount}{' '}
                      {course.objectiveCount === 1 ? 'objetivo' : 'objetivos'}
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => openEdit(course)}
                    aria-label={`Editar ${course.name}`}
                  >
                    <Pencil className="h-4 w-4" aria-hidden />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-rose-600 hover:bg-rose-50"
                    onClick={() => setDeleting(course)}
                    aria-label={`Eliminar ${course.name}`}
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
        title={editing ? 'Editar curso' : 'Nuevo curso'}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancelar
            </Button>
            <Button
              form="course-form"
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
        <form id="course-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
          <TextInput
            label="Nombre"
            help={HELP.courseName}
            placeholder="4° Medio"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            error={errors.name}
            required
          />
          <TextArea
            label="Descripción"
            help={HELP.courseDescription}
            placeholder="Cuarto año de enseñanza media"
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            error={errors.description}
          />
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Eliminar curso"
        message={`¿Seguro que deseas eliminar "${deleting?.name}"? También se eliminarán sus ${deleting?.unitCount ?? 0} unidades y ${deleting?.objectiveCount ?? 0} objetivos asociados.`}
        loading={remove.isPending}
        onConfirm={() =>
          deleting && remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) })
        }
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
