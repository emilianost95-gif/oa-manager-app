import { useEffect, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, KeyRound, Link2 as LinkIcon, Loader2 } from 'lucide-react';
import { api, ApiError, request } from '../lib/api';
import { Button } from '../components/ui/Button';
import { PasswordInput } from '../components/ui/Field';
import { PasswordStrengthMeter } from '../components/auth/PasswordStrengthMeter';
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from '../lib/passwordStrength';
import { AuthShell } from './AuthShell';

type Status = 'checking' | 'invalid' | 'form' | 'done';

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';

  const [status, setStatus] = useState<Status>('checking');
  const [invalidMessage, setInvalidMessage] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Comprobamos el enlace antes de mostrar el formulario, para no hacer
  // escribir una contraseña que después va a ser rechazada.
  useEffect(() => {
    let active = true;

    if (!token) {
      setInvalidMessage('El enlace está incompleto. Solicita uno nuevo desde el inicio de sesión.');
      setStatus('invalid');
      return;
    }

    // Un enlace vencido o ya usado es un resultado esperado, no un fallo:
    // `quiet` evita ensuciar la consola del navegador.
    request('/auth/reset-password/verify', { method: 'POST', body: { token }, quiet: true })
      .then(() => {
        if (active) setStatus('form');
      })
      .catch((error: unknown) => {
        if (!active) return;
        setInvalidMessage(
          error instanceof ApiError
            ? error.message
            : 'No pudimos comprobar el enlace. Inténtalo nuevamente.',
        );
        setStatus('invalid');
      });

    return () => {
      active = false;
    };
  }, [token]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const next: Record<string, string> = {};
    if (password.length < MIN_PASSWORD_LENGTH) {
      next.password = `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`;
    } else if (password.length > MAX_PASSWORD_LENGTH) {
      next.password = `La contraseña no puede superar los ${MAX_PASSWORD_LENGTH} caracteres.`;
    }
    if (password !== confirmation) next.confirmation = 'Las contraseñas no coinciden.';

    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setPassword('');
      setConfirmation('');
      setStatus('done');
    } catch (error) {
      if (error instanceof ApiError) {
        const fieldErrors = error.fieldErrors;
        if (Object.keys(fieldErrors).length) {
          setErrors(fieldErrors);
        } else {
          // Token vencido, ya usado o inexistente: el formulario ya no sirve.
          setInvalidMessage(error.message);
          setStatus('invalid');
        }
      } else {
        setErrors({ password: 'No pudimos cambiar la contraseña. Inténtalo nuevamente.' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const backToLogin = (
    <Link
      to="/login"
      className="inline-flex items-center gap-1.5 font-medium text-brand-600 hover:text-brand-700"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden />
      Volver a iniciar sesión
    </Link>
  );

  if (status === 'checking') {
    return (
      <AuthShell
        title="Crear nueva contraseña"
        subtitle="Comprobando el enlace..."
        footer={backToLogin}
      >
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin text-brand-600" aria-hidden />
          Verificando que el enlace siga siendo válido...
        </div>
      </AuthShell>
    );
  }

  if (status === 'invalid') {
    return (
      <AuthShell
        title="Enlace no válido"
        subtitle="No pudimos usar este enlace para restablecer tu contraseña."
        footer={backToLogin}
      >
        <div className="space-y-5">
          <div className="flex gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
              <LinkIcon className="h-5 w-5" aria-hidden />
            </span>
            <p className="pt-1 text-sm leading-relaxed text-amber-900">{invalidMessage}</p>
          </div>

          <Link to="/recuperar" className="block">
            <Button size="lg" className="w-full justify-center">
              Solicitar un enlace nuevo
            </Button>
          </Link>
        </div>
      </AuthShell>
    );
  }

  if (status === 'done') {
    return (
      <AuthShell
        title="Contraseña actualizada"
        subtitle="Ya puedes entrar con tu nueva contraseña."
        footer={backToLogin}
      >
        <div className="space-y-5" role="status">
          <div className="flex gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" aria-hidden />
            </span>
            <p className="pt-1 text-sm leading-relaxed text-emerald-900">
              Contraseña actualizada correctamente.
            </p>
          </div>

          <Link to="/login" className="block">
            <Button size="lg" className="w-full justify-center">
              Volver a iniciar sesión
            </Button>
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Crear nueva contraseña"
      subtitle="Elige una contraseña nueva para tu cuenta."
      footer={backToLogin}
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <PasswordInput
          label="Nueva contraseña"
          autoComplete="new-password"
          autoFocus
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          required
        />

        <PasswordStrengthMeter password={password} confirmation={confirmation} />

        <PasswordInput
          label="Confirmar contraseña"
          autoComplete="new-password"
          placeholder="••••••••"
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          error={errors.confirmation}
          required
        />

        <Button
          type="submit"
          size="lg"
          className="w-full justify-center"
          loading={submitting}
          loadingText="Guardando..."
          icon={<KeyRound className="h-4 w-4" aria-hidden />}
        >
          Restablecer contraseña
        </Button>
      </form>
    </AuthShell>
  );
}
