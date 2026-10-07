import { useTheme } from '@debdaru07/react';
import { useState, type ReactNode } from 'react';
import { Icon } from './icons.tsx';

/** The theme's chosen primary button style; the other variants are shown for secondary actions. */
function Button({ variant, children, onClick }: { variant?: 'filled' | 'tonal' | 'outlined' | 'text'; children: ReactNode; onClick?: () => void }) {
  const { theme } = useTheme();
  const v = variant ?? theme.components.button.variant;
  return (
    <button type="button" className={`p-btn ${v}`} data-transform={theme.components.button.textTransform} onClick={onClick}>
      {children}
    </button>
  );
}

const ORDERS = [
  { id: 'NW-1042', to: 'Auckland CBD', status: 'Delivered', tone: 'success' },
  { id: 'NW-1043', to: 'Wellington Port', status: 'In transit', tone: 'info' },
  { id: 'NW-1044', to: 'Christchurch', status: 'Delayed', tone: 'warning' },
  { id: 'NW-1045', to: 'Hamilton', status: 'Failed', tone: 'error' },
  { id: 'NW-1046', to: 'Tauranga', status: 'In transit', tone: 'info' },
] as const;

export function HomeScreen() {
  const { theme } = useTheme();
  return (
    <div className="p-stack">
      <section className={`p-hero ${theme.effects.gradient.enabled ? 'gradient' : ''}`}>
        <div className="t-headline">Good morning, Sam</div>
        <p className="t-body-large">Here’s what’s happening with your deliveries today.</p>
        <div className="p-row">
          <Button>New shipment</Button>
          <Button variant="outlined">View reports</Button>
        </div>
      </section>
      <div className="p-cards">
        {[
          { label: 'Active shipments', value: '128', delta: '+12%', tone: 'success' },
          { label: 'On-time rate', value: '96.4%', delta: '+0.8%', tone: 'success' },
          { label: 'Exceptions', value: '7', delta: '+3', tone: 'error' },
        ].map((s) => (
          <div key={s.label} className="p-card">
            <div className="t-label-medium muted">{s.label}</div>
            <div className="t-display small-display">{s.value}</div>
            <span className={`p-chip tone-${s.tone}`}>{s.delta}</span>
          </div>
        ))}
      </div>
      <div className="p-card">
        <div className="t-title-large">Recent activity</div>
        <ul className="p-list compact">
          {ORDERS.slice(0, 3).map((o) => (
            <li key={o.id}>
              <span className="p-avatar">
                <Icon name="truck" />
              </span>
              <div>
                <div className="t-title-medium">{o.id}</div>
                <div className="t-body-small muted">To {o.to}</div>
              </div>
              <span className={`p-chip tone-${o.tone}`}>{o.status}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function OrdersScreen({ animate }: { animate: string }) {
  const [open, setOpen] = useState<(typeof ORDERS)[number] | null>(null);
  if (open) {
    return (
      <div key={open.id} className={`p-stack p-page ${animate}`}>
        <button type="button" className="p-link" onClick={() => setOpen(null)}>
          <Icon name="back" /> All orders
        </button>
        <div className="t-headline">{open.id}</div>
        <span className={`p-chip tone-${open.tone}`}>{open.status}</span>
        <div className="p-card">
          <div className="t-title-medium">Destination</div>
          <p className="t-body-medium">{open.to}, New Zealand</p>
          <div className="t-title-medium">Tracking</div>
          <p className="t-mono">TRK-{open.id.slice(3)}-8842-NZ</p>
        </div>
        <div className="p-row">
          <Button>Contact driver</Button>
          <Button variant="text">Report issue</Button>
        </div>
      </div>
    );
  }
  return (
    <div className={`p-stack p-page ${animate}`}>
      <div className="t-headline">Orders</div>
      <div className="p-card flush">
        <ul className="p-list">
          {ORDERS.map((o) => (
            <li key={o.id} className="clickable" onClick={() => setOpen(o)}>
              <span className="p-avatar">
                <Icon name="truck" />
              </span>
              <div className="grow">
                <div className="t-title-medium">{o.id}</div>
                <div className="t-body-small muted">To {o.to}</div>
              </div>
              <span className={`p-chip tone-${o.tone}`}>{o.status}</span>
              <Icon name="chevron" />
            </li>
          ))}
        </ul>
      </div>
      <p className="t-caption muted">Tap an order to see the page transition.</p>
    </div>
  );
}

export function FormScreen() {
  const { theme } = useTheme();
  const [submitted, setSubmitted] = useState(false);
  const variant = theme.components.input.variant;
  return (
    <div className="p-stack">
      <div className="t-headline">Account settings</div>
      {submitted && (
        <div className="p-banner tone-success">
          <Icon name="check" /> Changes saved
        </div>
      )}
      <form className="p-card p-form" onSubmit={(e) => e.preventDefault()}>
        <label className={`p-field ${variant}`}>
          <span className="t-label-medium">Company name</span>
          <input className="p-input" defaultValue="Northwind Freight" />
        </label>
        <label className={`p-field ${variant}`}>
          <span className="t-label-medium">Email</span>
          <input className="p-input" defaultValue="ops@northwind" aria-invalid />
          <span className="t-caption error">Enter a valid email address</span>
        </label>
        <label className={`p-field ${variant}`}>
          <span className="t-label-medium">Notes</span>
          <input className="p-input" placeholder="Optional" />
          <span className="t-caption muted">Visible to your team only</span>
        </label>
        <div className="p-row wrap">
          {['Email', 'SMS', 'Push'].map((c, i) => (
            <span key={c} className={`p-chip ${i === 0 ? 'selected' : ''}`}>
              {i === 0 && <Icon name="check" size="14px" />} {c}
            </span>
          ))}
        </div>
        <div className="p-row end">
          <Button variant="text">Cancel</Button>
          <Button onClick={() => setSubmitted(true)}>Save changes</Button>
        </div>
      </form>
    </div>
  );
}

export function OverlaysScreen() {
  const [dialog, setDialog] = useState(false);
  const [toast, setToast] = useState(false);
  return (
    <div className="p-stack">
      <div className="t-headline">Components</div>
      <div className="p-card">
        <div className="t-title-medium">Buttons</div>
        <div className="p-row wrap">
          <Button variant="filled">Filled</Button>
          <Button variant="tonal">Tonal</Button>
          <Button variant="outlined">Outlined</Button>
          <Button variant="text">Text</Button>
        </div>
        <div className="t-title-medium">Status</div>
        <div className="p-row wrap">
          {(['success', 'warning', 'error', 'info'] as const).map((t) => (
            <span key={t} className={`p-chip tone-${t}`}>
              {t}
            </span>
          ))}
          <span className="p-badge">12</span>
        </div>
        <div className="t-title-medium">Overlays</div>
        <div className="p-row wrap">
          <Button onClick={() => setDialog(true)}>Open dialog</Button>
          <Button
            variant="outlined"
            onClick={() => {
              setToast(true);
              setTimeout(() => setToast(false), 2500);
            }}
          >
            Show toast
          </Button>
        </div>
      </div>
      <div className="p-card">
        <div className="t-title-medium">Typography</div>
        <div className="t-display">Display</div>
        <div className="t-headline">Headline</div>
        <div className="t-title-large">Title large</div>
        <div className="t-body-large">Body large — the quick brown fox.</div>
        <div className="t-body-medium">Body medium — the quick brown fox.</div>
        <div className="t-label-large">Label large</div>
        <div className="t-caption">Caption · 2 minutes ago</div>
      </div>

      {dialog && (
        <div className="p-overlay" onClick={() => setDialog(false)}>
          <div className="p-dialog" role="dialog" aria-modal onClick={(e) => e.stopPropagation()}>
            <div className="t-title-large">Cancel shipment?</div>
            <p className="t-body-medium muted">The driver will be notified and the order returned to the depot.</p>
            <div className="p-row end">
              <Button variant="text" onClick={() => setDialog(false)}>
                Keep it
              </Button>
              <Button onClick={() => setDialog(false)}>Cancel shipment</Button>
            </div>
          </div>
        </div>
      )}
      {toast && <div className="p-toast">Shipment NW-1043 updated</div>}
    </div>
  );
}
