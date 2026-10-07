import { canEdit, editableBy, getPath, setPath, type ThemeInput } from '@debdaru07/schema';
import { createContext, useContext, useId, type ReactNode } from 'react';
import type React from 'react';
import type { ThemeEditor } from './useThemeEditor.ts';

export const EditorContext = createContext<ThemeEditor | null>(null);

export function useEditor(): ThemeEditor {
  const e = useContext(EditorContext);
  if (!e) throw new Error('useEditor outside EditorContext');
  return e;
}

const LOCK_LABEL = { platform: 'the platform', tenant: 'your agency', client: 'you' } as const;

/** Binds a control to a token path in the draft layer. */
export function useField<T = unknown>(path: string) {
  const ed = useEditor();
  const raw = ed.layer ? getPath(ed.layer, path) : undefined;
  const effective =
    path.startsWith('color.seed.') ? getPath(ed.merged, path) : getPath(ed.resolved.theme ?? {}, path);
  const locked = !canEdit(ed.policy, path);
  const issue = ed.resolved.issues.find((i) => i.path === path || i.path.startsWith(`${path}.`));
  return {
    path,
    value: effective as T,
    /** Unresolved merged value — shows `{references}`. */
    source: getPath(ed.merged, path),
    overridden: raw !== undefined,
    locked,
    lockedReason: locked ? `Managed by ${LOCK_LABEL[editableBy(path)]}` : undefined,
    issue: issue?.message,
    set: (v: unknown) => ed.setLayer((l) => setPath<ThemeInput>(l ?? {}, path, v)),
    reset: () => ed.setLayer((l) => setPath<ThemeInput>(l ?? {}, path, undefined)),
  };
}

type Field = ReturnType<typeof useField>;

/** Ids that tie a field's control to its visible label, hint and error (screen readers announce all three). */
const FieldA11y = createContext<{ labelId: string; descId?: string; invalid: boolean } | null>(null);

/** Spread onto a field's control: `<input {...useFieldA11y()} />`. */
export function useFieldA11y() {
  const a = useContext(FieldA11y);
  return a ? { 'aria-labelledby': a.labelId, 'aria-describedby': a.descId, 'aria-invalid': a.invalid || undefined } : {};
}

function FieldShell({ f, label, hint, children }: { f: Field; label: string; hint?: string; children: ReactNode }) {
  const labelId = useId();
  const descId = useId();
  const described = !!(f.issue || hint || f.lockedReason);
  return (
    <div className={`tf ${f.locked ? 'locked' : ''} ${f.issue ? 'invalid' : ''}`} title={f.lockedReason}>
      <div className="tf-label">
        <span id={labelId}>{label}</span>
        {f.locked && <LockIcon label={f.lockedReason} />}
        {f.overridden && !f.locked && (
          <button type="button" className="reset" onClick={f.reset} title="Reset to inherited value" aria-label={`Reset ${label}`}>
            Reset
          </button>
        )}
      </div>
      <FieldA11y.Provider value={{ labelId, descId: described ? descId : undefined, invalid: !!f.issue }}>{children}</FieldA11y.Provider>
      <div id={descId} className={f.issue ? 'tf-issue' : 'tf-hint'} hidden={!described} role={f.issue ? 'alert' : undefined}>
        {f.issue ?? hint ?? f.lockedReason}
      </div>
    </div>
  );
}

export function ColorField({ path, label, hint, emptyLabel }: { path: string; label: string; hint?: string; emptyLabel?: string }) {
  const f = useField<string | undefined>(path);
  const id = useId();
  const empty = typeof f.value !== 'string';
  return (
    <FieldShell f={f} label={label} hint={hint}>
      <div className={`color-input ${empty ? 'empty' : ''}`}>
        <input
          id={id}
          type="color"
          aria-label={`${label}: pick a color`}
          value={empty ? '#808080' : f.value!.slice(0, 7)}
          disabled={f.locked}
          onChange={(e) => f.set(e.target.value.toUpperCase())}
        />
        <ColorText
          placeholder={emptyLabel}
          defaultValue={f.value ?? ''}
          key={f.value ?? ''}
          disabled={f.locked}
          onBlur={(e) => {
            const v = e.target.value.trim();
            if (v !== (f.value ?? '')) f.set(v === '' ? undefined : v);
          }}
        />
      </div>
    </FieldShell>
  );
}

function ColorText(props: { placeholder?: string; defaultValue: string; disabled: boolean; onBlur(e: React.FocusEvent<HTMLInputElement>): void }) {
  return (
    <input
      type="text"
      spellCheck={false}
      autoComplete="off"
      {...useFieldA11y()}
      {...props}
      onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
    />
  );
}

export function NumberField(props: {
  path: string;
  label: string;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  nullable?: boolean;
  hint?: string;
}) {
  const f = useField<number | null>(props.path);
  const ref = typeof f.source === 'string' && f.source.startsWith('{') ? f.source : null;
  return (
    <FieldShell f={f} label={props.label} hint={ref && !f.overridden ? `Inherits ${ref}` : props.hint}>
      <div className="number-input">
        <A11yInput
          type="number"
          value={f.value ?? ''}
          placeholder={props.nullable ? 'none' : undefined}
          min={props.min}
          max={props.max}
          step={props.step ?? 1}
          disabled={f.locked}
          onChange={(e) => {
            if (e.target.value === '') return props.nullable ? f.set(null) : undefined;
            const n = Number(e.target.value);
            if (!Number.isNaN(n)) f.set(n);
          }}
        />
        {props.unit && <span className="unit">{props.unit}</span>}
      </div>
    </FieldShell>
  );
}

export function SelectField({ path, label, options, hint }: { path: string; label: string; options: readonly string[]; hint?: string }) {
  const f = useField<string>(path);
  return (
    <FieldShell f={f} label={label} hint={hint}>
      <A11ySelect value={String(f.value)} disabled={f.locked} onChange={(e) => f.set(coerce(e.target.value))}>
        {options.map((o) => (
          <option key={o} value={o}>
            {humanize(o)}
          </option>
        ))}
      </A11ySelect>
    </FieldShell>
  );
}

export function SegmentedField({ path, label, options }: { path: string; label: string; options: readonly string[] }) {
  const f = useField<string>(path);
  return (
    <FieldShell f={f} label={label}>
      <A11yGroup className="segmented" role="radiogroup">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            role="radio"
            aria-checked={f.value === o}
            className={f.value === o ? 'on' : ''}
            disabled={f.locked}
            onClick={() => f.set(o)}
          >
            {humanize(o)}
          </button>
        ))}
      </A11yGroup>
    </FieldShell>
  );
}

export function ToggleField({ path, label, hint }: { path: string; label: string; hint?: string }) {
  const f = useField<boolean>(path);
  return (
    <FieldShell f={f} label={label} hint={hint}>
      <label className="switch">
        <A11yInput type="checkbox" checked={!!f.value} disabled={f.locked} onChange={(e) => f.set(e.target.checked)} />
        <span>{f.value ? 'On' : 'Off'}</span>
      </label>
    </FieldShell>
  );
}

export function TextField(props: { path: string; label: string; placeholder?: string; list?: string; nullable?: boolean; hint?: string }) {
  const f = useField<string | null>(props.path);
  return (
    <FieldShell f={f} label={props.label} hint={props.hint}>
      <A11yInput
        type="text"
        key={String(f.value)}
        defaultValue={f.value ?? ''}
        placeholder={props.placeholder}
        list={props.list}
        disabled={f.locked}
        onBlur={(e) => {
          const v = e.target.value.trim();
          if (v === (f.value ?? '')) return;
          f.set(v === '' && props.nullable ? null : v);
        }}
        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
      />
    </FieldShell>
  );
}

/** Sets a `{reference}` to one of the font family slots. */
export function FontRefField({ path, label }: { path: string; label: string }) {
  const f = useField<string>(path);
  const slots = ['primary', 'secondary', 'mono'] as const;
  const current = slots.find((s) => f.source === `{typography.fontFamily.${s}}`) ?? 'custom';
  return (
    <FieldShell f={f} label={label} hint={current === 'custom' ? `Custom: ${f.value}` : f.value}>
      <A11ySelect value={current} disabled={f.locked} onChange={(e) => f.set(`{typography.fontFamily.${e.target.value}}`)}>
        {slots.map((s) => (
          <option key={s} value={s}>
            {humanize(s)} font
          </option>
        ))}
        {current === 'custom' && <option value="custom">Custom</option>}
      </A11ySelect>
    </FieldShell>
  );
}

export function BezierField({ path, label }: { path: string; label: string }) {
  const f = useField<[number, number, number, number]>(path);
  const v = f.value ?? [0, 0, 1, 1];
  return (
    <FieldShell f={f} label={label} hint={`cubic-bezier(${v.join(', ')})`}>
      <A11yGroup className="bezier" role="group">
        {v.map((n, i) => (
          <input
            key={i}
            aria-label={`${label} control point ${['x1', 'y1', 'x2', 'y2'][i]}`}
            type="number"
            step={0.05}
            value={n}
            disabled={f.locked}
            onChange={(e) => {
              const next = [...v] as typeof v;
              next[i] = Number(e.target.value);
              f.set(next);
            }}
          />
        ))}
      </A11yGroup>
    </FieldShell>
  );
}

const A11yInput = (p: React.InputHTMLAttributes<HTMLInputElement>) => <input {...useFieldA11y()} {...p} />;
const A11ySelect = (p: React.SelectHTMLAttributes<HTMLSelectElement>) => <select {...useFieldA11y()} {...p} />;
const A11yGroup = (p: React.HTMLAttributes<HTMLDivElement>) => <div {...useFieldA11y()} {...p} />;

/** Locked-field marker: a line icon (no emoji), named for screen readers by who manages the token. */
export function LockIcon({ label }: { label?: string }) {
  return (
    <svg className="lock" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" role="img" aria-label={label ?? 'Locked'}>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

export function humanize(s: string): string {
  return s
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, (c) => c.toUpperCase());
}

const coerce = (v: string): unknown => (/^\d+$/.test(v) ? Number(v) : v === 'true' ? true : v === 'false' ? false : v);
