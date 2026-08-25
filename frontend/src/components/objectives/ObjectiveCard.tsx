import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  BookOpen,
  GraduationCap,
  GripVertical,
  Layers,
  MessageSquareText,
  Pencil,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { cn } from '../../lib/cn';
import { PriorityBadge, StatusBadge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { nextStatus, STATUS_LABEL } from '../../lib/labels';
import type { LearningObjective } from '../../types';

interface ObjectiveCardProps {
  objective: LearningObjective;
  draggable: boolean;
  onEdit: (objective: LearningObjective) => void;
  onDelete: (objective: LearningObjective) => void;
  onCycleStatus: (objective: LearningObjective) => void;
  statusPending?: boolean;
}

export function ObjectiveCard({
  objective,
  draggable,
  onEdit,
  onDelete,
  onCycleStatus,
  statusPending = false,
}: ObjectiveCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: objective.id,
    disabled: !draggable,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={cn(
        'card group relative flex gap-2 p-4 transition sm:gap-3 sm:p-5',
        isDragging && 'z-10 opacity-90 shadow-lg ring-2 ring-brand-300',
      )}
    >
      {draggable && (
        <button
          type="button"
          className="mt-0.5 hidden h-8 w-6 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-slate-300 transition hover:bg-slate-100 hover:text-slate-500 active:cursor-grabbing sm:flex"
          aria-label={`Arrastrar ${objective.code} para reordenar`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5" aria-hidden />
        </button>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center rounded-lg px-2 py-0.5 font-mono text-xs font-semibold text-white"
            style={{ backgroundColor: objective.subject.color }}
          >
            {objective.code}
          </span>
          <StatusBadge status={objective.status} />
          <PriorityBadge priority={objective.priority} />
        </div>

        <h3 className="mt-2.5 text-base font-semibold leading-snug text-slate-900">
          {objective.title}
        </h3>

        {objective.description && (
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{objective.description}</p>
        )}

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5" aria-hidden />
            {objective.subject.name}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <GraduationCap className="h-3.5 w-3.5" aria-hidden />
            {objective.course.name}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5" aria-hidden />
            {objective.unit?.name ?? 'Sin unidad'}
          </span>
        </div>

        {objective.notes && (
          <p className="mt-3 flex gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
            <MessageSquareText className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
            <span>{objective.notes}</span>
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-2 sm:hidden">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onCycleStatus(objective)}
            loading={statusPending}
            icon={<RefreshCw className="h-3.5 w-3.5" aria-hidden />}
          >
            Cambiar estado
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(objective)}
            icon={<Pencil className="h-3.5 w-3.5" aria-hidden />}
          >
            Editar
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-rose-600 hover:bg-rose-50"
            onClick={() => onDelete(objective)}
            icon={<Trash2 className="h-3.5 w-3.5" aria-hidden />}
          >
            Eliminar
          </Button>
        </div>
      </div>

      <div className="hidden shrink-0 flex-col gap-1 sm:flex">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => onCycleStatus(objective)}
          loading={statusPending}
          title={`Marcar como "${STATUS_LABEL[nextStatus(objective.status)]}"`}
          aria-label={`Cambiar estado de ${objective.code}`}
        >
          {!statusPending && <RefreshCw className="h-4 w-4" aria-hidden />}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => onEdit(objective)}
          title="Editar objetivo"
          aria-label={`Editar ${objective.code}`}
        >
          <Pencil className="h-4 w-4" aria-hidden />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="text-rose-600 hover:bg-rose-50"
          onClick={() => onDelete(objective)}
          title="Eliminar objetivo"
          aria-label={`Eliminar ${objective.code}`}
        >
          <Trash2 className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </article>
  );
}
