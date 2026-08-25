import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ChevronRight, Layers, ListChecks, Pencil, Plus, Save, Trash2 } from 'lucide-react';
import { useSubjectMutations, useSubjects } from '../hooks/useCatalog';
import { SortableList } from '../components/objectives/SortableList';
import { SortableRow } from '../components/catalog/SortableRow';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { TextArea, TextInput } from '../components/ui/Field';
import { ProgressBar } from '../components/ui/ProgressBar';
import { EmptyState, ErrorState, ListSkeleton } from '../components/ui/Feedback';
import { ApiError } from '../lib/api';
import { cn } from '../lib/cn';
import type { Subject } from '../types';

const COLORS = [
  '#2563eb',
  '#7c3aed',
  '#db2777',
  '#ea580c',
  '#059669',
  '#0891b2',
  '#ca8a04',
  '#475569',
];

export function SubjectsPage() {
  const { data, isLoading, isError, error, refetch } = useSubjects();
  const { create, update, remove, reorder } = useSubjectMutations();

  const [ordered, setOrdered] = useState<Subject[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [deleting, setDeleting] = useState<Subject | null>(null);
  const [form, setForm] = useState({ name: '', description: '', color: COLORS[0] });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (data) setOrdered(data);
  }, [data]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '', color: COLORS[ordered.length % COLORS.length] });
    setErrors({});
    setFormOpen(true);
  };

  const openEdit = (subject: Subject) => {
    setEditing(subject);
    setForm({
      name: subject.name,
      description: subject.description ?? '',
      color: subject.color,
    });
    setErrors({});
    setFormOpen(true);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setErrors({ name: 'El nombre de la asignatura es obligatorio.' });
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      color: form.color,
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
          <h2 className="text-xl font-bold text-slate-900">Asignaturas</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Cada asignatura agrupa sus unidades y objetivos.
          </p>
        </div>
        <Button onClick={openCreate} icon={<Plus className="h-4 w-4" aria-hidden />}>
          Nueva asignatura
        </Button>
      </header>

      {isLoading ? (
        <ListSkeleton count={3} />
      ) : isError ? (
        <ErrorState message={error?.message} onRetry={() => void refetch()} />
      ) : ordered.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-7 w-7" aria-hidden />}
          title="Aún no hay asignaturas"
          description="Crea tu primera asignatura para empezar a organizar unidades y objetivos."
          action={
            <Button onClick={openCreate} icon={<Plus className="h-4 w-4" aria-hidden />}>
              Crear asignatura
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
          <div className="grid gap-3">
            {ordered.map((subject) => (
              <SortableRow key={subject.id} id={subject.id} label={subject.name}>
                <span
                  className="mt-1 hidden h-10 w-1.5 shrink-0 rounded-full sm:block"
                  style={{ backgroundColor: subject.color }}
                  aria-hidden
                />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full sm:hidden"
                      style={{ backgroundColor: subject.color }}
                      aria-hidden
                    />
                    <Link
                      to={`/asignaturas/${subject.id}`}
                      className="text-base font-semibold text-slate-900 hover:text-brand-700"
                    >
                      {subject.name}
                    </Link>
                  </div>

                  {subject.description && (
                    <p className="mt-1 text-sm text-slate-600">{subject.description}</p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5" aria-hidden />
                      {subject.unitCount} {subject.unitCount === 1 ? 'unidad' : 'unidades'}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <ListChecks className="h-3.5 w-3.5" aria-hidden />
                      {subject.objectiveCount}{' '}
                      {subject.objectiveCount === 1 ? 'objetivo' : 'objetivos'}
                    </span>
                  </div>

                  {subject.objectiveCount > 0 && (
                    <ProgressBar
                      className="mt-3 max-w-md"
                      value={subject.progress}
                      color={subject.color}
                      showLabel
                      size="sm"
                    />
                  )}
                </div>

                <div className="flex shrink-0 gap-1">
                  <Link to={`/asignaturas/${subject.id}`} className="hidden sm:block">
                    <Button size="icon" variant="ghost" aria-label={`Ver ${subject.name}`}>
                      <ChevronRight className="h-4 w-4" aria-hidden />
                    </Button>
                  </Link>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => openEdit(subject)}
                    aria-label={`Editar ${subject.name}`}
                  >
                    <Pencil className="h-4 w-4" aria-hidden />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-rose-600 hover:bg-rose-50"
                    onClick={() => setDeleting(subject)}
                    aria-label={`Eliminar ${subject.name}`}
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
        title={editing ? 'Editar asignatura' : 'Nueva asignatura'}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancelar
            </Button>
            <Button
              form="subject-form"
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
        <form id="subject-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
          <TextInput
            label="Nombre"
            placeholder="Matemática"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            error={errors.name}
            required
          />
          <TextArea
            label="Descripción"
            placeholder="Pensamiento lógico, algebraico y análisis de datos."
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            error={errors.description}
          />
          <fieldset>
            <legend className="field-label">Color</legend>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, color }))}
                  aria-label={`Color ${color}`}
                  aria-pressed={form.color === color}
                  className={cn(
                    'h-9 w-9 rounded-full ring-offset-2 transition',
                    form.color === color ? 'ring-2 ring-slate-900' : 'hover:scale-110',
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </fieldset>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Eliminar asignatura"
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
