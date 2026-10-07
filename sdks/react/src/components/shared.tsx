import { useContext, type ReactNode, type SVGProps } from 'react';
import { ThemeContext } from '../ThemeProvider.tsx';

/** Joins class names, skipping falsy ones. */
export const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(' ');

/** Theme component defaults when inside <ThemeProvider>; components still render (with fallbacks) outside it. */
export function useComponentTokens() {
  const ctx = useContext(ThemeContext);
  return {
    buttonVariant: ctx?.theme.components.button.variant ?? 'filled',
    inputVariant: ctx?.theme.components.input.variant ?? 'outlined',
  };
}

export type Tone = 'success' | 'warning' | 'error' | 'info';

const svg = (props: SVGProps<SVGSVGElement>, children: ReactNode) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    {children}
  </svg>
);

/** The few icons components need themselves; apps pass their own icons as `icon` props. */
export const Icons = {
  close: (p: SVGProps<SVGSVGElement> = {}) => svg(p, <path d="M6 6l12 12M18 6 6 18" />),
  info: (p: SVGProps<SVGSVGElement> = {}) => svg(p, <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>),
  success: (p: SVGProps<SVGSVGElement> = {}) => svg(p, <><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></>),
  warning: (p: SVGProps<SVGSVGElement> = {}) => svg(p, <><path d="M12 3 2 20h20L12 3Z" /><path d="M12 10v4M12 17h.01" /></>),
  error: (p: SVGProps<SVGSVGElement> = {}) => svg(p, <><circle cx="12" cy="12" r="9" /><path d="M15 9l-6 6M9 9l6 6" /></>),
};
