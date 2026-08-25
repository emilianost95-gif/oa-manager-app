import { cn } from '../../lib/cn';

interface ProgressBarProps {
  value: number;
  className?: string;
  barClassName?: string;
  /** Color sólido (por ejemplo el color de la asignatura). */
  color?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const HEIGHTS = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-3.5' };

export function ProgressBar({
  value,
  className,
  barClassName,
  color,
  showLabel = false,
  size = 'md',
}: ProgressBarProps) {
  const safe = Math.max(0, Math.min(100, Math.round(value)));

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div
        className={cn('w-full overflow-hidden rounded-full bg-slate-200', HEIGHTS[size])}
        role="progressbar"
        aria-valuenow={safe}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Progreso ${safe}%`}
      >
        <div
          className={cn(
            'h-full rounded-full transition-[width] duration-500 ease-out',
            !color && !barClassName && 'bg-brand-600',
            barClassName,
          )}
          style={{ width: `${safe}%`, ...(color ? { backgroundColor: color } : {}) }}
        />
      </div>
      {showLabel && (
        <span className="w-10 shrink-0 text-right text-xs font-semibold tabular-nums text-slate-600">
          {safe}%
        </span>
      )}
    </div>
  );
}

/** Anillo de progreso para el dashboard. */
export function ProgressRing({ value, size = 132 }: { value: number; size?: number }) {
  const safe = Math.max(0, Math.min(100, Math.round(value)));
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (safe / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          className="fill-none stroke-slate-200"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="fill-none stroke-brand-600 transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-bold tabular-nums text-slate-900">{safe}%</span>
        <span className="text-xs text-slate-500">logrado</span>
      </div>
    </div>
  );
}
