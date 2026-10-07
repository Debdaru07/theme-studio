import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Checkbox,
  Chip,
  ConfirmDialog,
  Dialog,
  EmptyState,
  IconButton,
  List,
  ListItem,
  Progress,
  Skeleton,
  Spinner,
  StatCard,
  StatusChip,
  Switch,
  Tabs,
  Text,
  TextField,
  Toast,
} from '@dts/react';
import { useRef, useState, type ReactNode } from 'react';
import { Icon } from './icons.tsx';

/**
 * Every @dts/react component in the client's theme. It renders the real SDK components and
 * '@dts/react/components.css' only (no preview styles), so it is exactly what a customer app gets.
 */
const SECTIONS = ['Buttons', 'Inputs', 'Cards', 'Lists', 'Feedback', 'Overlays', 'Navigation', 'Empty states', 'Typography'] as const;
type SectionId = (typeof SECTIONS)[number];

function Section({ id, title, note, children }: { id: SectionId; title: string; note?: string; children: ReactNode }) {
  return (
    <section className="g-section" data-section={id} aria-labelledby={`g-${id}`}>
      <div className="g-head">
        <Text as="h2" variant="titleLarge" id={`g-${id}`}>
          {title}
        </Text>
        {note && (
          <Text variant="bodySmall" muted>
            {note}
          </Text>
        )}
      </div>
      {children}
    </section>
  );
}

function Demo({ label, children, stack }: { label: string; children: ReactNode; stack?: boolean }) {
  return (
    <div className="g-demo">
      <Text variant="labelMedium" muted as="span">
        {label}
      </Text>
      <div className={stack ? 'g-stack' : 'g-row'}>{children}</div>
    </div>
  );
}

const ORDERS = [
  { id: 'NW-1042', to: 'Auckland CBD', status: 'Delivered', tone: 'success' },
  { id: 'NW-1043', to: 'Wellington Port', status: 'In transit', tone: 'info' },
  { id: 'NW-1044', to: 'Christchurch', status: 'Delayed', tone: 'warning' },
] as const;

export function Gallery() {
  const root = useRef<HTMLDivElement>(null);
  const [filters, setFilters] = useState<string[]>(['Email']);
  const [cities, setCities] = useState(['Auckland', 'Wellington']);
  const [agree, setAgree] = useState(true);
  const [alerts, setAlerts] = useState(true);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(false);
  const [dialog, setDialog] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [notice, setNotice] = useState(true);

  const jump = (id: SectionId) => root.current?.querySelector(`[data-section="${id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  return (
    <div className="g-root" ref={root}>
      <header className="g-intro">
        <Text as="h1" variant="headline">
          Components
        </Text>
        <Text variant="bodyMedium" muted>
          Live @dts/react components in this theme. Switch device and mode above; the Integrate tab shows the code for every SDK.
        </Text>
        <nav className="g-jump" aria-label="Component groups">
          {SECTIONS.map((s) => (
            <Chip key={s} onClick={() => jump(s)}>
              {s}
            </Chip>
          ))}
        </nav>
      </header>

      <Section id="Buttons" title="Buttons" note="The unmarked button follows the theme's button variant.">
        <Demo label="Variants">
          <Button>Theme default</Button>
          <Button variant="filled">Filled</Button>
          <Button variant="tonal">Tonal</Button>
          <Button variant="outlined">Outlined</Button>
          <Button variant="text">Text</Button>
          <Button variant="danger">Delete</Button>
        </Demo>
        <Demo label="Sizes and icons">
          <Button size="sm">Small</Button>
          <Button>Medium</Button>
          <Button size="lg">Large</Button>
          <Button icon={<Icon name="plus" size="18px" />}>New shipment</Button>
          <Button variant="outlined" icon={<Icon name="chevron" size="18px" />} iconPosition="end">
            Next
          </Button>
        </Demo>
        <Demo label="States">
          <Button
            loading={loading}
            onClick={() => {
              setLoading(true);
              setTimeout(() => setLoading(false), 1500);
            }}
          >
            {loading ? 'Saving' : 'Click to load'}
          </Button>
          <Button disabled>Disabled</Button>
        </Demo>
        <Demo label="Block">
          <Button block>Continue to payment</Button>
        </Demo>
        <Demo label="Icon buttons">
          <IconButton label="Search">
            <Icon name="search" />
          </IconButton>
          <IconButton label="Add" variant="filled">
            <Icon name="plus" />
          </IconButton>
          <IconButton label="Notifications" variant="tonal">
            <Icon name="bell" />
          </IconButton>
          <IconButton label="Menu" variant="outlined">
            <Icon name="menu" />
          </IconButton>
        </Demo>
      </Section>

      <Section id="Inputs" title="Inputs" note="Fields use the theme's input variant (outlined or filled).">
        <div className="g-stack">
          <TextField label="Company name" defaultValue="Northwind Freight" />
          <TextField label="Email" defaultValue="ops@northwind" error="Enter a valid email address" />
          <TextField label="Amount" prefix="$" suffix="NZD" placeholder="0.00" inputMode="decimal" hint="Excluding GST" />
          <TextField label="Notes" multiline placeholder="Optional" />
          <TextField label="Account ID" defaultValue="ACME-0042" disabled />
        </div>
        <Demo label="Checkbox and switch" stack>
          <Checkbox label="I agree to the terms" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
          <Switch label="Delivery alerts" checked={alerts} onChange={(e) => setAlerts(e.target.checked)} />
        </Demo>
        <Demo label="Filter chips">
          {['Email', 'SMS', 'Push'].map((c) => (
            <Chip key={c} selected={filters.includes(c)} onClick={() => setFilters((f) => toggle(f, c))}>
              {c}
            </Chip>
          ))}
        </Demo>
        <Demo label="Input chips">
          {cities.map((c) => (
            <Chip key={c} onRemove={() => setCities((list) => list.filter((x) => x !== c))}>
              {c}
            </Chip>
          ))}
          {cities.length === 0 && (
            <Button variant="text" size="sm" onClick={() => setCities(['Auckland', 'Wellington'])}>
              Reset chips
            </Button>
          )}
        </Demo>
      </Section>

      <Section id="Cards" title="Cards" note="Radius, padding, shadow and border come from the theme's card tokens.">
        <div className="g-grid">
          <Card title="Elevated" subtitle="Default card" actions={<Button variant="text">Open</Button>}>
            <Text variant="bodyMedium" muted>
              Uses the card elevation from the theme.
            </Text>
          </Card>
          <Card variant="outlined" title="Outlined" subtitle="Hairline border">
            <Text variant="bodyMedium" muted>
              For dense layouts and lists.
            </Text>
          </Card>
          <Card variant="filled" title="Filled" subtitle="Tinted surface">
            <Text variant="bodyMedium" muted>
              Groups secondary content.
            </Text>
          </Card>
        </div>
        <div className="g-grid">
          <StatCard label="Active shipments" value="128" delta="+12%" deltaTone="success" />
          <StatCard label="On-time rate" value="96.4%" delta="+0.8%" deltaTone="success" />
          <StatCard label="Exceptions" value="7" delta="+3" deltaTone="error" />
        </div>
        <div className="g-grid">
          <Card
          title="Media card"
          subtitle="Image or chart on top"
          media={<div className="g-media" aria-hidden />}
          actions={
            <>
              <Button variant="text">Share</Button>
              <Button>View route</Button>
            </>
          }
        />
          <Card variant="outlined" href="#" title="Link card" subtitle="The whole card navigates" onClick={(e) => e.preventDefault()} />
        </div>
      </Section>

      <Section id="Lists" title="Lists, avatars and badges">
        <Card flush>
          <List>
            {ORDERS.map((o) => (
              <ListItem
                key={o.id}
                onClick={() => {}}
                leading={<Avatar name={o.to} size="sm" />}
                headline={o.id}
                supporting={`To ${o.to}`}
                trailing={<StatusChip tone={o.tone}>{o.status}</StatusChip>}
              />
            ))}
          </List>
        </Card>
        <Demo label="Avatars">
          <Avatar name="Sam Kirk" size="sm" />
          <Avatar name="Aroha Ngata" />
          <Avatar name="Lee Chen" size="lg" />
        </Demo>
        <Demo label="Badges">
          <Badge count={3} label="3 unread messages">
            <IconButton label="Messages">
              <Icon name="bell" />
            </IconButton>
          </Badge>
          <Badge dot label="New activity">
            <IconButton label="Activity">
              <Icon name="list" />
            </IconButton>
          </Badge>
          <Badge count={128} label="128 notifications" />
        </Demo>
        <Demo label="Status">
          <StatusChip tone="success">Delivered</StatusChip>
          <StatusChip tone="info">In transit</StatusChip>
          <StatusChip tone="warning">Delayed</StatusChip>
          <StatusChip tone="error">Failed</StatusChip>
          <StatusChip>Draft</StatusChip>
        </Demo>
      </Section>

      <Section id="Feedback" title="Feedback">
        <div className="g-stack">
          {notice && (
            <Alert tone="info" title="Scheduled maintenance" onClose={() => setNotice(false)}>
              Tracking pauses on Sunday 02:00–03:00.
            </Alert>
          )}
          <Alert tone="success" title="Route optimised">
            12 stops reordered, saving 38 minutes.
          </Alert>
          <Alert tone="warning" title="Driver running late" actions={<Button size="sm" variant="outlined">Notify customer</Button>}>
            NW-1044 is 25 minutes behind schedule.
          </Alert>
          <Alert tone="error" title="Payment failed">
            The card ending 4242 was declined.
          </Alert>
        </div>
        <Demo label="Progress" stack>
          <Progress label="Uploading manifest" value={64} />
          <Progress label="Syncing" />
        </Demo>
        <Demo label="Spinners">
          <Spinner size="sm" />
          <Spinner />
          <Spinner size="lg" />
        </Demo>
        <Demo label="Skeleton" stack>
          <div className="g-skeleton">
            <Skeleton variant="circle" />
            <Skeleton lines={2} width="100%" />
          </div>
          <Skeleton variant="rect" />
        </Demo>
        <Demo label="Toast">
          <Button variant="outlined" onClick={() => setToast(true)}>
            Show toast
          </Button>
        </Demo>
      </Section>

      <Section id="Overlays" title="Dialogs" note="Focus moves into the dialog, Tab stays inside, Escape closes.">
        <Demo label="Types">
          <Button onClick={() => setDialog(true)}>Form dialog</Button>
          <Button variant="danger" onClick={() => setConfirm(true)}>
            Confirm (destructive)
          </Button>
        </Demo>
      </Section>

      <Section id="Navigation" title="Tabs" note="Arrow keys move between tabs.">
        <Tabs
          label="Shipment"
          items={[
            { id: 'summary', label: 'Summary', content: <Text muted>3 parcels · 12.4 kg · Due Thu 14 Nov</Text> },
            { id: 'tracking', label: 'Tracking', content: <Progress label="Delivery progress" value={70} /> },
            { id: 'invoice', label: 'Invoice', content: <Text muted>Invoice #2041 · $184.20</Text> },
            { id: 'returns', label: 'Returns', content: null, disabled: true },
          ]}
        />
      </Section>

      <Section id="Empty states" title="Empty states">
        <Card variant="outlined">
          <EmptyState
            icon={<Icon name="truck" />}
            title="No shipments yet"
            description="Create your first shipment and it will appear here with live tracking."
            actions={<Button icon={<Icon name="plus" size="18px" />}>New shipment</Button>}
          />
        </Card>
      </Section>

      <Section id="Typography" title="Typography" note="The 10 text styles of this theme.">
        <div className="g-stack tight">
          <Text variant="display">Display</Text>
          <Text variant="headline">Headline</Text>
          <Text variant="titleLarge">Title large</Text>
          <Text variant="titleMedium">Title medium</Text>
          <Text variant="bodyLarge">Body large: the quick brown fox.</Text>
          <Text variant="bodyMedium">Body medium: the quick brown fox.</Text>
          <Text variant="bodySmall">Body small: the quick brown fox.</Text>
          <Text variant="labelLarge">Label large</Text>
          <Text variant="labelMedium">Label medium</Text>
          <Text variant="caption">Caption · 2 minutes ago</Text>
        </div>
      </Section>

      <Toast open={toast} message="Shipment NW-1043 updated" actionLabel="Undo" onAction={() => {}} onClose={() => setToast(false)} />
      <Dialog
        open={dialog}
        onClose={() => setDialog(false)}
        title="Rename route"
        description="Drivers see this name in their app."
        actions={
          <>
            <Button variant="text" onClick={() => setDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => setDialog(false)}>Save</Button>
          </>
        }
      >
        <TextField label="Route name" defaultValue="Auckland CBD loop" />
      </Dialog>
      <ConfirmDialog
        open={confirm}
        title="Cancel shipment?"
        description="The driver is notified and the parcels return to the depot."
        confirmLabel="Cancel shipment"
        cancelLabel="Keep it"
        destructive
        onConfirm={() => setConfirm(false)}
        onCancel={() => setConfirm(false)}
      />
    </div>
  );
}
