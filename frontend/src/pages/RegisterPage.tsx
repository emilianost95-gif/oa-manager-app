import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../lib/api';
import { Button } from '../components/ui/Button';
import { PasswordInput, TextInput } from '../components/ui/Field';
import { AuthShell } from './AuthShell';

export function RegisterPage() {
  const { register, user, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) return <Navigate to="/" replace />;

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const localErrors: Record<string, string> = {};
    if (form.name.trim().length < 2) localErrors.name = 'El nombre debe tener al menos 2 caracteres.';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) localErrors.email = 'Ingresa un email válido.';
    if (form.password.length < 8)
      localErrors.password = 'La contraseña debe tener al menos 8 caracteres.';
    if (form.password !== form.confirm) localErrors.confirm = 'Las contraseñas no coinciden.';

    if (Object.keys(localErrors).length > 0) {
      setErrors(localErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      await register(form.name.trim(), form.email.trim(), form.password);
      toast.success('¡Cuenta creada! Ya puedes empezar.');
      navigate('/', { replace: true });
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.fieldErrors);
        toast.error(error.message);
      } else {
        toast.error('No pudimos crear la cuenta. Inténtalo nuevamente.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Crear cuenta"
      subtitle="Solo necesitas tu nombre, un email y una contraseña."
      footer={
        <>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
            Iniciar sesión
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <TextInput
          label="Nombre"
          autoComplete="name"
          placeholder="María Pérez"
          value={form.name}
          onChange={(e) => set('name')(e.target.value)}
          error={errors.name}
          required
        />
        <TextInput
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="profesora@colegio.cl"
          value={form.email}
          onChange={(e) => set('email')(e.target.value)}
          error={errors.email}
          required
        />
        <PasswordInput
          label="Contraseña"
          autoComplete="new-password"
          placeholder="Mínimo 8 caracteres"
          value={form.password}
          onChange={(e) => set('password')(e.target.value)}
          error={errors.password}
          required
        />
        <PasswordInput
          label="Repetir contraseña"
          autoComplete="new-password"
          placeholder="Repite la contraseña"
          value={form.confirm}
          onChange={(e) => set('confirm')(e.target.value)}
          error={errors.confirm}
          required
        />
        <Button
          type="submit"
          size="lg"
          className="w-full justify-center"
          loading={submitting}
          loadingText="Creando cuenta..."
          icon={<UserPlus className="h-4 w-4" aria-hidden />}
        >
          Crear cuenta
        </Button>
      </form>
    </AuthShell>
  );
}
