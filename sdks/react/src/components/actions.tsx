import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { cx, useComponentTokens } from './shared.tsx';
import { Spinner } from './feedback.tsx';

export type ButtonVariant = 'filled' | 'tonal' | 'outlined' | 'text' | 'danger';

interface ButtonOwnProps {
  /** Defaults to the theme's `components.button.variant`. */
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  /** Leading (or trailing, see `iconPosition`) icon. */
  icon?: ReactNode;
  iconPosition?: 'start' | 'end';
  /** Shows a spinner, keeps the width, and blocks clicks (`aria-busy`). */
  loading?: boolean;
  /** Full width. */
  block?: boolean;
  children?: ReactNode;
}
export type ButtonProps = ButtonOwnProps &
  (({ href?: undefined } & ButtonHTMLAttributes<HTMLButtonElement>) | ({ href: string } & AnchorHTMLAttributes<HTMLAnchorElement>));

/** Themed button. Renders a link when `href` is set. */
export function Button({ variant, size = 'md', icon, iconPosition = 'start', loading, block, children, className, ...rest }: ButtonProps) {
  const tokens = useComponentTokens();
  const classes = cx(
    'dts-button',
    `dts-button--${variant ?? tokens.buttonVariant}`,
    size !== 'md' && `dts-button--${size}`,
    block && 'dts-button--block',
    className,
  );
  const content = (
    <>
      {icon && iconPosition === 'start' && <span className="dts-button__icon">{icon}</span>}
      {children}
      {icon && iconPosition === 'end' && <span className="dts-button__icon">{icon}</span>}
      {loading && <Spinner size="sm" label="" />}
    </>
  );
  if ('href' in rest && rest.href !== undefined) {
    return (
      <a className={classes} aria-busy={loading || undefined} {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {content}
      </a>
    );
  }
  const { disabled, type = 'button', ...buttonRest } = rest as ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button type={type} className={classes} disabled={disabled || loading} aria-busy={loading || undefined} {...buttonRest}>
      {content}
    </button>
  );
}

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Accessible name; required because the button shows only an icon. */
  label: string;
  variant?: 'standard' | 'filled' | 'tonal' | 'outlined';
  children: ReactNode;
}

/** Icon-only button with a 44px+ touch target (`sizing.minTouchTarget`). */
export function IconButton({ label, variant = 'standard', children, className, type = 'button', ...rest }: IconButtonProps) {
  return (
    <button type={type} aria-label={label} title={label} className={cx('dts-icon-button', variant !== 'standard' && `dts-icon-button--${variant}`, className)} {...rest}>
      {children}
    </button>
  );
}
