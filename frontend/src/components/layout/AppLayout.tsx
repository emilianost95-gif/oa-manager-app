import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { CircleHelp, LogOut, Menu, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { NAV_ITEMS, Sidebar } from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import { useGuide } from '../../context/GuideContext';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { HelpPanel } from '../guide/HelpPanel';
import { TourModal } from '../guide/TourModal';

export function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const { logout } = useAuth();
  const { isDemo, requestDemo, exitDemo, openHelp } = useGuide();
  const navigate = useNavigate();
  const location = useLocation();

  const current =
    NAV_ITEMS.find((item) =>
      item.end ? location.pathname === item.to : location.pathname.startsWith(item.to),
    )?.label ?? 'Objetivos de Aprendizaje';

  const handleLogout = async () => {
    exitDemo();
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
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-surface/85 px-4 backdrop-blur sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" aria-hidden />
          </button>
          <h1 className="truncate text-base font-semibold text-slate-900 sm:text-lg">{current}</h1>

          <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
            {isDemo ? (
              <>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-800 ring-1 ring-amber-200">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden />
                  Modo demo
                </span>
                <button
                  type="button"
                  onClick={exitDemo}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl px-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  <LogOut className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="hidden sm:inline">Salir de demo</span>
                  <span className="sr-only sm:hidden">Salir de demo</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={requestDemo}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl px-2.5 text-sm font-medium text-brand-700 transition hover:bg-brand-50"
              >
                <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
                <span className="hidden sm:inline">Ver demo</span>
                <span className="sr-only sm:hidden">Ver demo</span>
              </button>
            )}

            <button
              type="button"
              onClick={openHelp}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl px-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <CircleHelp className="h-4 w-4 shrink-0" aria-hidden />
              <span className="hidden sm:inline">Ayuda</span>
              <span className="sr-only sm:hidden">Ayuda</span>
            </button>
          </div>
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

      <HelpPanel />
      <TourModal />
    </div>
  );
}
