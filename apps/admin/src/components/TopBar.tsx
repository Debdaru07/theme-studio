import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../auth.tsx';

const ROLE_LABEL = { platform_admin: 'Platform admin', tenant_admin: 'Tenant admin', client_editor: 'Client editor' };

export function TopBar({ children }: { children?: ReactNode }) {
  const { user, logout } = useAuth();
  return (
    <header className="topbar">
      <Link to="/" className="brand">
        <span className="brand-mark" aria-hidden />
        Theme Studio
      </Link>
      <div className="topbar-middle">{children}</div>
      {user && (
        <div className="topbar-user">
          <span className="small">
            {user.name} <span className="muted">· {ROLE_LABEL[user.role]}</span>
          </span>
          <button className="btn ghost small" onClick={logout}>
            Sign out
          </button>
        </div>
      )}
    </header>
  );
}
