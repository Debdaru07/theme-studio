import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { cx } from './shared.tsx';

export interface TabItem {
  id: string;
  label: ReactNode;
  content: ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  /** Controlled selection; omit and use `defaultValue` for uncontrolled tabs. */
  value?: string;
  defaultValue?: string;
  onChange?: (id: string) => void;
  /** Names the tab list for screen readers, e.g. "Order details". */
  label: string;
  className?: string;
}

/** Tabs with ARIA tab semantics: arrow keys move between tabs, Home/End jump, only the active tab is in the Tab order. */
export function Tabs({ items, value, defaultValue, onChange, label, className }: TabsProps) {
  const [inner, setInner] = useState(defaultValue ?? items.find((t) => !t.disabled)?.id);
  const active = value ?? inner;
  const base = useId();
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const select = (id: string) => {
    if (value === undefined) setInner(id);
    onChange?.(id);
  };
  const enabled = items.filter((t) => !t.disabled);
  const onKeyDown = (e: KeyboardEvent) => {
    const i = enabled.findIndex((t) => t.id === active);
    const next =
      e.key === 'ArrowRight' ? enabled[(i + 1) % enabled.length]
      : e.key === 'ArrowLeft' ? enabled[(i - 1 + enabled.length) % enabled.length]
      : e.key === 'Home' ? enabled[0]
      : e.key === 'End' ? enabled[enabled.length - 1]
      : undefined;
    if (!next) return;
    e.preventDefault();
    select(next.id);
    refs.current[next.id]?.focus();
  };
  const current = items.find((t) => t.id === active);
  return (
    <div className={className}>
      <div className="dts-tabs" role="tablist" aria-label={label} onKeyDown={onKeyDown}>
        {items.map((t) => (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[t.id] = el;
            }}
            type="button"
            role="tab"
            id={`${base}-tab-${t.id}`}
            aria-controls={`${base}-panel-${t.id}`}
            aria-selected={t.id === active}
            tabIndex={t.id === active ? 0 : -1}
            disabled={t.disabled}
            className={cx('dts-tab')}
            onClick={() => select(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {current && (
        <div className="dts-tab-panel" role="tabpanel" id={`${base}-panel-${current.id}`} aria-labelledby={`${base}-tab-${current.id}`} tabIndex={0}>
          {current.content}
        </div>
      )}
    </div>
  );
}
