import type { HTMLAttributes, ReactNode } from 'react';
import type { TextStyleName } from '@debdaru07/web';
import { cx, type Tone } from './shared.tsx';

const kebab = (s: string) => s.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();

export interface TextProps extends HTMLAttributes<HTMLElement> {
  /** One of the theme's 10 text styles. */
  variant?: TextStyleName;
  as?: 'p' | 'span' | 'h1' | 'h2' | 'h3' | 'h4' | 'div' | 'label';
  muted?: boolean;
}

/** Text in one of the theme's text styles. */
export function Text({ variant = 'bodyMedium', as: Tag = 'p', muted, className, ...rest }: TextProps) {
  return <Tag className={cx(`dts-text-${kebab(variant)}`, muted && 'dts-text-muted', className)} {...rest} />;
}

export interface StatusChipProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone | 'neutral';
  children: ReactNode;
}

/** Read-only status label. The word carries the meaning; color only reinforces it. */
export function StatusChip({ tone = 'neutral', className, ...rest }: StatusChipProps) {
  return <span className={cx('dts-status', tone !== 'neutral' && `dts-status--${tone}`, className)} {...rest} />;
}

export interface BadgeProps {
  /** Number to show; capped at `max` (99+). Omit with `dot`. */
  count?: number;
  max?: number;
  dot?: boolean;
  /** Spoken text, e.g. "3 unread messages". */
  label: string;
  /** Element the badge sits on (an icon button, avatar…). */
  children?: ReactNode;
}

/** Count or dot badge, standalone or anchored to `children`. */
export function Badge({ count, max = 99, dot, label, children }: BadgeProps) {
  const badge = (
    <span className={cx('dts-badge', dot && 'dts-badge--dot')} role="status" aria-label={label}>
      {!dot && count !== undefined && (count > max ? `${max}+` : count)}
    </span>
  );
  if (!children) return badge;
  return (
    <span className="dts-badge-anchor">
      {children}
      {badge}
    </span>
  );
}

export interface CardProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  variant?: 'elevated' | 'outlined' | 'filled';
  /** Media on top (an <img>, chart…), edge to edge. */
  media?: ReactNode;
  title?: ReactNode;
  subtitle?: ReactNode;
  /** Buttons along the bottom edge. */
  actions?: ReactNode;
  /** Makes the whole card a link. Use for navigation; don't combine with `actions`. */
  href?: string;
  /** No padding (lists inside a card). */
  flush?: boolean;
  as?: 'div' | 'article' | 'section';
}

/** Surface for related content: elevated (theme shadow), outlined or filled. */
export function Card({ variant = 'elevated', media, title, subtitle, actions, href, flush, as: Tag = 'div', className, children, ...rest }: CardProps) {
  const classes = cx('dts-card', variant !== 'elevated' && `dts-card--${variant}`, flush && 'dts-card--flush', href && 'dts-card--interactive', className);
  const body = (
    <>
      {media && <div className="dts-card__media">{media}</div>}
      {title && <h3 className="dts-card__title">{title}</h3>}
      {subtitle && <p className="dts-card__subtitle">{subtitle}</p>}
      {children}
      {actions && <div className="dts-card__actions">{actions}</div>}
    </>
  );
  if (href) {
    return (
      <a href={href} className={classes} style={{ textDecoration: 'none' }} {...(rest as HTMLAttributes<HTMLAnchorElement>)}>
        {body}
      </a>
    );
  }
  return (
    <Tag className={classes} {...rest}>
      {body}
    </Tag>
  );
}

export interface StatCardProps extends Omit<CardProps, 'title'> {
  label: ReactNode;
  value: ReactNode;
  /** Change since last period, e.g. "+12%". */
  delta?: ReactNode;
  deltaTone?: Tone | 'neutral';
}

/** A single metric with its label and change. */
export function StatCard({ label, value, delta, deltaTone = 'neutral', className, ...rest }: StatCardProps) {
  return (
    <Card className={cx('dts-stat', className)} {...rest}>
      <p className="dts-stat__label">{label}</p>
      <p className="dts-stat__value">{value}</p>
      {delta && (
        <StatusChip tone={deltaTone} className="dts-stat__delta">
          {delta}
        </StatusChip>
      )}
    </Card>
  );
}

/** List container; put `ListItem`s inside. */
export function List({ className, children, ...rest }: HTMLAttributes<HTMLUListElement>) {
  return (
    <ul className={cx('dts-list', className)} {...rest}>
      {children}
    </ul>
  );
}

export interface ListItemProps {
  headline: ReactNode;
  supporting?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
}

/** One- or two-line row; becomes a link or button when `href` / `onClick` is set. */
export function ListItem({ headline, supporting, leading, trailing, href, onClick, className }: ListItemProps) {
  const inner = (
    <>
      {leading && <span className="dts-list-item__leading">{leading}</span>}
      <span className="dts-list-item__content">
        <span className="dts-list-item__headline">{headline}</span>
        {supporting && <span className="dts-list-item__supporting">{supporting}</span>}
      </span>
      {trailing && <span className="dts-list-item__trailing">{trailing}</span>}
    </>
  );
  const classes = cx('dts-list-item', (href || onClick) && 'dts-list-item--interactive', className);
  return (
    <li>
      {href ? (
        <a href={href} className={classes}>
          {inner}
        </a>
      ) : onClick ? (
        <button type="button" className={classes} onClick={onClick}>
          {inner}
        </button>
      ) : (
        <div className={classes}>{inner}</div>
      )}
    </li>
  );
}

export interface AvatarProps {
  /** Used for initials and as the accessible name. */
  name: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('');

/** Photo or initials in the theme's primary container color. */
export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  const classes = cx('dts-avatar', size !== 'md' && `dts-avatar--${size}`, className);
  return src ? (
    <span className={classes}>
      <img src={src} alt={name} />
    </span>
  ) : (
    <span className={classes} role="img" aria-label={name}>
      <span aria-hidden="true">{initials(name)}</span>
    </span>
  );
}

export interface EmptyStateProps {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** Usually one primary action that resolves the empty state. */
  actions?: ReactNode;
  className?: string;
}

/** Explains why a view is empty and what to do next. */
export function EmptyState({ icon, title, description, actions, className }: EmptyStateProps) {
  return (
    <div className={cx('dts-empty', className)}>
      {icon && <div className="dts-empty__icon">{icon}</div>}
      <h3 className="dts-empty__title">{title}</h3>
      {description && <p className="dts-empty__body">{description}</p>}
      {actions && <div className="dts-empty__actions">{actions}</div>}
    </div>
  );
}
