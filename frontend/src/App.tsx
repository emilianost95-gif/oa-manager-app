import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { ObjectivesPage } from './pages/ObjectivesPage';
import { SubjectsPage } from './pages/SubjectsPage';
import { SubjectDetailPage } from './pages/SubjectDetailPage';
import { CoursesPage } from './pages/CoursesPage';
import { UnitsPage } from './pages/UnitsPage';
import { ImportPage } from './pages/ImportPage';
import { ExportPage } from './pages/ExportPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotFoundPage } from './pages/NotFoundPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="objetivos" element={<ObjectivesPage />} />
                <Route path="asignaturas" element={<SubjectsPage />} />
                <Route path="asignaturas/:id" element={<SubjectDetailPage />} />
                <Route path="cursos" element={<CoursesPage />} />
                <Route path="unidades" element={<UnitsPage />} />
                <Route path="importar" element={<ImportPage />} />
                <Route path="exportar" element={<ExportPage />} />
                <Route path="configuracion" element={<SettingsPage />} />
              </Route>
            </Route>

            <Route path="/404" element={<NotFoundPage />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            borderRadius: '12px',
            background: '#0f172a',
            color: '#f8fafc',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#f8fafc' } },
          error: { duration: 5000, iconTheme: { primary: '#f43f5e', secondary: '#f8fafc' } },
        }}
      />
    </QueryClientProvider>
  );
}
