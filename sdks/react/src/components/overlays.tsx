import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Button } from './actions.tsx';

export interface DialogProps {
  open: boolean;
  /** Called on Escape, scrim click (when `dismissible`) and by your own close buttons. */
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  /** Centered icon above the title (alert dialogs). */
  icon?: ReactNode;
  /** Buttons, right-aligned; put the primary action last. */
  actions?: ReactNode;
  /** Form fields or other content between the description and the actions. */
  children?: ReactNode;
  /** Escape and scrim click close it. Default true; set false for required decisions. */
  dismissible?: boolean;
  /** `alertdialog` for confirmations that interrupt the user. */
  role?: 'dialog' | 'alertdialog';
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Modal dialog: focus moves inside on open, Tab stays inside, Escape closes, and focus returns to the trigger.
 * Rendered in place (not the browser top layer), so it stays inside scoped themes and device frames.
 */
export function Dialog({ open, onClose, title, description, icon, actions, children, dismissible = true, role = 'dialog' }: DialogProps) {
  const panel = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const el = panel.current;
    (el?.querySelector<HTMLElement>('[data-autofocus]') ?? el?.querySelector<HTMLElement>(FOCUSABLE) ?? el)?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dismissible) {
        e.stopPropagation();
        close.current();
      } else if (e.key === 'Tab' && el) {
        const items = [...el.querySelectorAll<HTMLElement>(FOCUSABLE)];
        if (!items.length) return e.preventDefault();
        const first = items[0]!;
        const last = items[items.length - 1]!;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      previous?.focus?.();
    };
  }, [open, dismissible]);

  if (!open) return null;
  return (
    <div className="dts-scrim" onMouseDown={(e) => dismissible && e.target === e.currentTarget && close.current()}>
      <div ref={panel} className="dts-dialog" role={role} aria-modal="true" aria-labelledby={titleId} aria-describedby={description ? descId : undefined} tabIndex={-1}>
        {icon && <span className="dts-dialog__icon">{icon}</span>}
        <h2 className="dts-dialog__title" id={titleId}>
          {title}
        </h2>
        {description && (
          <p className="dts-dialog__body" id={descId}>
            {description}
          </p>
        )}
        {children}
        {actions && <div className="dts-dialog__actions">{actions}</div>}
      </div>
    </div>
  );
}

export interface ConfirmDialogProps {
  open: boolean;
  title: ReactNode;
  description?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** Styles the confirm button as destructive (`danger`). */
  destructive?: boolean;
  icon?: ReactNode;
  /** Shows a spinner on the confirm button while the action runs. */
  loading?: boolean;
}

/** Two-button decision. Cancel gets focus first so Enter never confirms a destructive action by accident. */
export function ConfirmDialog({ open, title, description, confirmLabel, cancelLabel = 'Cancel', onConfirm, onCancel, destructive, icon, loading }: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      title={title}
      description={description}
      icon={icon}
      role="alertdialog"
      actions={
        <>
          <Button variant="text" onClick={onCancel} data-autofocus>
            {cancelLabel}
          </Button>
          <Button variant={destructive ? 'danger' : 'filled'} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}
