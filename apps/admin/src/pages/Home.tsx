import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router';
import { api, type Client, type Tenant, type User } from '../api.ts';
import { useAuth } from '../auth.tsx';
import { TopBar } from '../components/TopBar.tsx';

export function Home() {
  const { user } = useAuth();
  const tenants = useQuery({ queryKey: ['tenants'], queryFn: () => api<{ tenants: Tenant[] }>('/tenants') });

  // Client editors have exactly one place to go.
  if (user?.role === 'client_editor' && user.clientId) return <Navigate to={`/clients/${user.clientId}/theme`} replace />;

  return (
    <div className="page">
      <TopBar />
      <main className="container">
        {tenants.isPending && <p className="muted">Loading…</p>}
        {tenants.error && <p className="error-text">{tenants.error.message}</p>}
        {tenants.data?.tenants.map((t) => <TenantSection key={t.id} tenant={t} user={user!} />)}
        {tenants.data?.tenants.length === 0 && <p className="muted">No tenants yet.</p>}
      </main>
    </div>
  );
}

function TenantSection({ tenant, user }: { tenant: Tenant; user: User }) {
  const clients = useQuery({
    queryKey: ['clients', tenant.id],
    queryFn: () => api<{ clients: Client[] }>(`/tenants/${tenant.id}/clients`),
  });
  const canManage = user.role === 'platform_admin' || (user.role === 'tenant_admin' && user.tenantId === tenant.id);

  return (
    <section className="tenant">
      <header className="tenant-head">
        <div>
          <h2>{tenant.name}</h2>
          <span className="muted small">{tenant.slug}</span>
        </div>
        {canManage && (
          <Link className="btn" to={`/tenants/${tenant.id}/theme`}>
            Edit base theme
          </Link>
        )}
      </header>

      <div className="client-grid">
        {clients.data?.clients.map((c) => (
          <Link key={c.id} className="client-card" to={`/clients/${c.id}/theme`}>
            <strong>{c.name}</strong>
            <span className="muted small">{c.slug}</span>
            <span className={`pill ${c.published ? 'ok' : 'warn'}`}>
              {c.published ? `Live · v${c.published.version}` : 'Not published'}
            </span>
          </Link>
        ))}
        {canManage && <NewClientCard tenantId={tenant.id} />}
      </div>
    </section>
  );
}

function NewClientCard({ tenantId }: { tenantId: string }) {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const create = useMutation({
    mutationFn: () => api(`/tenants/${tenantId}/clients`, { method: 'POST', body: { name, slug } }),
    onSuccess: () => {
      setName('');
      return qc.invalidateQueries({ queryKey: ['clients', tenantId] });
    },
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (slug) create.mutate();
  };

  return (
    <form className="client-card new" onSubmit={submit}>
      <strong>New client</strong>
      <input placeholder="Client name" value={name} onChange={(e) => setName(e.target.value)} />
      {slug && <span className="muted small">slug: {slug}</span>}
      {create.error && <span className="error-text small">{create.error.message}</span>}
      <button className="btn primary small" disabled={!slug || create.isPending}>
        Add client
      </button>
    </form>
  );
}
