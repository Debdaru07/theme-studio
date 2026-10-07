import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, type CSSProperties, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router';
import { api, cachedGet, type Client, type Tenant, type User } from '../api.ts';
import { useAuth } from '../auth.tsx';
import { TopBar } from '../components/TopBar.tsx';

export function Home() {
  const { user } = useAuth();
  const tenants = useQuery({ queryKey: ['tenants'], ...cachedGet<{ tenants: Tenant[] }>('tenants', '/tenants') });

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
    ...cachedGet<{ clients: Client[] }>(`clients.${tenant.id}`, `/tenants/${tenant.id}/clients`),
  });
  const canManage = user.role === 'platform_admin' || (user.role === 'tenant_admin' && user.tenantId === tenant.id);

  return (
    <section className="tenant">
      <header className="tenant-head">
        <div>
          <h2 className="display">{tenant.name}</h2>
          {clients.data && (
            <span className="muted small">
              {clients.data.clients.length} client{clients.data.clients.length === 1 ? '' : 's'}
            </span>
          )}
        </div>
        {canManage && (
          <Link className="btn" to={`/tenants/${tenant.id}/theme`}>
            Edit base theme
          </Link>
        )}
      </header>

      <div className="client-grid">
        {clients.isPending && [0, 1, 2].map((i) => <div key={i} className="client-card skeleton" aria-hidden />)}
        {clients.data?.clients.map((c) => <ClientCard key={c.id} client={c} />)}
        {canManage && <NewClientCard tenantId={tenant.id} />}
      </div>
    </section>
  );
}

/** A client as its brand: the Theme Studio mark in the client's primary, a type sample and the three brand seeds. */
function ClientCard({ client: c }: { client: Client }) {
  const b = c.brand;
  usePreviewFont(b?.font ?? null);
  return (
    <Link className="client-card" to={`/clients/${c.id}/theme`} style={b?.primary ? ({ '--brand': b.primary } as CSSProperties) : undefined}>
      <div className="client-card-head">
        <svg className="client-mark" width="32" height="32" viewBox="0 0 32 32" aria-hidden>
          <rect width="32" height="32" rx="6" />
          <rect y="10" width="22" height="22" rx="6" />
          <circle cx="6" cy="26" r="6" />
        </svg>
        <strong>{c.name}</strong>
      </div>
      {b && (
        <div className="client-brand">
          <span className="client-type" style={b.font ? { fontFamily: `'${b.font}', system-ui` } : undefined}>
            Aa
          </span>
          <span className="client-font">{b.font ?? 'Default font'}</span>
          <span className="client-swatches" aria-label={[b.primary, b.secondary, b.accent].filter(Boolean).join(', ')}>
            {[b.primary, b.secondary, b.accent].map((hex, i) => hex && <span key={i} style={{ background: hex }} />)}
          </span>
        </div>
      )}
      <span className={`pill ${c.published ? 'ok' : 'neutral'}`}>
        {c.published ? `Live · v${c.published.version}` : 'Not published yet'}
      </span>
    </Link>
  );
}

const loadedFonts = new Set<string>();
/** Loads only the glyphs of the type sample ("Aa" and the family name). */
function usePreviewFont(family: string | null) {
  useEffect(() => {
    if (!family || loadedFonts.has(family)) return;
    loadedFonts.add(family);
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, '+')}&text=${encodeURIComponent(family + 'Aa')}&display=swap`;
    document.head.appendChild(link);
  }, [family]);
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
