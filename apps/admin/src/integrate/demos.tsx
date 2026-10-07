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
import { useState, type ReactNode } from 'react';
import { Icon } from '../preview/icons.tsx';

/**
 * Live examples for the Integrate tab: each component's variants, rendered with the real @dts/react
 * components inside the client's theme. Keyed by ComponentDoc.id (checked by components.test.ts).
 */
function V({ label, children, stack }: { label: string; children: ReactNode; stack?: boolean }) {
  return (
    <div className="int-demo-variant">
      <span className="int-demo-label">{label}</span>
      <div className={stack ? 'int-demo-stack' : 'int-demo-row'}>{children}</div>
    </div>
  );
}

function ChipDemo() {
  const [on, setOn] = useState(['Email']);
  const [cities, setCities] = useState(['Auckland', 'Wellington']);
  return (
    <>
      <V label="Filter">
        {['Email', 'SMS', 'Push'].map((c) => (
          <Chip key={c} selected={on.includes(c)} onClick={() => setOn((l) => (l.includes(c) ? l.filter((x) => x !== c) : [...l, c]))}>
            {c}
          </Chip>
        ))}
      </V>
      <V label="Input (removable)">
        {cities.map((c) => (
          <Chip key={c} onRemove={() => setCities((l) => l.filter((x) => x !== c))}>
            {c}
          </Chip>
        ))}
        {!cities.length && (
          <Button size="sm" variant="text" onClick={() => setCities(['Auckland', 'Wellington'])}>
            Reset
          </Button>
        )}
      </V>
    </>
  );
}

function ToggleDemo({ kind }: { kind: 'checkbox' | 'switch' }) {
  const [a, setA] = useState(true);
  const [b, setB] = useState(false);
  const Comp = kind === 'checkbox' ? Checkbox : Switch;
  return (
    <V label="On, off and disabled" stack>
      <Comp label={kind === 'checkbox' ? 'I agree to the terms' : 'Delivery alerts'} checked={a} onChange={(e) => setA(e.target.checked)} />
      <Comp label={kind === 'checkbox' ? 'Email me receipts' : 'Weekly summary'} checked={b} onChange={(e) => setB(e.target.checked)} />
      <Comp label="Managed by your agency" checked disabled />
    </V>
  );
}

function ToastDemo() {
  const [open, setOpen] = useState(false);
  return (
    <V label="Bottom of the screen, auto-dismiss">
      <Button variant="outlined" onClick={() => setOpen(true)}>
        Archive order
      </Button>
      <Toast open={open} message="Order archived" actionLabel="Undo" onAction={() => {}} onClose={() => setOpen(false)} />
    </V>
  );
}

function DialogDemo() {
  const [open, setOpen] = useState(false);
  return (
    <V label="Form dialog">
      <Button onClick={() => setOpen(true)}>Rename route</Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Rename route"
        description="Drivers see this name in their app."
        actions={
          <>
            <Button variant="text" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setOpen(false)}>Save</Button>
          </>
        }
      >
        <TextField label="Route name" defaultValue="Auckland CBD loop" />
      </Dialog>
    </V>
  );
}

function ConfirmDemo() {
  const [open, setOpen] = useState<'' | 'safe' | 'danger'>('');
  return (
    <V label="Standard and destructive">
      <Button variant="outlined" onClick={() => setOpen('safe')}>
        Publish theme
      </Button>
      <Button variant="danger" onClick={() => setOpen('danger')}>
        Delete client
      </Button>
      <ConfirmDialog
        open={open !== ''}
        title={open === 'danger' ? 'Delete Acme Logistics?' : 'Publish v4?'}
        description={open === 'danger' ? 'Their theme and history are removed.' : 'Apps pick it up on their next launch.'}
        confirmLabel={open === 'danger' ? 'Delete client' : 'Publish'}
        destructive={open === 'danger'}
        onConfirm={() => setOpen('')}
        onCancel={() => setOpen('')}
      />
    </V>
  );
}

function ButtonDemo() {
  const [loading, setLoading] = useState(false);
  return (
    <>
      <V label="Variants">
        <Button>Theme default</Button>
        <Button variant="tonal">Tonal</Button>
        <Button variant="outlined">Outlined</Button>
        <Button variant="text">Text</Button>
        <Button variant="danger">Delete</Button>
      </V>
      <V label="Sizes and icon">
        <Button size="sm">Small</Button>
        <Button size="lg">Large</Button>
        <Button icon={<Icon name="plus" size="18px" />}>New shipment</Button>
      </V>
      <V label="States">
        <Button
          loading={loading}
          onClick={() => {
            setLoading(true);
            setTimeout(() => setLoading(false), 1500);
          }}
        >
          Save
        </Button>
        <Button disabled>Disabled</Button>
      </V>
    </>
  );
}

export const DEMOS: Record<string, () => ReactNode> = {
  button: () => <ButtonDemo />,
  'icon-button': () => (
    <V label="Standard, filled, tonal, outlined">
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
    </V>
  ),
  'text-field': () => (
    <V label="Default, hint and affixes, error, multiline, disabled" stack>
      <TextField label="Company name" defaultValue="Northwind Freight" />
      <TextField label="Amount" prefix="$" suffix="NZD" placeholder="0.00" hint="Excluding GST" />
      <TextField label="Email" defaultValue="ops@northwind" error="Enter a valid email address" />
      <TextField label="Notes" multiline placeholder="Optional" />
      <TextField label="Account ID" defaultValue="ACME-0042" disabled />
    </V>
  ),
  checkbox: () => <ToggleDemo kind="checkbox" />,
  switch: () => <ToggleDemo kind="switch" />,
  chip: () => <ChipDemo />,
  'status-chip': () => (
    <V label="Tones">
      <StatusChip tone="success">Delivered</StatusChip>
      <StatusChip tone="info">In transit</StatusChip>
      <StatusChip tone="warning">Delayed</StatusChip>
      <StatusChip tone="error">Failed</StatusChip>
      <StatusChip>Draft</StatusChip>
    </V>
  ),
  badge: () => (
    <V label="Count on an icon, dot, capped count">
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
    </V>
  ),
  card: () => (
    <>
      <V label="Elevated, outlined, filled">
        <div className="int-demo-grid">
          <Card title="Elevated" subtitle="Theme card shadow" actions={<Button variant="text" size="sm">Open</Button>} />
          <Card variant="outlined" title="Outlined" subtitle="Hairline border" />
          <Card variant="filled" title="Filled" subtitle="Tinted surface" />
        </div>
      </V>
      <V label="Media card">
        <div className="int-demo-grid">
          <Card title="Auckland CBD loop" subtitle="12 stops · 38 km" media={<div className="int-demo-media" aria-hidden />} actions={<Button size="sm">View route</Button>} />
        </div>
      </V>
    </>
  ),
  'stat-card': () => (
    <div className="int-demo-grid">
      <StatCard label="Active shipments" value="128" delta="+12%" deltaTone="success" />
      <StatCard label="Exceptions" value="7" delta="+3" deltaTone="error" />
    </div>
  ),
  list: () => (
    <Card flush>
      <List>
        <ListItem onClick={() => {}} leading={<Avatar name="Auckland CBD" size="sm" />} headline="NW-1042" supporting="To Auckland CBD" trailing={<StatusChip tone="success">Delivered</StatusChip>} />
        <ListItem onClick={() => {}} leading={<Avatar name="Wellington Port" size="sm" />} headline="NW-1043" supporting="To Wellington Port" trailing={<StatusChip tone="info">In transit</StatusChip>} />
        <ListItem headline="Static row" supporting="Not interactive" trailing={<Icon name="chevron" />} />
      </List>
    </Card>
  ),
  avatar: () => (
    <V label="Small, medium, large">
      <Avatar name="Sam Kirk" size="sm" />
      <Avatar name="Aroha Ngata" />
      <Avatar name="Lee Chen" size="lg" />
    </V>
  ),
  alert: () => (
    <V label="Info, success, warning, error" stack>
      <Alert tone="info" title="Scheduled maintenance" onClose={() => {}}>
        Tracking pauses Sunday 02:00–03:00.
      </Alert>
      <Alert tone="success" title="Route optimised" />
      <Alert tone="warning" title="Driver running late" actions={<Button size="sm" variant="outlined">Notify customer</Button>}>
        NW-1044 is 25 minutes behind.
      </Alert>
      <Alert tone="error" title="Payment failed">
        The card ending 4242 was declined.
      </Alert>
    </V>
  ),
  toast: () => <ToastDemo />,
  progress: () => (
    <>
      <V label="Determinate and indeterminate" stack>
        <Progress label="Uploading manifest" value={64} />
        <Progress label="Syncing" />
      </V>
      <V label="Spinners">
        <Spinner size="sm" />
        <Spinner />
        <Spinner size="lg" />
      </V>
    </>
  ),
  skeleton: () => (
    <V label="Circle, text lines, rect" stack>
      <div className="int-demo-row">
        <Skeleton variant="circle" />
        <div style={{ flex: 1 }}>
          <Skeleton lines={2} />
        </div>
      </div>
      <Skeleton variant="rect" height={80} />
    </V>
  ),
  'empty-state': () => (
    <Card variant="outlined">
      <EmptyState icon={<Icon name="truck" />} title="No shipments yet" description="Create your first shipment to see live tracking here." actions={<Button>New shipment</Button>} />
    </Card>
  ),
  dialog: () => <DialogDemo />,
  'confirm-dialog': () => <ConfirmDemo />,
  tabs: () => (
    <Tabs
      label="Shipment"
      items={[
        { id: 'summary', label: 'Summary', content: <Text muted>3 parcels · 12.4 kg · Due Thu</Text> },
        { id: 'tracking', label: 'Tracking', content: <Progress label="Delivery progress" value={70} /> },
        { id: 'invoice', label: 'Invoice', content: <Text muted>Invoice #2041 · $184.20</Text> },
      ]}
    />
  ),
  text: () => (
    <V label="Text styles" stack>
      <Text variant="headline">Headline</Text>
      <Text variant="titleMedium">Title medium</Text>
      <Text>Body medium: the quick brown fox.</Text>
      <Text variant="caption" muted>
        Caption · 2 minutes ago
      </Text>
    </V>
  ),
};
