/**
 * Tiny stand-in for `react-native` used by tests and the package typecheck
 * (vitest `resolve.alias` + tsconfig `paths`). Only what @debdaru07/react-native touches.
 */
import { useSyncExternalStore } from 'react';
let state = initial();
const listeners = new Set();
const reduceMotionListeners = new Set();
function initial() {
    return { colorScheme: 'light', window: { width: 390, height: 844, scale: 3, fontScale: 1 }, reduceMotion: false };
}
const subscribe = (l) => {
    listeners.add(l);
    return () => {
        listeners.delete(l);
    };
};
/** Test controls. */
export const __mock = {
    set(patch) {
        state = { ...state, ...patch };
        if (patch.reduceMotion !== undefined)
            for (const l of [...reduceMotionListeners])
                l(state.reduceMotion);
        for (const l of [...listeners])
            l();
    },
    reset() {
        state = initial();
        reduceMotionListeners.clear();
        for (const l of [...listeners])
            l();
    },
};
export function useColorScheme() {
    return useSyncExternalStore(subscribe, () => state.colorScheme);
}
export function useWindowDimensions() {
    return useSyncExternalStore(subscribe, () => state.window);
}
export const Platform = {
    OS: 'ios',
    select(spec) {
        return spec[this.OS] ?? spec.default;
    },
};
export const AccessibilityInfo = {
    isReduceMotionEnabled: () => Promise.resolve(state.reduceMotion),
    addEventListener(_event, handler) {
        reduceMotionListeners.add(handler);
        return { remove: () => reduceMotionListeners.delete(handler) };
    },
};
// ── UI primitives (for the component tests) ───────────────────────────────────
// Rendered as plain DOM so tests can query by role/label; RN accessibility props map to ARIA.
import { createElement } from 'react';
const aria = (p) => ({
    role: p.accessibilityRole && p.accessibilityRole !== 'none' ? { header: 'heading', image: 'img' }[p.accessibilityRole] ?? p.accessibilityRole : undefined,
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
export const View = (p) => createElement('div', aria(p), p.children);
export const Text = (p) => createElement('span', aria(p), p.children);
export const Pressable = (p) => createElement('button', { type: 'button', onClick: p.disabled ? undefined : p.onPress, disabled: p.disabled, ...aria(p), role: aria(p).role === 'button' ? undefined : aria(p).role }, typeof p.children === 'function' ? p.children({ pressed: false }) : p.children);
export const TextInput = (p) => createElement(p.multiline ? 'textarea' : 'input', {
    value: p.value,
    defaultValue: p.defaultValue,
    placeholder: p.placeholder,
    readOnly: p.editable === false,
    onChange: (e) => p.onChangeText?.(e.target.value),
    ...aria(p),
});
export const Switch = (p) => createElement('input', {
    type: 'checkbox',
    role: 'switch',
    checked: !!p.value,
    disabled: p.disabled,
    onChange: () => p.onValueChange?.(!p.value),
    'aria-label': p.accessibilityLabel,
});
export const Modal = (p) => (p.visible ? createElement('div', { 'data-modal': true }, p.children) : null);
export const Image = (p) => createElement('img', { src: p.source.uri, alt: p.accessibilityLabel ?? '' });
export const ActivityIndicator = (p) => createElement('div', { role: 'progressbar', 'aria-label': p.accessibilityLabel });
export const StyleSheet = {
    create: (styles) => styles,
    hairlineWidth: 1,
};
