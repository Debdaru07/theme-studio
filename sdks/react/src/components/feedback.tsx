import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { cx, Icons, type Tone } from './shared.tsx';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  /** Spoken text; pass "" when a parent already says what is loading. */
  label?: string;
  className?: string;
}

/** Circular indeterminate progress. */
export function Spinner({ size = 'md', label = 'Loading', className }: SpinnerProps) {
  return (
    <span
      className={cx('dts-spinner', size !== 'md' && `dts-spinner--${size}`, className)}
      role={label ? 'progressbar' : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
    />
  );
}

export interface ProgressProps {
  /** 0–100. Omit for an indeterminate bar. */
  value?: number;
  /** What is progressing, e.g. "Uploading invoice". */
  label: string;
  className?: string;
}

/** Linear progress bar, determinate or indeterminate. */
export function Progress({ value, label, className }: ProgressProps) {
  const v = value === undefined ? undefined : Math.max(0, Math.min(100, value));
  return (
    <div className={cx('dts-progress', className)} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={v}>
      <div className="dts-progress__bar" style={v === undefined ? undefined : { width: `${v}%` }} />
    </div>
  );
}

export interface SkeletonProps {
  variant?: 'text' | 'circle' | 'rect';
  /** Text lines to draw (variant "text"). The last one is shorter. */
  lines?: number;
  width?: CSSProperties['width'];
  height?: CSSProperties['height'];
  className?: string;
}

/** Placeholder shape while content loads. Hidden from screen readers; announce loading elsewhere. */
export function Skeleton({ variant = 'text', lines = 1, width, height, className }: SkeletonProps) {
  if (variant === 'text' && lines > 1) {
    return (
      <span style={{ display: 'grid', gap: 8, width }} aria-hidden="true">
        {Array.from({ length: lines }, (_, i) => (
          <span key={i} className={cx('dts-skeleton', 'dts-skeleton--text', className)} style={i === lines - 1 ? { width: '60%' } : undefined} />
        ))}
      </span>
    );
  }
  return <span className={cx('dts-skeleton', `dts-skeleton--${variant}`, className)} style={{ width, height }} aria-hidden="true" />;
}

const TONE_ICON = { info: Icons.info, success: Icons.success, warning: Icons.warning, error: Icons.error };

export interface AlertProps {
  tone?: Tone;
  title?: ReactNode;
  children?: ReactNode;
  /** Buttons under the message. */
  actions?: ReactNode;
  /** Shows a close button. */
  onClose?: () => void;
  closeLabel?: string;
  /** Replace the tone icon, or `false` to hide it. */
  icon?: ReactNode | false;
  className?: string;
}

/** Inline message. Errors and warnings are announced immediately (`role="alert"`), others politely. */
export function Alert({ tone = 'info', title, children, actions, onClose, closeLabel = 'Dismiss', icon, className }: AlertProps) {
  const urgent = tone === 'error' || tone === 'warning';
  return (
    <div className={cx('dts-alert', `dts-alert--${tone}`, className)} role={urgent ? 'alert' : 'status'}>
      {icon !== false && <span className="dts-alert__icon">{icon ?? TONE_ICON[tone]()}</span>}
      <div className="dts-alert__content">
        {title && <p className="dts-alert__title">{title}</p>}
        {children && <div className="dts-alert__body">{children}</div>}
        {actions && <div className="dts-alert__actions">{actions}</div>}
      </div>
      {onClose && (
        <button type="button" className="dts-alert__close" aria-label={closeLabel} onClick={onClose}>
          {Icons.close()}
        </button>
      )}
    </div>
  );
}

export interface ToastProps {
  open: boolean;
  message: ReactNode;
  /** One short action, e.g. "Undo". */
  actionLabel?: string;
  onAction?: () => void;
  onClose: () => void;
  /** Auto-dismiss after this many ms; 0 keeps it until closed. Default 4000 (longer when there is an action). */
  duration?: number;
}

/** Brief confirmation at the bottom of the screen ("Draft saved"). Announced politely; never steals focus. */
export function Toast({ open, message, actionLabel, onAction, onClose, duration }: ToastProps) {
  const close = useRef(onClose);
  close.current = onClose;
  const ms = duration ?? (actionLabel ? 6000 : 4000);
  useEffect(() => {
    if (!open || ms === 0) return;
    const t = setTimeout(() => close.current(), ms);
    return () => clearTimeout(t);
  }, [open, ms]);
  if (!open) return null;
  return (
    <div className="dts-toast" role="status" aria-live="polite">
      <span className="dts-toast__message">{message}</span>
      {actionLabel && (
        <button
          type="button"
          className="dts-toast__action"
          onClick={() => {
            onAction?.();
            onClose();
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
