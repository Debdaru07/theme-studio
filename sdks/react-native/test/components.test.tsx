import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState, type ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Theme } from '@dts/schema';
import globexJson from '@dts/schema/fixtures/globex.json' with { type: 'json' };
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Checkbox,
  Chip,
  ConfirmDialog,
  EmptyState,
  IconButton,
  ListItem,
  Progress,
  StatCard,
  StatusChip,
  Switch,
  Tabs,
  TextField,
  ThemeProvider,
  Toast,
} from '../src/index.ts';

const globex = globexJson as unknown as Theme;
const wrap = (ui: ReactNode) => render(<ThemeProvider theme={globex} mode="light">{ui}</ThemeProvider>);
afterEach(cleanup);

describe('React Native components', () => {
  it('Button is a labelled button that is busy and disabled while loading', () => {
    const onPress = vi.fn();
    wrap(<Button title="Save" onPress={onPress} loading />);
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button.getAttribute('aria-busy')).toBe('true');
    fireEvent.click(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('Button presses when enabled, IconButton needs a label', () => {
    const onPress = vi.fn();
    wrap(
      <>
        <Button title="Go" onPress={onPress} />
        <IconButton label="Search" icon={null} />
      </>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Go' }));
    expect(onPress).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: 'Search' })).toBeTruthy();
  });

  it('TextField is labelled and reports changes', () => {
    const onChangeText = vi.fn();
    wrap(<TextField label="Email" onChangeText={onChangeText} error="Enter a valid email" />);
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.co' } });
    expect(onChangeText).toHaveBeenCalledWith('a@b.co');
    expect(screen.getByText('Enter a valid email')).toBeTruthy();
  });

  it('Checkbox and Switch expose checked state', () => {
    function Harness() {
      const [on, setOn] = useState(false);
      return (
        <>
          <Checkbox label="I agree" value={on} onValueChange={setOn} />
          <Switch label="Alerts" value onValueChange={() => {}} />
        </>
      );
    }
    wrap(<Harness />);
    const box = screen.getByRole('checkbox', { name: 'I agree' });
    expect(box.getAttribute('aria-checked')).toBe('false');
    fireEvent.click(box);
    expect(screen.getByRole('checkbox', { name: 'I agree' }).getAttribute('aria-checked')).toBe('true');
    expect((screen.getByRole('switch', { name: 'Alerts' }) as HTMLInputElement).checked).toBe(true);
  });

  it('Chip exposes selection and input chips can be removed', () => {
    const onRemove = vi.fn();
    wrap(
      <>
        <Chip label="Email" selected />
        <Chip label="Auckland" onRemove={onRemove} />
      </>,
    );
    expect(screen.getByRole('button', { name: 'Email' }).getAttribute('aria-selected')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Remove Auckland' }));
    expect(onRemove).toHaveBeenCalledOnce();
  });

  it('display components carry text, not just color', () => {
    wrap(
      <>
        <StatusChip label="Delayed" tone="warning" />
        <Badge count={250} label="250 notifications" />
        <Avatar name="Sam Kirk" />
        <StatCard label="Exceptions" value="7" delta="+3" deltaTone="error" />
        <Card title="Next booking" />
        <EmptyState title="No orders yet" />
      </>,
    );
    expect(screen.getByText('Delayed')).toBeTruthy();
    expect(screen.getByLabelText('250 notifications').textContent).toBe('99+');
    expect(screen.getByRole('img', { name: 'Sam Kirk' }).textContent).toBe('SK');
    expect(screen.getByText('+3')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Next booking' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'No orders yet' })).toBeTruthy();
  });

  it('ListItem is pressable only with onPress', () => {
    const onPress = vi.fn();
    wrap(
      <>
        <ListItem headline="Static" />
        <ListItem headline="NW-1042" supporting="Auckland" onPress={onPress} />
      </>,
    );
    expect(screen.queryByRole('button', { name: /Static/ })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'NW-1042, Auckland' }));
    expect(onPress).toHaveBeenCalledOnce();
  });

  it('Alert is assertive for errors; Progress reports its value', () => {
    wrap(
      <>
        <Alert tone="error" title="Payment failed" />
        <Progress label="Upload" value={42} />
      </>,
    );
    expect(screen.getByRole('alert').getAttribute('aria-live')).toBe('assertive');
    expect(screen.getByRole('progressbar', { name: 'Upload' }).getAttribute('aria-valuenow')).toBe('42');
  });

  it('Toast auto-dismisses', () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    wrap(<Toast visible message="Saved" onClose={onClose} duration={500} />);
    expect(screen.getByText('Saved')).toBeTruthy();
    act(() => vi.advanceTimersByTime(500));
    expect(onClose).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });

  it('ConfirmDialog renders a destructive decision', () => {
    const onConfirm = vi.fn();
    wrap(<ConfirmDialog visible title="Delete client?" confirmLabel="Delete" onConfirm={onConfirm} onCancel={() => {}} destructive />);
    expect(screen.getByRole('heading', { name: 'Delete client?' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('Tabs select and show content', () => {
    wrap(
      <Tabs
        label="Order"
        items={[
          { id: 'a', label: 'Summary', content: 'Summary panel' },
          { id: 'b', label: 'Invoice', content: 'Invoice panel' },
        ]}
      />,
    );
    fireEvent.click(screen.getByRole('tab', { name: 'Invoice' }));
    expect(screen.getByRole('tab', { name: 'Invoice' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByText('Invoice panel')).toBeTruthy();
  });
});
