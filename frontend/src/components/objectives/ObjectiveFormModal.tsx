import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Save } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Select, TextArea, TextInput } from '../ui/Field';
import { PRIORITY_LABEL, PRIORITY_ORDER, STATUS_LABEL, STATUS_ORDER } from '../../lib/labels';
import { ApiError } from '../../lib/api';
import { HELP } from '../../lib/helpContent';
import type {
  Course,
  LearningObjective,
  ObjectivePriority,
  ObjectiveStatus,
  Subject,
  Unit,
} from '../../types';
import type { ObjectivePayload } from '../../hooks/useObjectives';

interface ObjectiveFormModalProps {
  open: boolean;
  onClose: () => void;
  objective: LearningObjective | null;
  courses: Course[];
  subjects: Subject[];
  units: Unit[];
  saving: boolean;
  onSubmit: (payload: ObjectivePayload) => Promise<unknown>;
  defaults?: { subjectId?: string; courseId?: string; unitId?: string };
}

interface FormState {
  code: string;
  title: string;
  description: string;
  notes: string;
  subjectId: string;
  courseId: string;
  unitId: string;
  status: ObjectiveStatus;
  priority: ObjectivePriority;
}

const EMPTY: FormState = {
  code: '',
  title: '',
  description: '',
  notes: '',
  subjectId: '',
  courseId: '',
  unitId: '',
  status: 'PENDING',
  priority: 'MEDIUM',
};

export function ObjectiveFormModal({
  open,
  onClose,
  objective,
  courses,
  subjects,
  units,
  saving,
  onSubmit,
  defaults,
}: ObjectiveFormModalProps) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (objective) {
      setForm({
        code: objective.code,
        title: objective.title,
        description: objective.description ?? '',
        notes: objective.notes ?? '',
        subjectId: objective.subjectId,
        courseId: objective.courseId,
        unitId: objective.unitId ?? '',
        status: objective.status,
        priority: objective.priority,
      });
    } else {
      setForm({
        ...EMPTY,
        subjectId: defaults?.subjectId ?? '',
        courseId: defaults?.courseId ?? '',
        unitId: defaults?.unitId ?? '',
      });
    }
  }, [open, objective, defaults]);

  const availableUnits = useMemo(
    () =>
      units.filter(
        (u) =>
          (!form.subjectId || u.subjectId === form.subjectId) &&
          (!form.courseId || u.courseId === form.courseId),
      ),
    [units, form.subjectId, form.courseId],
  );

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!form.code.trim()) next.code = 'El código del OA es obligatorio.';
    if (form.title.trim().length < 3) next.title = 'El título debe tener al menos 3 caracteres.';
    if (!form.subjectId) next.subjectId = 'Elige una asignatura.';
    if (!form.courseId) next.courseId = 'Elige un curso.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    try {
      await onSubmit({
        code: form.code.trim(),
        title: form.title.trim(),
        description: form.description.trim() || null,
        notes: form.notes.trim() || null,
        subjectId: form.subjectId,
        courseId: form.courseId,
        unitId: form.unitId || null,
        status: form.status,
        priority: form.priority,
      });
      onClose();
    } catch (error) {
      if (error instanceof ApiError) setErrors(error.fieldErrors);
    }
  };

  return (
    <Modal
      open={open}
      onClose={saving ? () => undefined : onClose}
      title={objective ? 'Editar objetivo' : 'Nuevo objetivo de aprendizaje'}
      description={
        objective
          ? 'Modifica los datos y guarda los cambios.'
          : 'Completa los datos del objetivo. Los campos con * son obligatorios.'
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            form="objective-form"
            type="submit"
            loading={saving}
            loadingText="Guardando..."
            icon={<Save className="h-4 w-4" aria-hidden />}
          >
            {objective ? 'Guardar cambios' : 'Crear objetivo'}
          </Button>
        </>
      }
    >
      <form id="objective-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
          <TextInput
            label="Código del OA"
            help={HELP.objectiveCode}
            placeholder="OA1"
            value={form.code}
            onChange={(e) => set('code', e.target.value)}
            error={errors.code}
            required
          />
          <TextInput
            label="Título"
            help={HELP.objectiveTitle}
            placeholder="Resolver problemas con números racionales"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            error={errors.title}
            required
          />
        </div>

        <TextArea
          label="Descripción"
          help={HELP.objectiveDescription}
          placeholder="Detalle del objetivo, habilidades y contenidos asociados."
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          error={errors.description}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Curso"
            help={HELP.objectiveCourse}
            value={form.courseId}
            onChange={(e) => setForm((p) => ({ ...p, courseId: e.target.value, unitId: '' }))}
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

          <Select
            label="Asignatura"
            help={HELP.objectiveSubject}
            value={form.subjectId}
            onChange={(e) => setForm((p) => ({ ...p, subjectId: e.target.value, unitId: '' }))}
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
        </div>

        <Select
          label="Unidad"
          help={HELP.objectiveUnit}
          value={form.unitId}
          onChange={(e) => set('unitId', e.target.value)}
          error={errors.unitId}
          hint={
            form.subjectId && form.courseId && availableUnits.length === 0
              ? 'Todavía no hay unidades para esa asignatura y curso. Puedes crearlas en la sección Unidades.'
              : 'Opcional: si no eliges unidad, el objetivo queda sin asignar.'
          }
        >
          <option value="">Sin unidad</option>
          {availableUnits.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </Select>

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Prioridad"
            help={HELP.objectivePriority}
            value={form.priority}
            onChange={(e) => set('priority', e.target.value as ObjectivePriority)}
          >
            {PRIORITY_ORDER.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABEL[p]}
              </option>
            ))}
          </Select>

          <Select
            label="Estado"
            help={HELP.objectiveStatus}
            value={form.status}
            onChange={(e) => set('status', e.target.value as ObjectiveStatus)}
          >
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </Select>
        </div>

        <TextArea
          label="Observaciones"
          help={HELP.objectiveNotes}
          placeholder="Notas para el seguimiento, recursos, recordatorios..."
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          error={errors.notes}
        />
      </form>
    </Modal>
  );
}
