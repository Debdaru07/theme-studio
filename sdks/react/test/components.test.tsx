import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import type { Theme } from '@debdaru07/schema';
import globexJson from '@debdaru07/schema/fixtures/globex.json' with { type: 'json' };
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
  ListItem,
  List,
  Progress,
  StatCard,
  StatusChip,
  Switch,
  Tabs,
  TextField,
  ThemeProvider,
  Toast,
} from '../src/index.ts';

const globex = globexJson as unknown as Theme; // button variant: outlined, input variant: filled

beforeAll(() => {
  window.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    onchange: null,
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
});
afterEach(cleanup);

describe('Button', () => {
  it('uses the theme variant by default and lets props override it', () => {
    render(
      <ThemeProvider theme={globex} mode="light" scope="element" loadFonts={false}>
        <Button>Theme default</Button>
        <Button variant="tonal">Tonal</Button>
      </ThemeProvider>,
    );
    expect(screen.getByRole('button', { name: 'Theme default' }).className).toContain('dts-button--outlined');
    expect(screen.getByRole('button', { name: 'Tonal' }).className).toContain('dts-button--tonal');
  });

  it('falls back to filled outside a provider, and blocks clicks while loading', () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Save
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button.className).toContain('dts-button--filled');
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect((button as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('renders a link with href', () => {
    render(<Button href="/orders">Orders</Button>);
    expect(screen.getByRole('link', { name: 'Orders' }).getAttribute('href')).toBe('/orders');
  });

  it('IconButton requires and exposes a label', () => {
    render(<IconButton label="Search">⌕</IconButton>);
    expect(screen.getByRole('button', { name: 'Search' })).toBeTruthy();
  });
});

describe('Inputs', () => {
  it('TextField labels the input and links hint and error', () => {
    render(<TextField label="Email" hint="Work address" error="Enter a valid email" />);
    const input = screen.getByLabelText('Email');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    const described = input.getAttribute('aria-describedby')!.split(' ').map((id) => document.getElementById(id)!.textContent);
    expect(described).toEqual(['Enter a valid email', 'Work address']);
  });

  it('TextField uses the theme input variant', () => {
    const { container } = render(
      <ThemeProvider theme={globex} mode="light" scope="element" loadFonts={false}>
        <TextField label="Notes" multiline />
      </ThemeProvider>,
    );
    expect(container.querySelector('.dts-field')!.className).toContain('dts-field--filled');
    expect(screen.getByLabelText('Notes').tagName).toBe('TEXTAREA');
  });

  it('Switch is a switch and Checkbox a checkbox', () => {
    render(
      <>
        <Switch label="Notifications" defaultChecked />
        <Checkbox label="I agree" />
      </>,
    );
    expect((screen.getByRole('switch', { name: 'Notifications' }) as HTMLInputElement).checked).toBe(true);
    expect(screen.getByRole('checkbox', { name: 'I agree' })).toBeTruthy();
  });

  it('Chip toggles aria-pressed and input chips can be removed', () => {
    const onRemove = vi.fn();
    render(
      <>
        <Chip selected>Email</Chip>
        <Chip onRemove={onRemove}>Auckland</Chip>
      </>,
    );
    expect(screen.getByRole('button', { name: 'Email' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Remove Auckland' }));
    expect(onRemove).toHaveBeenCalledOnce();
  });
});

describe('Display', () => {
  it('Badge caps the count and keeps a spoken label', () => {
    render(<Badge count={120} label="120 unread messages" />);
    const badge = screen.getByRole('status', { name: '120 unread messages' });
    expect(badge.textContent).toBe('99+');
  });

  it('StatusChip carries the word, not just color', () => {
    render(<StatusChip tone="error">Failed</StatusChip>);
    expect(screen.getByText('Failed').className).toContain('dts-status--error');
  });

  it('Card renders title, actions and becomes a link with href', () => {
    render(
      <>
        <Card title="Next booking" actions={<Button>Open</Button>}>
          Body
        </Card>
        <Card variant="outlined" href="/b" title="Linked" />
      </>,
    );
    expect(screen.getByRole('heading', { name: 'Next booking' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Linked' }).className).toContain('dts-card--outlined');
  });

  it('StatCard shows value and toned delta', () => {
    render(<StatCard label="On-time rate" value="96.4%" delta="+0.8%" deltaTone="success" />);
    expect(screen.getByText('+0.8%').className).toContain('dts-status--success');
  });

  it('ListItem is a button only when it does something', () => {
    const onClick = vi.fn();
    render(
      <List>
        <ListItem headline="Static" />
        <ListItem headline="Open order" supporting="NW-1042" onClick={onClick} />
      </List>,
    );
    expect(screen.queryByRole('button', { name: /Static/ })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Open order/ }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('Avatar shows initials and the full name to screen readers', () => {
    render(<Avatar name="Sam Kirk" />);
    expect(screen.getByRole('img', { name: 'Sam Kirk' }).textContent).toBe('SK');
  });

  it('EmptyState uses a heading', () => {
    render(<EmptyState title="No orders yet" description="Create one to get started." />);
    expect(screen.getByRole('heading', { name: 'No orders yet' })).toBeTruthy();
  });
});

describe('Feedback', () => {
  it('Alert role depends on urgency', () => {
    render(
      <>
        <Alert tone="error" title="Payment failed" />
        <Alert tone="success" title="Saved" />
      </>,
    );
    expect(screen.getByRole('alert').textContent).toContain('Payment failed');
    expect(screen.getByRole('status').textContent).toContain('Saved');
  });

  it('Progress exposes its value, and none when indeterminate', () => {
    render(
      <>
        <Progress label="Upload" value={140} />
        <Progress label="Sync" />
      </>,
    );
    expect(screen.getByRole('progressbar', { name: 'Upload' }).getAttribute('aria-valuenow')).toBe('100');
    expect(screen.getByRole('progressbar', { name: 'Sync' }).hasAttribute('aria-valuenow')).toBe(false);
  });

  it('Toast dismisses itself after its duration', () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    render(<Toast open message="Draft saved" onClose={onClose} duration={1000} />);
    expect(screen.getByRole('status').textContent).toContain('Draft saved');
    act(() => vi.advanceTimersByTime(1000));
    expect(onClose).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });
});

describe('Dialog', () => {
  function Harness() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <button type="button" onClick={() => setOpen(true)}>
          Open
        </button>
        <Dialog open={open} onClose={() => setOpen(false)} title="Rename" description="Pick a new name." actions={<Button onClick={() => setOpen(false)}>Done</Button>}>
          <TextField label="Name" />
        </Dialog>
      </>
    );
  }

  it('is labelled, traps focus, closes on Escape and restores focus', () => {
    render(<Harness />);
    const trigger = screen.getByRole('button', { name: 'Open' });
    trigger.focus();
    fireEvent.click(trigger);
    const dialog = screen.getByRole('dialog', { name: 'Rename' });
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(document.activeElement).toBe(screen.getByLabelText('Name'));
    // Tab from the last focusable wraps to the first.
    screen.getByRole('button', { name: 'Done' }).focus();
    fireEvent.keyDown(document.activeElement!, { key: 'Tab' });
    expect(document.activeElement).toBe(screen.getByLabelText('Name'));
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('ConfirmDialog focuses Cancel and styles destructive confirms', () => {
    const onConfirm = vi.fn();
    render(<ConfirmDialog open title="Delete client?" confirmLabel="Delete" onConfirm={onConfirm} onCancel={() => {}} destructive />);
    expect(screen.getByRole('alertdialog', { name: 'Delete client?' })).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Cancel' }));
    const confirm = screen.getByRole('button', { name: 'Delete' });
    expect(confirm.className).toContain('dts-button--danger');
    fireEvent.click(confirm);
    expect(onConfirm).toHaveBeenCalledOnce();
  });
});

describe('Tabs', () => {
  it('moves with arrow keys, skips disabled tabs and shows the matching panel', () => {
    render(
      <Tabs
        label="Order"
        items={[
          { id: 'summary', label: 'Summary', content: 'Summary panel' },
          { id: 'tracking', label: 'Tracking', content: 'Tracking panel', disabled: true },
          { id: 'invoice', label: 'Invoice', content: 'Invoice panel' },
        ]}
      />,
    );
    const summary = screen.getByRole('tab', { name: 'Summary' });
    expect(summary.getAttribute('aria-selected')).toBe('true');
    summary.focus();
    fireEvent.keyDown(summary, { key: 'ArrowRight' });
    const invoice = screen.getByRole('tab', { name: 'Invoice' });
    expect(invoice.getAttribute('aria-selected')).toBe('true');
    expect(document.activeElement).toBe(invoice);
    expect(screen.getByRole('tabpanel').textContent).toBe('Invoice panel');
    expect(summary.tabIndex).toBe(-1);
  });
});
