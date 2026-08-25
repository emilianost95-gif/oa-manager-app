import type { ObjectivePriority, ObjectiveStatus } from '../types';

export const STATUS_LABEL: Record<ObjectiveStatus, string> = {
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En proceso',
  COMPLETED: 'Logrado',
};

export const STATUS_ORDER: ObjectiveStatus[] = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];

export const STATUS_STYLE: Record<ObjectiveStatus, string> = {
  PENDING: 'bg-slate-100 text-slate-700 ring-slate-200',
  IN_PROGRESS: 'bg-amber-100 text-amber-800 ring-amber-200',
  COMPLETED: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
};

export const STATUS_DOT: Record<ObjectiveStatus, string> = {
  PENDING: 'bg-slate-400',
  IN_PROGRESS: 'bg-amber-500',
  COMPLETED: 'bg-emerald-500',
};

export const PRIORITY_LABEL: Record<ObjectivePriority, string> = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
};

export const PRIORITY_ORDER: ObjectivePriority[] = ['LOW', 'MEDIUM', 'HIGH'];

export const PRIORITY_STYLE: Record<ObjectivePriority, string> = {
  LOW: 'bg-sky-50 text-sky-700 ring-sky-200',
  MEDIUM: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  HIGH: 'bg-rose-50 text-rose-700 ring-rose-200',
};

export const SORT_OPTIONS = [
  { value: 'order', label: 'Orden personalizado' },
  { value: 'code', label: 'Código' },
  { value: 'title', label: 'Título' },
  { value: 'status', label: 'Estado' },
  { value: 'priority', label: 'Prioridad' },
  { value: 'createdAt', label: 'Fecha de creación' },
  { value: 'updatedAt', label: 'Última modificación' },
] as const;

/** Siguiente estado en el ciclo Pendiente → En proceso → Logrado → Pendiente. */
export function nextStatus(status: ObjectiveStatus): ObjectiveStatus {
  const index = STATUS_ORDER.indexOf(status);
  return STATUS_ORDER[(index + 1) % STATUS_ORDER.length];
}

export function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
