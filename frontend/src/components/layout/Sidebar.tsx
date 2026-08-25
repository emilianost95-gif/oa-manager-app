import { NavLink } from 'react-router-dom';
import {
  BookOpen,
  Download,
  GraduationCap,
  LayoutDashboard,
  Layers,
  ListChecks,
  LogOut,
  Settings,
  Upload,
  X,
} from 'lucide-react';
import { cn } from '../../lib/cn';
import { useAuth } from '../../context/AuthContext';

export const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/objetivos', label: 'Objetivos', icon: ListChecks },
  { to: '/asignaturas', label: 'Asignaturas', icon: BookOpen },
  { to: '/cursos', label: 'Cursos', icon: GraduationCap },
  { to: '/unidades', label: 'Unidades', icon: Layers },
  { to: '/importar', label: 'Importar', icon: Upload },
  { to: '/exportar', label: 'Exportar', icon: Download },
  { to: '/configuracion', label: 'Configuración', icon: Settings },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export function Sidebar({ open, onClose, onLogout }: SidebarProps) {
  const { user } = useAuth();

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
        aria-label="Navegación principal"
      >
        <div className="flex items-center justify-between gap-2 px-5 py-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white">
              <ListChecks className="h-5 w-5" aria-hidden />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-slate-900">Objetivos de</p>
              <p className="text-sm font-semibold text-slate-900">Aprendizaje</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                )
              }
            >
              <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-200 p-3">
          <div className="mb-2 flex items-center gap-3 rounded-xl px-3 py-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
              {user?.name?.charAt(0).toUpperCase() ?? '?'}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-900">{user?.name}</p>
              <p className="truncate text-xs text-slate-500">{user?.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-rose-50 hover:text-rose-700"
          >
            <LogOut className="h-[18px] w-[18px] shrink-0" aria-hidden />
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
}
