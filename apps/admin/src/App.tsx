import { Navigate, Route, Routes } from 'react-router';
import { useAuth } from './auth.tsx';
import { Home } from './pages/Home.tsx';
import { Login } from './pages/Login.tsx';
import { ClientThemePage, TenantThemePage } from './pages/ThemePages.tsx';

export function App() {
  const { user, loading } = useAuth();
  if (loading) return <div className="center muted">Loading…</div>;
  if (!user) return <Login />;
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/tenants/:id/theme" element={<TenantThemePage />} />
      <Route path="/clients/:id/theme" element={<ClientThemePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
