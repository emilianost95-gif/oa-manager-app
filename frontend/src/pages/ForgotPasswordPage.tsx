import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, MailCheck, Send } from 'lucide-react';
import { api, ApiError } from '../lib/api';
import { Button } from '../components/ui/Button';
import { TextInput } from '../components/ui/Field';
import { AuthShell } from './AuthShell';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!email.trim()) {
      setErrors({ email: 'Ingresa tu correo electrónico.' });
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      setSent(true);
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.fieldErrors);
        if (!Object.keys(error.fieldErrors).length) {
          setErrors({ email: error.message });
        }
      } else {
        setErrors({ email: 'No pudimos procesar la solicitud. Inténtalo nuevamente.' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title={sent ? 'Revisa tu correo' : 'Recuperar contraseña'}
      subtitle={
        sent
          ? 'Te explicamos qué hacer a continuación.'
          : 'Ingresa tu correo electrónico y te enviaremos instrucciones para restablecer tu contraseña.'
      }
      footer={
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 font-medium text-brand-600 hover:text-brand-700"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Volver a iniciar sesión
        </Link>
      }
    >
      {sent ? (
        <div className="space-y-5" role="status">
          <div className="flex gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <MailCheck className="h-5 w-5" aria-hidden />
            </span>
            <p className="pt-1 text-sm leading-relaxed text-emerald-900">
              Si existe una cuenta asociada a este correo, recibirás un enlace para restablecer tu
              contraseña.
            </p>
          </div>

          <p className="text-sm text-slate-600">
            El enlace vence en una hora y sólo puede usarse una vez. Si no te llega, revisa la
            carpeta de correo no deseado.
          </p>

          <Button
            variant="outline"
            className="w-full justify-center"
            onClick={() => {
              setSent(false);
              setEmail('');
            }}
          >
            Usar otro correo
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <TextInput
            label="Correo electrónico"
            type="email"
            autoComplete="email"
            autoFocus
            placeholder="profesora@colegio.cl"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            required
          />
          <Button
            type="submit"
            size="lg"
            className="w-full justify-center"
            loading={submitting}
            loadingText="Enviando..."
            icon={<Send className="h-4 w-4" aria-hidden />}
          >
            Enviar enlace
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
