import { Check, X } from 'lucide-react';
import { cn } from '../../lib/cn';
import { MIN_PASSWORD_LENGTH, getPasswordStrength } from '../../lib/passwordStrength';

interface PasswordStrengthMeterProps {
  password: string;
  confirmation: string;
  /** Muestra el requisito de coincidencia sólo cuando ya se escribió algo. */
  showMatch?: boolean;
}

function Requirement({ met, children }: { met: boolean; children: string }) {
  return (
    <li
      className={cn(
        'flex items-center gap-1.5 text-xs transition-colors',
        met ? 'text-emerald-700' : 'text-slate-500',
      )}
    >
      {met ? (
        <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />
      ) : (
        <X className="h-3.5 w-3.5 shrink-0 text-slate-300" aria-hidden />
      )}
      {children}
    </li>
  );
}

/** Indicador de fortaleza y de requisitos cumplidos. Todo se calcula en el navegador. */
export function PasswordStrengthMeter({
  password,
  confirmation,
  showMatch = true,
}: PasswordStrengthMeterProps) {
  const strength = getPasswordStrength(password);
  const longEnough = password.length >= MIN_PASSWORD_LENGTH;
  const matches = password.length > 0 && password === confirmation;

  return (
    <div className="space-y-2.5">
      <div>
        <div className="flex gap-1" aria-hidden>
          {[1, 2, 3, 4].map((level) => (
            <span
              key={level}
              className={cn(
                'h-1.5 flex-1 rounded-full transition-colors duration-300',
                strength.score >= level ? strength.barClass : 'bg-slate-200',
              )}
            />
          ))}
        </div>
        <p
          className={cn('mt-1.5 text-xs font-medium transition-colors', strength.textClass)}
          aria-live="polite"
        >
          {strength.label ? `Seguridad: ${strength.label}` : 'Escribe tu nueva contraseña'}
        </p>
      </div>

      <ul className="space-y-1">
        <Requirement met={longEnough}>{`Al menos ${MIN_PASSWORD_LENGTH} caracteres`}</Requirement>
        {showMatch && <Requirement met={matches}>Ambas contraseñas coinciden</Requirement>}
      </ul>
    </div>
  );
}
