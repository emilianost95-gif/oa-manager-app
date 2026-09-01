import { useState, type FormEvent } from 'react';
import { KeyRound, Save, UserRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { ApiError, api } from '../lib/api';
import { Button } from '../components/ui/Button';
import { PasswordInput, TextInput } from '../components/ui/Field';
import { AppearancePanel } from '../components/settings/AppearancePanel';
import type { User } from '../types';

export function SettingsPage() {
  const { user, setUser } = useAuth();

  const [name, setName] = useState(user?.name ?? '');
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [savingPassword, setSavingPassword] = useState(false);

  const handleProfile = async (event: FormEvent) => {
    event.preventDefault();
    if (name.trim().length < 2) {
      setProfileErrors({ name: 'El nombre debe tener al menos 2 caracteres.' });
      return;
    }

    setProfileErrors({});
    setSavingProfile(true);
    try {
      const data = await api.put<{ user: User }>('/auth/profile', { name: name.trim() });
      setUser(data.user);
      toast.success('Perfil actualizado.');
    } catch (error) {
      if (error instanceof ApiError) {
        setProfileErrors(error.fieldErrors);
        toast.error(error.message);
      }
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePassword = async (event: FormEvent) => {
    event.preventDefault();

    const next: Record<string, string> = {};
    if (!passwords.current) next.currentPassword = 'Ingresa tu contraseña actual.';
    if (passwords.next.length < 8)
      next.newPassword = 'La nueva contraseña debe tener al menos 8 caracteres.';
    if (passwords.next !== passwords.confirm) next.confirm = 'Las contraseñas no coinciden.';

    if (Object.keys(next).length > 0) {
      setPasswordErrors(next);
      return;
    }

    setPasswordErrors({});
    setSavingPassword(true);
    try {
      await api.put('/auth/password', {
        currentPassword: passwords.current,
        newPassword: passwords.next,
      });
      setPasswords({ current: '', next: '', confirm: '' });
      toast.success('Contraseña actualizada.');
    } catch (error) {
      if (error instanceof ApiError) {
        setPasswordErrors(error.fieldErrors);
        toast.error(error.message);
      }
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-5">
      <header>
        <h2 className="text-xl font-bold text-slate-900">Configuración</h2>
        <p className="mt-0.5 text-sm text-slate-500">
          Administra los datos de tu cuenta y la apariencia de la aplicación.
        </p>
      </header>

      <AppearancePanel />

      <section className="card p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <UserRound className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h3 className="text-base font-semibold text-slate-900">Perfil</h3>
            <p className="text-sm text-slate-500">{user?.email}</p>
          </div>
        </div>

        <form onSubmit={handleProfile} className="space-y-4" noValidate>
          <TextInput
            label="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={profileErrors.name}
            required
          />
          <Button
            type="submit"
            loading={savingProfile}
            loadingText="Guardando..."
            icon={<Save className="h-4 w-4" aria-hidden />}
          >
            Guardar cambios
          </Button>
        </form>
      </section>

      <section className="card p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <KeyRound className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h3 className="text-base font-semibold text-slate-900">Contraseña</h3>
            <p className="text-sm text-slate-500">Usa al menos 8 caracteres.</p>
          </div>
        </div>

        <form onSubmit={handlePassword} className="space-y-4" noValidate>
          <PasswordInput
            label="Contraseña actual"
            autoComplete="current-password"
            value={passwords.current}
            onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))}
            error={passwordErrors.currentPassword}
            required
          />
          <PasswordInput
            label="Nueva contraseña"
            autoComplete="new-password"
            value={passwords.next}
            onChange={(e) => setPasswords((p) => ({ ...p, next: e.target.value }))}
            error={passwordErrors.newPassword}
            required
          />
          <PasswordInput
            label="Repetir nueva contraseña"
            autoComplete="new-password"
            value={passwords.confirm}
            onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
            error={passwordErrors.confirm}
            required
          />
          <Button
            type="submit"
            loading={savingPassword}
            loadingText="Guardando..."
            icon={<KeyRound className="h-4 w-4" aria-hidden />}
          >
            Cambiar contraseña
          </Button>
        </form>
      </section>
    </div>
  );
}
