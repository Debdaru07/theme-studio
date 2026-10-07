import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../auth.tsx';

const ROLE_LABEL = { platform_admin: 'Platform admin', tenant_admin: 'Agency admin', client_editor: 'Client editor' };

export function TopBar({ children }: { children?: ReactNode }) {
  return (
    <header className="topbar">
      <Link to="/" className="brand" aria-label="Theme Studio home">
        <BrandMark />
        <span className="brand-name">Theme Studio</span>
      </Link>
      <div className="topbar-middle">{children}</div>
      <UserMenu />
    </header>
  );
}

/** Theme Studio mark: platform, agency and client layers in tints of one brand color (brand/mark.svg). */
export function BrandMark({ size = 22 }: { size?: number }) {
  return (
    <svg className="brand-mark" width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <rect width="32" height="32" rx="6" fill="#c4cef4" />
      <rect y="10" width="22" height="22" rx="6" fill="#8699e9" />
      <circle cx="6" cy="26" r="6" fill="#3b5bdb" />
    </svg>
  );
}

/** Name and role inline on wide screens; an avatar button with a menu on narrow ones. */
function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => !root.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  if (!user) return null;
  const initials = user.name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="topbar-user" ref={root}>
      <span className="user-inline small">
        {user.name} <span className="muted">· {ROLE_LABEL[user.role]}</span>
      </span>
      <button className="btn ghost small user-inline" onClick={logout}>
        Sign out
      </button>
      <button
        className="avatar-btn"
        aria-label={`Account: ${user.name}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {initials}
      </button>
      {open && (
        <div className="user-menu" role="menu">
          <div className="user-menu-head">
            <strong>{user.name}</strong>
            <span className="muted small">{ROLE_LABEL[user.role]}</span>
            <span className="muted small">{user.email}</span>
          </div>
          <button role="menuitem" className="btn ghost block" onClick={logout}>
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
