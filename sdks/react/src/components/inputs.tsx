import { useId, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { cx, Icons, useComponentTokens } from './shared.tsx';

interface FieldOwnProps {
  /** Visible label (always shown; placeholders are hints, not labels). */
  label: ReactNode;
  /** Helper text under the field. */
  hint?: ReactNode;
  /** Error message; marks the field invalid and is announced with it. */
  error?: ReactNode;
  prefix?: ReactNode;
  suffix?: ReactNode;
  /** Defaults to the theme's `components.input.variant`. */
  variant?: 'outlined' | 'filled';
}
export type TextFieldProps = FieldOwnProps &
  (({ multiline?: false } & Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'>) | ({ multiline: true } & TextareaHTMLAttributes<HTMLTextAreaElement>));

/** Labelled text input (or textarea with `multiline`) with hint, error and affixes. */
export function TextField({ label, hint, error, prefix, suffix, variant, className, id, multiline, ...rest }: TextFieldProps) {
  const tokens = useComponentTokens();
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const describedBy = cx(error ? errorId : false, hint ? hintId : false) || undefined;
  const common = { id: inputId, className: 'dts-field__input', 'aria-invalid': error ? true : undefined, 'aria-describedby': describedBy };
  return (
    <div className={cx('dts-field', `dts-field--${variant ?? tokens.inputVariant}`, className)}>
      <label className="dts-field__label" htmlFor={inputId}>
        {label}
      </label>
      <div className="dts-field__control">
        {prefix && <span className="dts-field__affix">{prefix}</span>}
        {multiline ? (
          <textarea {...common} {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)} />
        ) : (
          <input {...common} {...(rest as InputHTMLAttributes<HTMLInputElement>)} />
        )}
        {suffix && <span className="dts-field__affix">{suffix}</span>}
      </div>
      {error && (
        <p className="dts-field__error" id={errorId}>
          {error}
        </p>
      )}
      {hint && (
        <p className="dts-field__hint" id={hintId}>
          {hint}
        </p>
      )}
    </div>
  );
}

export interface ToggleProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode;
}

/** Native checkbox in the theme's primary color, with a 44px row. */
export function Checkbox({ label, className, ...rest }: ToggleProps) {
  return (
    <label className={cx('dts-checkbox', className)}>
      <input type="checkbox" {...rest} />
      <span>{label}</span>
    </label>
  );
}

/** On/off switch (`role="switch"`), announced as on/off by screen readers. */
export function Switch({ label, className, ...rest }: ToggleProps) {
  return (
    <label className={cx('dts-switch', className)}>
      <input type="checkbox" role="switch" {...rest} />
      <span>{label}</span>
    </label>
  );
}

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Filter/choice chips: `true`/`false` makes it a toggle (`aria-pressed`). */
  selected?: boolean;
  icon?: ReactNode;
  /** Input chips: shows a remove button. */
  onRemove?: () => void;
  removeLabel?: string;
  children: ReactNode;
}

/** Filter, choice or input chip. */
export function Chip({ selected, icon, onRemove, removeLabel, children, className, type = 'button', ...rest }: ChipProps) {
  if (onRemove) {
    return (
      <span className={cx('dts-chip', className)}>
        {icon}
        {children}
        <button type="button" className="dts-chip__remove" aria-label={removeLabel ?? `Remove ${typeof children === 'string' ? children : ''}`.trim()} onClick={onRemove}>
          {Icons.close({ width: 16, height: 16 })}
        </button>
      </span>
    );
  }
  return (
    <button type={type} className={cx('dts-chip', className)} aria-pressed={selected} {...rest}>
      {icon}
      {children}
    </button>
  );
}
