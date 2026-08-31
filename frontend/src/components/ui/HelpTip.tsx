import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Info, X } from 'lucide-react';
import { cn } from '../../lib/cn';

export interface HelpContent {
  /** Título corto de la ayuda (normalmente el nombre del campo). */
  title: string;
  /** Explicación breve: qué es y qué debe escribir la usuaria. */
  body: string;
  /** Ejemplo concreto, opcional. */
  example?: string;
}

interface HelpTipProps extends HelpContent {
  /** Tamaño del icono. `sm` para etiquetas de campo, `md` para títulos. */
  size?: 'sm' | 'md';
  className?: string;
}

const GAP = 8;
const MARGIN = 12;
const WIDTH = 288;

/**
 * Ayuda contextual discreta: un icono ⓘ que abre un pequeño popover.
 *
 * Funciona por clic/tap (no depende de hover), se cierra con Escape o al hacer
 * clic fuera, y se posiciona dentro de la pantalla también en móvil.
 */
export function HelpTip({ title, body, example, size = 'sm', className }: HelpTipProps) {
  const [open, setOpen] = useState(false);
  const [style, setStyle] = useState<{ top: number; left: number; placement: 'top' | 'bottom' }>({
    top: 0,
    left: 0,
    placement: 'bottom',
  });

  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  const close = useCallback(() => {
    setOpen(false);
    buttonRef.current?.focus();
  }, []);

  const reposition = useCallback(() => {
    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const width = Math.min(WIDTH, window.innerWidth - MARGIN * 2);
    const height = popoverRef.current?.offsetHeight ?? 140;

    const spaceBelow = window.innerHeight - rect.bottom;
    const placement: 'top' | 'bottom' =
      spaceBelow < height + GAP + MARGIN && rect.top > height + GAP + MARGIN ? 'top' : 'bottom';

    const rawLeft = rect.left + rect.width / 2 - width / 2;
    const left = Math.min(Math.max(rawLeft, MARGIN), window.innerWidth - width - MARGIN);
    const top = placement === 'bottom' ? rect.bottom + GAP : rect.top - height - GAP;

    setStyle({ top, left, placement });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    reposition();
    // Segunda pasada: ya conocemos la altura real del popover.
    const raf = requestAnimationFrame(reposition);
    return () => cancelAnimationFrame(raf);
  }, [open, reposition]);

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        close();
      }
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (popoverRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onScrollOrResize = () => reposition();

    document.addEventListener('keydown', onKey, true);
    document.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);

    return () => {
      document.removeEventListener('keydown', onKey, true);
      document.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [open, close, reposition]);

  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={open ? panelId : undefined}
        aria-label={`Ayuda sobre ${title}`}
        className={cn(
          'inline-flex shrink-0 items-center justify-center rounded-full p-1 align-middle',
          'text-slate-400 transition hover:bg-slate-100 hover:text-brand-600',
          open && 'bg-brand-50 text-brand-600',
          className,
        )}
      >
        <Info className={iconSize} aria-hidden />
      </button>

      {open &&
        createPortal(
          <div
            ref={popoverRef}
            id={panelId}
            role="dialog"
            aria-label={`Ayuda: ${title}`}
            style={{
              top: style.top,
              left: style.left,
              width: Math.min(WIDTH, window.innerWidth - MARGIN * 2),
            }}
            className={cn(
              'fixed z-[60] rounded-xl border border-slate-200 bg-white p-3.5 text-left shadow-lg',
              'origin-top animate-[help-pop_120ms_ease-out]',
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-slate-900">{title}</p>
              <button
                type="button"
                onClick={close}
                aria-label="Cerrar ayuda"
                className="-mr-1 -mt-1 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">{body}</p>
            {example && (
              <p className="mt-2 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs text-slate-600">
                <span className="font-medium text-slate-700">Ejemplo:</span> {example}
              </p>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}
