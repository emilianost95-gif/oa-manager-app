import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { useId } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '../../lib/cn';

interface WrapperProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: (id: string) => ReactNode;
  className?: string;
}

function FieldWrapper({ label, error, hint, required, children, className }: WrapperProps) {
  const id = useId();
  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label htmlFor={id} className="field-label">
          {label}
          {required && <span className="ml-0.5 text-rose-500">*</span>}
        </label>
      )}
      {children(id)}
      {error ? (
        <p className="mt-1.5 flex items-start gap-1 text-xs text-rose-600">
          <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>{error}</span>
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}

interface TextInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label?: string;
  error?: string;
  hint?: string;
  wrapperClassName?: string;
}

export function TextInput({
  label,
  error,
  hint,
  required,
  className,
  wrapperClassName,
  ...props
}: TextInputProps) {
  return (
    <FieldWrapper
      label={label}
      error={error}
      hint={hint}
      required={required}
      className={wrapperClassName}
    >
      {(id) => (
        <input
          id={id}
          aria-invalid={Boolean(error)}
          className={cn('input-base', error && 'input-error', className)}
          {...props}
        />
      )}
    </FieldWrapper>
  );
}

interface TextAreaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
  label?: string;
  error?: string;
  hint?: string;
  wrapperClassName?: string;
}

export function TextArea({
  label,
  error,
  hint,
  required,
  className,
  wrapperClassName,
  ...props
}: TextAreaProps) {
  return (
    <FieldWrapper
      label={label}
      error={error}
      hint={hint}
      required={required}
      className={wrapperClassName}
    >
      {(id) => (
        <textarea
          id={id}
          aria-invalid={Boolean(error)}
          className={cn('input-base min-h-[92px] resize-y', error && 'input-error', className)}
          {...props}
        />
      )}
    </FieldWrapper>
  );
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> {
  label?: string;
  error?: string;
  hint?: string;
  wrapperClassName?: string;
  children: ReactNode;
}

export function Select({
  label,
  error,
  hint,
  required,
  className,
  wrapperClassName,
  children,
  ...props
}: SelectProps) {
  return (
    <FieldWrapper
      label={label}
      error={error}
      hint={hint}
      required={required}
      className={wrapperClassName}
    >
      {(id) => (
        <select
          id={id}
          aria-invalid={Boolean(error)}
          className={cn('input-base cursor-pointer pr-9', error && 'input-error', className)}
          {...props}
        >
          {children}
        </select>
      )}
    </FieldWrapper>
  );
}
