'use client';

import { createElement, useId, type ReactNode } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export function SortableList({
  ids,
  onMove,
  children,
}: {
  ids: UniqueIdentifier[];
  onMove: (from: number, to: number) => void;
  children: ReactNode;
}) {
  const id = useId();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) {
      return;
    }
    const from = ids.indexOf(active.id);
    const to = ids.indexOf(over.id);
    if (from !== -1 && to !== -1) {
      onMove(from, to);
    }
  }

  return (
    <DndContext id={id} sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  );
}

export function moveItem<T>(items: T[], from: number, to: number): T[] {
  const result = [...items];
  const [item] = result.splice(from, 1);
  result.splice(to, 0, item);
  return result;
}

export function SortableItem({
  id,
  label,
  as,
  disabled = false,
  className,
  onClick,
  children,
}: {
  id: UniqueIdentifier;
  label: string;
  as: 'div' | 'li' | 'tr';
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
  children: (handle: ReactNode) => ReactNode;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id, disabled });
  const handle = (
    <button
      {...attributes}
      {...listeners}
      ref={setActivatorNodeRef}
      type="button"
      disabled={disabled}
      aria-label={`Drag to reorder ${label}`}
      title={`Drag to reorder ${label}`}
      className="!cursor-grab px-2 py-1 font-bold active:!cursor-grabbing disabled:!cursor-not-allowed disabled:opacity-30"
      style={{ touchAction: 'none' }}
    >
      <span aria-hidden="true">&#x2630;</span>
    </button>
  );

  return createElement(
    as,
    {
      ref: setNodeRef,
      className,
      onClick,
      style: {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : undefined,
        position: isDragging ? 'relative' : undefined,
        zIndex: isDragging ? 1 : undefined,
      },
    },
    children(handle)
  );
}
