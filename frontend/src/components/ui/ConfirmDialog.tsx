import type { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { cn } from '../../lib/cn';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  loadingText?: string;
  /** `danger` para acciones destructivas (por defecto), `info` para confirmaciones neutras. */
  tone?: 'danger' | 'info';
  icon?: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Eliminar',
  cancelLabel = 'Cancelar',
  loading = false,
  loadingText = 'Eliminando...',
  tone = 'danger',
  icon,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={loading ? () => undefined : onCancel}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            loading={loading}
            loadingText={loadingText}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex gap-4">
        <span
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-full',
            tone === 'danger' ? 'bg-rose-100 text-rose-600' : 'bg-brand-50 text-brand-600',
          )}
        >
          {icon ?? <AlertTriangle className="h-5 w-5" aria-hidden />}
        </span>
        <p className="pt-2 text-sm leading-relaxed text-slate-600">{message}</p>
      </div>
    </Modal>
  );
}
