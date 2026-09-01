import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  ACCENT_STORAGE_KEY,
  THEME_STORAGE_KEY,
  applyAppearance,
  readStoredAccent,
  readStoredTheme,
  resolveTheme,
  type AccentChoice,
  type ResolvedTheme,
  type ThemeChoice,
} from '../lib/theme';

interface ThemeContextValue {
  /** Lo que eligió la usuaria, incluido `auto`. */
  theme: ThemeChoice;
  /** El tema que se está pintando ahora mismo (`auto` ya resuelto). */
  resolvedTheme: ResolvedTheme;
  accent: AccentChoice;
  setTheme: (theme: ThemeChoice) => void;
  setAccent: (accent: AccentChoice) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/** Marca <html> para que la transición sólo dure el cambio. */
function withTransition(apply: () => void): void {
  const root = document.documentElement;
  root.classList.add('theme-switching');
  apply();
  window.setTimeout(() => root.classList.remove('theme-switching'), 220);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // El estado inicial coincide con lo que el script de index.html ya pintó,
  // así que no hay parpadeo ni un segundo repintado al montar.
  const [theme, setThemeState] = useState<ThemeChoice>(() => readStoredTheme());
  const [accent, setAccentState] = useState<AccentChoice>(() => readStoredAccent());
  const [systemDark, setSystemDark] = useState(
    () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches,
  );

  // En modo automático seguimos los cambios del sistema en vivo.
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    applyAppearance(theme, accent);
    // `systemDark` entra como dependencia para repintar cuando el sistema
    // cambia y el tema elegido es `auto`.
  }, [theme, accent, systemDark]);

  const setTheme = useCallback((next: ThemeChoice) => {
    withTransition(() => setThemeState(next));
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* sin localStorage la elección dura lo que dure la pestaña */
    }
  }, []);

  const setAccent = useCallback((next: AccentChoice) => {
    withTransition(() => setAccentState(next));
    try {
      localStorage.setItem(ACCENT_STORAGE_KEY, next);
    } catch {
      /* idem */
    }
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme: resolveTheme(theme),
      accent,
      setTheme,
      setAccent,
    }),
    // `systemDark` recalcula `resolvedTheme` cuando el tema es automático.
    [theme, accent, setTheme, setAccent, systemDark],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme debe usarse dentro de <ThemeProvider>');
  return context;
}
