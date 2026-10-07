/**
 * Tiny stand-in for `react-native` used by tests and the package typecheck
 * (vitest `resolve.alias` + tsconfig `paths`). Only what @dts/react-native touches.
 */
import { useSyncExternalStore } from 'react';

export type ColorSchemeName = 'light' | 'dark' | null | undefined;
export interface ScaledSize {
  width: number;
  height: number;
  scale: number;
  fontScale: number;
}

interface MockState {
  colorScheme: ColorSchemeName;
  window: ScaledSize;
  reduceMotion: boolean;
}

let state: MockState = initial();
const listeners = new Set<() => void>();
const reduceMotionListeners = new Set<(enabled: boolean) => void>();

function initial(): MockState {
  return { colorScheme: 'light', window: { width: 390, height: 844, scale: 3, fontScale: 1 }, reduceMotion: false };
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

/** Test controls. */
export const __mock = {
  set(patch: Partial<MockState>) {
    state = { ...state, ...patch };
    if (patch.reduceMotion !== undefined) for (const l of [...reduceMotionListeners]) l(state.reduceMotion);
    for (const l of [...listeners]) l();
  },
  reset() {
    state = initial();
    reduceMotionListeners.clear();
    for (const l of [...listeners]) l();
  },
};

export function useColorScheme(): ColorSchemeName {
  return useSyncExternalStore(subscribe, () => state.colorScheme);
}

export function useWindowDimensions(): ScaledSize {
  return useSyncExternalStore(subscribe, () => state.window);
}

export const Platform = {
  OS: 'ios' as 'ios' | 'android' | 'web',
  select<T>(spec: { ios?: T; android?: T; default?: T }): T | undefined {
    return spec[this.OS as 'ios' | 'android'] ?? spec.default;
  },
};

export const AccessibilityInfo = {
  isReduceMotionEnabled: (): Promise<boolean> => Promise.resolve(state.reduceMotion),
  addEventListener(_event: 'reduceMotionChanged', handler: (enabled: boolean) => void): { remove(): void } {
    reduceMotionListeners.add(handler);
    return { remove: () => reduceMotionListeners.delete(handler) };
  },
};

// ── UI primitives (for the component tests) ───────────────────────────────────
// Rendered as plain DOM so tests can query by role/label; RN accessibility props map to ARIA.

import { createElement, type ReactNode } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Style = any;
type A11yRole = 'button' | 'switch' | 'checkbox' | 'header' | 'alert' | 'progressbar' | 'tab' | 'tablist' | 'image' | 'text' | 'summary' | 'none';
export interface AccessibilityProps {
  accessible?: boolean;
  accessibilityRole?: A11yRole;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityState?: { disabled?: boolean; selected?: boolean; checked?: boolean | 'mixed'; busy?: boolean; expanded?: boolean };
  accessibilityValue?: { min?: number; max?: number; now?: number; text?: string };
  accessibilityLiveRegion?: 'none' | 'polite' | 'assertive';
  accessibilityViewIsModal?: boolean;
  importantForAccessibility?: 'auto' | 'yes' | 'no' | 'no-hide-descendants';
  testID?: string;
}
export interface ViewProps extends AccessibilityProps {
  style?: Style;
  children?: ReactNode;
  pointerEvents?: 'auto' | 'none' | 'box-none' | 'box-only';
}
export interface TextProps extends AccessibilityProps {
  style?: Style;
  children?: ReactNode;
  numberOfLines?: number;
}
export interface PressableProps extends AccessibilityProps {
  style?: Style | ((state: { pressed: boolean }) => Style);
  children?: ReactNode | ((state: { pressed: boolean }) => ReactNode);
  onPress?: () => void;
  disabled?: boolean;
  hitSlop?: number;
}
export interface TextInputProps extends AccessibilityProps {
  style?: Style;
  value?: string;
  defaultValue?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  placeholderTextColor?: string;
  multiline?: boolean;
  editable?: boolean;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'url';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  onBlur?: () => void;
  onFocus?: () => void;
}
export interface SwitchProps extends AccessibilityProps {
  value?: boolean;
  onValueChange?: (value: boolean) => void;
  disabled?: boolean;
  trackColor?: { false?: string; true?: string };
  thumbColor?: string;
  ios_backgroundColor?: string;
}
export interface ModalProps {
  visible?: boolean;
  transparent?: boolean;
  animationType?: 'none' | 'fade' | 'slide';
  onRequestClose?: () => void;
  children?: ReactNode;
}
export interface ImageProps extends AccessibilityProps {
  source: { uri: string };
  style?: Style;
}
export interface ActivityIndicatorProps extends AccessibilityProps {
  color?: string;
  size?: 'small' | 'large';
}

const aria = (p: AccessibilityProps) => ({
  role: p.accessibilityRole && p.accessibilityRole !== 'none' ? ({ header: 'heading', image: 'img' } as Record<string, string>)[p.accessibilityRole] ?? p.accessibilityRole : undefined,
  'aria-label': p.accessibilityLabel,
  'aria-disabled': p.accessibilityState?.disabled || undefined,
  'aria-selected': p.accessibilityState?.selected,
  'aria-checked': p.accessibilityState?.checked,
  'aria-busy': p.accessibilityState?.busy || undefined,
  'aria-valuenow': p.accessibilityValue?.now,
  'aria-live': p.accessibilityLiveRegion && p.accessibilityLiveRegion !== 'none' ? p.accessibilityLiveRegion : undefined,
  'aria-modal': p.accessibilityViewIsModal || undefined,
  'aria-hidden': p.importantForAccessibility === 'no-hide-descendants' || undefined,
  'data-testid': p.testID,
});

export const View = (p: ViewProps) => createElement('div', aria(p), p.children);
export const Text = (p: TextProps) => createElement('span', aria(p), p.children);
export const Pressable = (p: PressableProps) =>
  createElement(
    'button',
    { type: 'button', onClick: p.disabled ? undefined : p.onPress, disabled: p.disabled, ...aria(p), role: aria(p).role === 'button' ? undefined : aria(p).role },
    typeof p.children === 'function' ? p.children({ pressed: false }) : p.children,
  );
export const TextInput = (p: TextInputProps) =>
  createElement(p.multiline ? 'textarea' : 'input', {
    value: p.value,
    defaultValue: p.defaultValue,
    placeholder: p.placeholder,
    readOnly: p.editable === false,
    onChange: (e: { target: { value: string } }) => p.onChangeText?.(e.target.value),
    ...aria(p),
  });
export const Switch = (p: SwitchProps) =>
  createElement('input', {
    type: 'checkbox',
    role: 'switch',
    checked: !!p.value,
    disabled: p.disabled,
    onChange: () => p.onValueChange?.(!p.value),
    'aria-label': p.accessibilityLabel,
  });
export const Modal = (p: ModalProps) => (p.visible ? createElement('div', { 'data-modal': true }, p.children) : null);
export const Image = (p: ImageProps) => createElement('img', { src: p.source.uri, alt: p.accessibilityLabel ?? '' });
export const ActivityIndicator = (p: ActivityIndicatorProps) => createElement('div', { role: 'progressbar', 'aria-label': p.accessibilityLabel });

export const StyleSheet = {
  create: <T extends Record<string, Style>>(styles: T): T => styles,
  hairlineWidth: 1,
};
