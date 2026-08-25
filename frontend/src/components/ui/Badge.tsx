import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import {
  PRIORITY_LABEL,
  PRIORITY_STYLE,
  STATUS_DOT,
  STATUS_LABEL,
  STATUS_STYLE,
} from '../../lib/labels';
import type { ObjectivePriority, ObjectiveStatus } from '../../types';

export function Badge({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset',
        'bg-slate-50 text-slate-700 ring-slate-200',
        className,
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: ObjectiveStatus }) {
  return (
    <Badge className={STATUS_STYLE[status]}>
      <span className={cn('h-1.5 w-1.5 rounded-full', STATUS_DOT[status])} aria-hidden />
      {STATUS_LABEL[status]}
    </Badge>
  );
}

export function PriorityBadge({ priority }: { priority: ObjectivePriority }) {
  return <Badge className={PRIORITY_STYLE[priority]}>Prioridad {PRIORITY_LABEL[priority]}</Badge>;
}
