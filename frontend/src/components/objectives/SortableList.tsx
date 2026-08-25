import { useState, type ReactNode } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

interface SortableListProps<T extends { id: string }> {
  items: T[];
  onReorder: (items: T[], ids: string[]) => void;
  disabled?: boolean;
  children: ReactNode;
  renderOverlay?: (item: T) => ReactNode;
}

/**
 * Contenedor genérico de drag & drop vertical.
 * Reutilizado por objetivos, unidades, asignaturas y cursos.
 */
export function SortableList<T extends { id: string }>({
  items,
  onReorder,
  disabled = false,
  children,
  renderOverlay,
}: SortableListProps<T>) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragStart = (event: DragStartEvent) => setActiveId(String(event.active.id));

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const next = arrayMove(items, oldIndex, newIndex);
    onReorder(
      next,
      next.map((i) => i.id),
    );
  };

  const activeItem = activeId ? items.find((i) => i.id === activeId) : null;

  if (disabled) return <>{children}</>;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
      <DragOverlay>{activeItem && renderOverlay ? renderOverlay(activeItem) : null}</DragOverlay>
    </DndContext>
  );
}
