import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ListChecks, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../lib/api';
import { Button } from '../components/ui/Button';
import { PasswordInput, TextInput } from '../components/ui/Field';
import { AuthShell } from './AuthShell';

export function LoginPage() {
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) return <Navigate to="/" replace />;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setErrors({});
    setSubmitting(true);
    try {
      await login(email, password);
      toast.success('¡Bienvenida de vuelta!');
      navigate('/', { replace: true });
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.fieldErrors);
        toast.error(error.message);
      } else {
        toast.error('No pudimos iniciar sesión. Inténtalo nuevamente.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Iniciar sesión"
      subtitle="Ingresa para organizar y hacer seguimiento de tus Objetivos de Aprendizaje."
      footer={
        <>
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="font-medium text-brand-600 hover:text-brand-700">
            Crear una cuenta
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <TextInput
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="profesora@colegio.cl"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          required
        />
        <div>
          <PasswordInput
            label="Contraseña"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            required
          />
          <div className="mt-2 text-right">
            <Link
              to="/recuperar"
              className="text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </div>
        <Button
          type="submit"
          size="lg"
          className="w-full justify-center"
          loading={submitting}
          loadingText="Ingresando..."
          icon={<LogIn className="h-4 w-4" aria-hidden />}
        >
          Ingresar
        </Button>
      </form>

      <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm">
        <p className="flex items-center gap-2 font-medium text-slate-700">
          <ListChecks className="h-4 w-4 text-brand-600" aria-hidden />
          Cuenta de prueba (seed)
        </p>
        <p className="mt-1.5 text-slate-600">
          <span className="font-mono text-xs">profesora@colegio.cl</span> ·{' '}
          <span className="font-mono text-xs">Profesora2024</span>
        </p>
      </div>
    </AuthShell>
  );
}
