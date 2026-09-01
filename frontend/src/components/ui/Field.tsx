import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { useId, useState } from 'react';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { cn } from '../../lib/cn';
import { HelpTip, type HelpContent } from './HelpTip';

interface WrapperProps {
  label?: string;
  error?: string;
  hint?: string;
  help?: HelpContent;
  required?: boolean;
  children: (id: string) => ReactNode;
  className?: string;
}

function FieldWrapper({ label, error, hint, help, required, children, className }: WrapperProps) {
  const id = useId();
  return (
    <div className={cn('w-full', className)}>
      {label && (
        <div className="mb-1.5 flex items-center gap-0.5">
          <label htmlFor={id} className="field-label mb-0">
            {label}
            {required && <span className="ml-0.5 text-rose-500">*</span>}
          </label>
          {help && <HelpTip {...help} />}
        </div>
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
  help?: HelpContent;
  wrapperClassName?: string;
}

export function TextInput({
  label,
  error,
  hint,
  help,
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
      help={help}
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
  help?: HelpContent;
  wrapperClassName?: string;
}

export function TextArea({
  label,
  error,
  hint,
  help,
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
      help={help}
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
  help?: HelpContent;
  wrapperClassName?: string;
  children: ReactNode;
}

export function Select({
  label,
  error,
  hint,
  help,
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
      help={help}
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

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'type'> {
  label?: string;
  error?: string;
  hint?: string;
  help?: HelpContent;
  wrapperClassName?: string;
}

/**
 * Campo de contraseña con botón de mostrar/ocultar.
 *
 * El botón sólo cambia el `type` del input: la contraseña nunca se copia,
 * guarda ni registra en ningún lado. El estado de visibilidad se reinicia en
 * cada montaje y no se persiste.
 */
export function PasswordInput({
  label,
  error,
  hint,
  help,
  required,
  className,
  wrapperClassName,
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <FieldWrapper
      label={label}
      error={error}
      hint={hint}
      help={help}
      required={required}
      className={wrapperClassName}
    >
      {(id) => (
        <div className="relative">
          <input
            id={id}
            type={visible ? 'text' : 'password'}
            aria-invalid={Boolean(error)}
            className={cn('input-base pr-12', error && 'input-error', className)}
            {...props}
          />
          <button
            type="button"
            onClick={() => setVisible((prev) => !prev)}
            aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            aria-pressed={visible}
            title={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            className={cn(
              'absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl',
              'text-slate-400 transition hover:text-brand-600',
              'focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand-600',
            )}
          >
            {visible ? (
              <EyeOff className="h-[18px] w-[18px]" aria-hidden />
            ) : (
              <Eye className="h-[18px] w-[18px]" aria-hidden />
            )}
          </button>
        </div>
      )}
    </FieldWrapper>
  );
}
