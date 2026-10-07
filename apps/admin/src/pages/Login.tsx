import { useState, type FormEvent } from 'react';
import { useAuth } from '../auth.tsx';
import { BrandMark } from '../components/TopBar.tsx';

const DEMO_LOGINS = [
  { label: 'Agency admin (Northwind)', email: 'owner@northwind.test', password: 'northwind123' },
  { label: 'Client editor (Acme)', email: 'editor@acme.test', password: 'acme12345' },
  // The platform admin uses ADMIN_PASSWORD when deployed, so it is offered in development only.
  ...(import.meta.env.DEV ? [{ label: 'Platform admin', email: 'admin@dts.local', password: 'admin12345' }] : []),
];

/** Hosted demos set VITE_DEMO_LOGINS=true to show one-click demo accounts. */
const SHOW_DEMO_LOGINS = import.meta.env.DEV || import.meta.env.VITE_DEMO_LOGINS === 'true';

export function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [slow, setSlow] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    // Free hosting sleeps when idle; the first request can take up to a minute.
    const slowTimer = setTimeout(() => setSlow(true), 4000);
    try {
      await login(email, password);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      clearTimeout(slowTimer);
      setSlow(false);
      setBusy(false);
    }
  };

  return (
    <div className="login">
      <form className="login-card" onSubmit={submit}>
        <h1 className="login-brand">
          <BrandMark size={28} />
          Theme Studio
        </h1>
        <p className="muted">Sign in to manage your themes.</p>
        <label className="field">
          <span>Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
        </label>
        <label className="field">
          <span>Password</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        {error && <p className="error-text">{error}</p>}
        {slow && <p className="muted small">Waking up the server — this can take up to a minute after it has been idle.</p>}
        <button className="btn primary" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        {SHOW_DEMO_LOGINS && (
          <div className="demo-logins">
            <span className="muted small">Demo accounts</span>
            {DEMO_LOGINS.map((d) => (
              <button
                key={d.email}
                type="button"
                className="btn ghost small"
                onClick={() => {
                  setEmail(d.email);
                  setPassword(d.password);
                }}
              >
                {d.label}
              </button>
            ))}
          </div>
        )}
      </form>
    </div>
  );
}
