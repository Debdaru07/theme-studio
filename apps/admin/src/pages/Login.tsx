import { useState, type FormEvent } from 'react';
import { useAuth } from '../auth.tsx';

const DEMO_LOGINS = [
  { label: 'Tenant admin', email: 'owner@northwind.test', password: 'northwind123' },
  { label: 'Client editor (Acme)', email: 'editor@acme.test', password: 'acme12345' },
  { label: 'Platform admin', email: 'admin@dts.local', password: 'admin12345' },
];

export function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(email, password);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login">
      <form className="login-card" onSubmit={submit}>
        <h1>Theme Studio</h1>
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
        <button className="btn primary" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        {import.meta.env.DEV && (
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
