import type { ReactNode } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { cn } from '../../lib/cn';

interface SortableRowProps {
  id: string;
  draggable?: boolean;
  className?: string;
  children: ReactNode;
  label?: string;
}

export function SortableRow({
  id,
  draggable = true,
  className,
  children,
  label,
}: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: !draggable,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        'card flex items-start gap-2 p-4 transition sm:gap-3 sm:p-5',
        isDragging && 'z-10 opacity-90 shadow-lg ring-2 ring-brand-300',
        className,
      )}
    >
      {draggable && (
        <button
          type="button"
          className="mt-0.5 hidden h-8 w-6 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-slate-300 transition hover:bg-slate-100 hover:text-slate-500 active:cursor-grabbing sm:flex"
          aria-label={label ? `Arrastrar ${label} para reordenar` : 'Arrastrar para reordenar'}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5" aria-hidden />
        </button>
      )}
      {children}
    </div>
  );
}
