import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import toast from 'react-hot-toast';
import { NAV_ITEMS, Sidebar } from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import { ConfirmDialog } from '../ui/ConfirmDialog';

export function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const current =
    NAV_ITEMS.find((item) =>
      item.end ? location.pathname === item.to : location.pathname.startsWith(item.to),
    )?.label ?? 'Objetivos de Aprendizaje';

  const handleLogout = async () => {
    await logout();
    setConfirmLogout(false);
    toast.success('Sesión cerrada.');
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onLogout={() => setConfirmLogout(true)}
      />

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/85 px-4 backdrop-blur sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" aria-hidden />
          </button>
          <h1 className="truncate text-base font-semibold text-slate-900 sm:text-lg">{current}</h1>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>

      <ConfirmDialog
        open={confirmLogout}
        title="Cerrar sesión"
        message="¿Seguro que deseas cerrar sesión? Tus datos quedan guardados."
        confirmLabel="Cerrar sesión"
        loadingText="Cerrando..."
        onConfirm={() => void handleLogout()}
        onCancel={() => setConfirmLogout(false)}
      />
    </div>
  );
}
