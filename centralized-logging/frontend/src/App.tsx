import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './hooks/useAuth';

import { LoginPage }     from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { LogsPage }      from './pages/LogsPage';
import { LivePage }      from './pages/LivePage';
import { AlertsPage }    from './pages/AlertsPage';
import { ServicesPage }  from './pages/ServicesPage';
import { SettingsPage }  from './pages/SettingsPage';
import { AdminPage }     from './pages/AdminPage';
import { Loader2 }       from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 10_000 },
  },
});

// Bảo vệ route - phải đăng nhập
const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-blue-400" />
      </div>
    );
  }
  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

// Bảo vệ route - chỉ admin
const RequireAdmin: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-blue-400" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/"        element={<RequireAuth><DashboardPage /></RequireAuth>} />
      <Route path="/logs"    element={<RequireAuth><LogsPage /></RequireAuth>} />
      <Route path="/live"    element={<RequireAuth><LivePage /></RequireAuth>} />
      <Route path="/alerts"  element={<RequireAuth><AlertsPage /></RequireAuth>} />
      <Route path="/services"element={<RequireAuth><ServicesPage /></RequireAuth>} />
      <Route path="/settings"element={<RequireAuth><SettingsPage /></RequireAuth>} />
      {/* Admin only */}
      <Route path="/admin"   element={<RequireAdmin><AdminPage /></RequireAdmin>} />
      <Route path="*"        element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
