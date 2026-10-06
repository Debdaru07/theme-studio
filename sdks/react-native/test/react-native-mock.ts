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
