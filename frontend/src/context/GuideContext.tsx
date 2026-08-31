import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';
import { isDemoActive, setDemoActive } from '../lib/demoMode';
import { clearDemoData, resetDemoData } from '../lib/demoApi';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import type { Course, DashboardStats, Subject } from '../types';

interface GuideContextValue {
  /** El modo demo está activo: se muestran datos ficticios en memoria. */
  isDemo: boolean;
  /** Entra al modo demo, pidiendo confirmación si la usuaria ya tiene datos. */
  requestDemo: () => void;
  /** Sale del modo demo y vuelve a los datos reales. */
  exitDemo: () => void;

  helpOpen: boolean;
  openHelp: () => void;
  closeHelp: () => void;

  tourOpen: boolean;
  startTour: () => void;
  closeTour: () => void;
}

const GuideContext = createContext<GuideContextValue | null>(null);

const tourKey = (userId: string) => `oa-manager:tour-seen:${userId}`;

export function GuideProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [isDemo, setIsDemo] = useState(() => isDemoActive());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);

  const lastUserId = useRef<string | null>(null);

  const applyDemo = useCallback(
    (active: boolean) => {
      setDemoActive(active);
      setIsDemo(active);
      if (active) resetDemoData();
      else clearDemoData();
      queryClient.clear();
      void queryClient.invalidateQueries();
    },
    [queryClient],
  );

  const enterDemo = useCallback(() => {
    setConfirmOpen(false);
    applyDemo(true);
    setHelpOpen(false);
    toast.success('Modo demo activado. Tus datos reales quedan intactos.');
  }, [applyDemo]);

  const exitDemo = useCallback(() => {
    if (!isDemoActive()) return;
    applyDemo(false);
    toast.success('Saliste del modo demo. Volviste a tus datos reales.');
  }, [applyDemo]);

  /** ¿La usuaria ya tiene contenido propio cargado? */
  const hasRealData = useCallback((): boolean => {
    const stats = queryClient.getQueryData<DashboardStats>(['stats', 'dashboard']);
    if (stats) {
      return (
        stats.totals.objectives > 0 || stats.totals.subjects > 0 || stats.totals.courses > 0
      );
    }
    const courses = queryClient.getQueryData<Course[]>(['courses']);
    const subjects = queryClient.getQueryData<Subject[]>(['subjects']);
    if (courses || subjects) return (courses?.length ?? 0) > 0 || (subjects?.length ?? 0) > 0;
    // Sin información en caché preferimos preguntar.
    return true;
  }, [queryClient]);

  const requestDemo = useCallback(() => {
    if (isDemoActive()) return;
    if (hasRealData()) setConfirmOpen(true);
    else enterDemo();
  }, [enterDemo, hasRealData]);

  const startTour = useCallback(() => {
    setHelpOpen(false);
    setTourOpen(true);
  }, []);

  const closeTour = useCallback(() => {
    setTourOpen(false);
    if (user?.id) {
      try {
        localStorage.setItem(tourKey(user.id), '1');
      } catch {
        /* si no hay localStorage el tutorial se volverá a mostrar: no es crítico */
      }
    }
  }, [user?.id]);

  // Primera visita: mostrar el tutorial breve una sola vez por cuenta.
  useEffect(() => {
    if (!user?.id) return;
    if (lastUserId.current === user.id) return;

    // Cambió la cuenta activa: el modo demo no debe arrastrarse entre sesiones.
    if (lastUserId.current !== null && isDemoActive()) applyDemo(false);
    lastUserId.current = user.id;

    let seen = true;
    try {
      seen = localStorage.getItem(tourKey(user.id)) === '1';
    } catch {
      seen = true;
    }
    if (!seen) setTourOpen(true);
  }, [user?.id, applyDemo]);

  const value = useMemo<GuideContextValue>(
    () => ({
      isDemo,
      requestDemo,
      exitDemo,
      helpOpen,
      openHelp: () => setHelpOpen(true),
      closeHelp: () => setHelpOpen(false),
      tourOpen,
      startTour,
      closeTour,
    }),
    [isDemo, requestDemo, exitDemo, helpOpen, tourOpen, startTour, closeTour],
  );

  return (
    <GuideContext.Provider value={value}>
      {children}

      <ConfirmDialog
        open={confirmOpen}
        title="Activar el modo demo"
        message="Verás datos de ejemplo para explorar la aplicación. Tus datos reales no se modifican ni se eliminan: vuelven apenas salgas del modo demo."
        confirmLabel="Ver demo"
        tone="info"
        icon={<Sparkles className="h-5 w-5" aria-hidden />}
        onConfirm={enterDemo}
        onCancel={() => setConfirmOpen(false)}
      />
    </GuideContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useGuide(): GuideContextValue {
  const context = useContext(GuideContext);
  if (!context) throw new Error('useGuide debe usarse dentro de <GuideProvider>');
  return context;
}
