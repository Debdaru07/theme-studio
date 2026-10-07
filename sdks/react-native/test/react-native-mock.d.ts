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
/** Test controls. */
export declare const __mock: {
    set(patch: Partial<MockState>): void;
    reset(): void;
};
export declare function useColorScheme(): ColorSchemeName;
export declare function useWindowDimensions(): ScaledSize;
export declare const Platform: {
    OS: "ios" | "android" | "web";
    select<T>(spec: {
        ios?: T;
        android?: T;
        default?: T;
    }): T | undefined;
};
export declare const AccessibilityInfo: {
    isReduceMotionEnabled: () => Promise<boolean>;
    addEventListener(_event: "reduceMotionChanged", handler: (enabled: boolean) => void): {
        remove(): void;
    };
};
import { type ReactNode } from 'react';
type Style = any;
type A11yRole = 'button' | 'switch' | 'checkbox' | 'header' | 'alert' | 'progressbar' | 'tab' | 'tablist' | 'image' | 'text' | 'summary' | 'none';
export interface AccessibilityProps {
    accessible?: boolean;
    accessibilityRole?: A11yRole;
    accessibilityLabel?: string;
    accessibilityHint?: string;
    accessibilityState?: {
        disabled?: boolean;
        selected?: boolean;
        checked?: boolean | 'mixed';
        busy?: boolean;
        expanded?: boolean;
    };
    accessibilityValue?: {
        min?: number;
        max?: number;
        now?: number;
        text?: string;
    };
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
    style?: Style | ((state: {
        pressed: boolean;
    }) => Style);
    children?: ReactNode | ((state: {
        pressed: boolean;
    }) => ReactNode);
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
    trackColor?: {
        false?: string;
        true?: string;
    };
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
    source: {
        uri: string;
    };
    style?: Style;
}
export interface ActivityIndicatorProps extends AccessibilityProps {
    color?: string;
    size?: 'small' | 'large';
}
export declare const View: (p: ViewProps) => import("react").DetailedReactHTMLElement<{
    role: string | undefined;
    'aria-label': string | undefined;
    'aria-disabled': true | undefined;
    'aria-selected': boolean | undefined;
    'aria-checked': boolean | "mixed" | undefined;
    'aria-busy': true | undefined;
    'aria-valuenow': number | undefined;
    'aria-live': "polite" | "assertive" | undefined;
    'aria-modal': true | undefined;
    'aria-hidden': true | undefined;
    'data-testid': string | undefined;
}, HTMLElement>;
export declare const Text: (p: TextProps) => import("react").DetailedReactHTMLElement<{
    role: string | undefined;
    'aria-label': string | undefined;
    'aria-disabled': true | undefined;
    'aria-selected': boolean | undefined;
    'aria-checked': boolean | "mixed" | undefined;
    'aria-busy': true | undefined;
    'aria-valuenow': number | undefined;
    'aria-live': "polite" | "assertive" | undefined;
    'aria-modal': true | undefined;
    'aria-hidden': true | undefined;
    'data-testid': string | undefined;
}, HTMLElement>;
export declare const Pressable: (p: PressableProps) => import("react").DetailedReactHTMLElement<{
    role: string | undefined;
    'aria-label': string | undefined;
    'aria-disabled': true | undefined;
    'aria-selected': boolean | undefined;
    'aria-checked': boolean | "mixed" | undefined;
    'aria-busy': true | undefined;
    'aria-valuenow': number | undefined;
    'aria-live': "polite" | "assertive" | undefined;
    'aria-modal': true | undefined;
    'aria-hidden': true | undefined;
    'data-testid': string | undefined;
    type: string;
    onClick: (() => void) | undefined;
    disabled: boolean | undefined;
}, HTMLElement>;
export declare const TextInput: (p: TextInputProps) => import("react").ReactElement<{
    role: string | undefined;
    'aria-label': string | undefined;
    'aria-disabled': true | undefined;
    'aria-selected': boolean | undefined;
    'aria-checked': boolean | "mixed" | undefined;
    'aria-busy': true | undefined;
    'aria-valuenow': number | undefined;
    'aria-live': "polite" | "assertive" | undefined;
    'aria-modal': true | undefined;
    'aria-hidden': true | undefined;
    'data-testid': string | undefined;
    value: string | undefined;
    defaultValue: string | undefined;
    placeholder: string | undefined;
    readOnly: boolean;
    onChange: (e: {
        target: {
            value: string;
        };
    }) => void | undefined;
}, string | import("react").JSXElementConstructor<any>>;
export declare const Switch: (p: SwitchProps) => import("react").DetailedReactHTMLElement<import("react").InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>;
export declare const Modal: (p: ModalProps) => import("react").ReactElement<{
    'data-modal': boolean;
}, string | import("react").JSXElementConstructor<any>> | null;
export declare const Image: (p: ImageProps) => import("react").ReactElement<{
    src: string;
    alt: string;
}, string | import("react").JSXElementConstructor<any>>;
export declare const ActivityIndicator: (p: ActivityIndicatorProps) => import("react").DetailedReactHTMLElement<{
    role: "progressbar";
    'aria-label': string | undefined;
}, HTMLElement>;
export declare const StyleSheet: {
    create: <T extends Record<string, Style>>(styles: T) => T;
    hairlineWidth: number;
};
export {};
