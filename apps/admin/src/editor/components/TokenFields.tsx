import { COLOR_ROLES, TEXT_STYLES, type ColorRole } from '@debdaru07/schema';
import { useId, type ReactNode } from 'react';
import { humanize, useEditor, useField } from '../fields.tsx';

/** Scales a value can link to. Picking a step stores a {reference}, so the value keeps following the theme. */
export const SCALES = {
  spacing: { base: 'spacing.scale', steps: ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'] },
  radius: { base: 'shape.radius', steps: ['none', 'xs', 'sm', 'md', 'lg', 'xl', 'full'] },
  height: { base: 'sizing.controlHeight', steps: ['sm', 'md', 'lg'] },
  border: { base: 'shape.borderWidth', steps: ['thin', 'thick'] },
} as const;
export type ScaleName = keyof typeof SCALES;

const REF = /^\{([A-Za-z0-9_.]+)\}$/;
const refPath = (v: unknown) => (typeof v === 'string' ? REF.exec(v)?.[1] : undefined);

/** "Theme · md" for a linked value, "Custom" for a typed number. */
function Origin({ source, scaleBase }: { source: unknown; scaleBase?: string }) {
  const ref = refPath(source);
  if (!ref) return <span className="tk-origin custom">Custom</span>;
  const step = scaleBase && ref.startsWith(`${scaleBase}.`) ? ref.slice(scaleBase.length + 1) : null;
  return (
    <span className="tk-origin linked" title={`Linked to the theme token ${ref}. It follows theme changes.`}>
      <span aria-hidden>🔗</span> Theme · {step ?? humanize(ref.split('.').slice(-1)[0] ?? ref).toLowerCase()}
    </span>
  );
}

/** Label row shared by token fields: name, linked/custom badge, reset, lock. */
function TokenShell(props: { label: string; f: ReturnType<typeof useField>; scaleBase?: string; issue?: { message: string; level: string }; children: ReactNode }) {
  const { label, f, scaleBase, issue, children } = props;
  return (
    <div className={`tk ${f.locked ? 'locked' : ''} ${issue ? `has-${issue.level}` : ''}`} title={f.lockedReason}>
      <div className="tk-head">
        <span className="tk-label">{label}</span>
        <Origin source={f.source} scaleBase={scaleBase} />
        {f.locked && <span className="lock" aria-label={f.lockedReason}>🔒</span>}
        {f.overridden && !f.locked && (
          <button type="button" className="reset" onClick={f.reset} title="Back to the theme default">
            Reset
          </button>
        )}
      </div>
      {children}
      {issue && <div className={`tk-issue ${issue.level}`}>{issue.message}</div>}
    </div>
  );
}

/** Guardrail message (from checkComponents) for exactly this path, if any. */
function useGuardrail(path: string) {
  const { resolved } = useEditor();
  return resolved.components?.issues.find((i) => i.path === path);
}

/**
 * A pixel value that can link to a theme scale step (chips) or be custom (number input).
 * The chips show each step's current pixel value, so developers see what "md" means right now.
 */
export function ScaleField({ path, label, scale, unit = 'px' }: { path: string; label: string; scale: ScaleName; unit?: string }) {
  const f = useField<number>(path);
  const { resolved } = useEditor();
  const issue = useGuardrail(path);
  const { base, steps } = SCALES[scale];
  const linked = refPath(f.source);
  const id = useId();
  const stepValue = (step: string) => {
    let node: unknown = resolved.theme;
    for (const k of `${base}.${step}`.split('.')) node = (node as Record<string, unknown> | undefined)?.[k];
    return node as number | undefined;
  };
  return (
    <TokenShell label={label} f={f} scaleBase={base} issue={issue}>
      <div className="tk-row">
        <div className="tk-steps" role="radiogroup" aria-label={`${label}: theme scale`}>
          {steps.map((step) => {
            const v = stepValue(step);
            const on = linked === `${base}.${step}`;
            return (
              <button
                key={step}
                type="button"
                role="radio"
                aria-checked={on}
                className={on ? 'on' : ''}
                disabled={f.locked}
                title={`${step} = ${v === 9999 ? 'pill' : `${v}${unit}`} (linked to the theme)`}
                onClick={() => f.set(`{${base}.${step}}`)}
              >
                {step}
              </button>
            );
          })}
        </div>
        <label className="tk-number" htmlFor={id}>
          <input
            id={id}
            type="number"
            min={0}
            step={scale === 'border' ? 1 : 4}
            value={f.value ?? ''}
            disabled={f.locked}
            aria-label={`${label} in ${unit}`}
            onChange={(e) => e.target.value !== '' && f.set(Number(e.target.value))}
          />
          <span>{f.value === 9999 ? 'pill' : unit}</span>
        </label>
      </div>
    </TokenShell>
  );
}

/** A plain number (elevation level, etc.). */
export function LevelField({ path, label, max = 5 }: { path: string; label: string; max?: number }) {
  const f = useField<number>(path);
  return (
    <TokenShell label={label} f={f}>
      <div className="tk-steps" role="radiogroup" aria-label={label}>
        {Array.from({ length: max + 1 }, (_, i) => (
          <button key={i} type="button" role="radio" aria-checked={f.value === i} className={f.value === i ? 'on' : ''} disabled={f.locked} onClick={() => f.set(i)}>
            {i}
          </button>
        ))}
      </div>
    </TokenShell>
  );
}

const ROLE_GROUPS: { label: string; match: (r: string) => boolean }[] = [
  { label: 'Brand', match: (r) => /primary|secondary|accent/i.test(r) },
  { label: 'Status', match: (r) => /success|warning|error|info/i.test(r) },
  { label: 'Surface & text', match: () => true },
];

/** A theme color role (never a hex value), with a live swatch in light and dark. */
export function RoleField({ path, label, allowTransparent = false }: { path: string; label: string; allowTransparent?: boolean }) {
  const f = useField<string>(path);
  const { resolved } = useEditor();
  const issue = useGuardrail(path);
  const role = f.value as ColorRole | 'transparent' | undefined;
  const swatch = (mode: 'light' | 'dark') =>
    !role || role === 'transparent' ? 'transparent' : (resolved.theme?.color[mode][role] ?? 'transparent');
  const used = new Set<string>();
  const groups = ROLE_GROUPS.map((g) => {
    const roles = COLOR_ROLES.filter((r) => !used.has(r) && g.match(r));
    roles.forEach((r) => used.add(r));
    return { ...g, roles };
  });
  return (
    <div className={`tk ${f.locked ? 'locked' : ''} ${issue ? `has-${issue.level}` : ''}`} title={f.lockedReason}>
      <div className="tk-head">
        <span className="tk-label">{label}</span>
        <span className={`tk-origin ${f.overridden ? 'custom' : 'linked'}`}>{f.overridden ? 'Custom' : 'Theme default'}</span>
        {f.locked && <span className="lock">🔒</span>}
        {f.overridden && !f.locked && (
          <button type="button" className="reset" onClick={f.reset}>
            Reset
          </button>
        )}
      </div>
      <div className="tk-role">
        <span className="tk-swatch" aria-hidden title="Light / dark">
          <span style={{ background: swatch('light') }} />
          <span style={{ background: swatch('dark') }} />
        </span>
        <select value={role ?? ''} disabled={f.locked} onChange={(e) => f.set(e.target.value)} aria-label={label}>
          {allowTransparent && <option value="transparent">Transparent</option>}
          {groups.map((g) => (
            <optgroup key={g.label} label={g.label}>
              {g.roles.map((r) => (
                <option key={r} value={r}>
                  {humanize(r)}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
      {issue && <div className={`tk-issue ${issue.level}`}>{issue.message}</div>}
    </div>
  );
}

/** One of the theme's text styles. */
export function TextStyleField({ path, label }: { path: string; label: string }) {
  const f = useField<string>(path);
  const { resolved } = useEditor();
  const s = f.value ? resolved.theme?.typography.styles[f.value as (typeof TEXT_STYLES)[number]] : undefined;
  return (
    <div className={`tk ${f.locked ? 'locked' : ''}`} title={f.lockedReason}>
      <div className="tk-head">
        <span className="tk-label">{label}</span>
        <span className={`tk-origin ${f.overridden ? 'custom' : 'linked'}`}>{f.overridden ? 'Custom' : 'Theme default'}</span>
        {f.overridden && !f.locked && (
          <button type="button" className="reset" onClick={f.reset}>
            Reset
          </button>
        )}
      </div>
      <select value={f.value ?? ''} disabled={f.locked} onChange={(e) => f.set(e.target.value)} aria-label={label}>
        {TEXT_STYLES.map((t) => (
          <option key={t} value={t}>
            {humanize(t)}
          </option>
        ))}
      </select>
      {s && <div className="tk-hint">{s.family} · {s.size}px · {s.weight}</div>}
    </div>
  );
}

/** A small set of named choices (button default style, text transform…). */
export function ChoiceField({ path, label, options }: { path: string; label: string; options: readonly string[] }) {
  const f = useField<string>(path);
  return (
    <div className={`tk ${f.locked ? 'locked' : ''}`} title={f.lockedReason}>
      <div className="tk-head">
        <span className="tk-label">{label}</span>
        {f.locked && <span className="lock">🔒</span>}
        {f.overridden && !f.locked && (
          <button type="button" className="reset" onClick={f.reset}>
            Reset
          </button>
        )}
      </div>
      <div className="tk-steps wide" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button key={o} type="button" role="radio" aria-checked={f.value === o} className={f.value === o ? 'on' : ''} disabled={f.locked} onClick={() => f.set(o)}>
            {humanize(o)}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ToggleTokenField({ path, label }: { path: string; label: string }) {
  const f = useField<boolean>(path);
  return (
    <div className={`tk ${f.locked ? 'locked' : ''}`} title={f.lockedReason}>
      <label className="tk-toggle">
        <input type="checkbox" checked={!!f.value} disabled={f.locked} onChange={(e) => f.set(e.target.checked)} />
        <span className="tk-label">{label}</span>
        {f.overridden && !f.locked && (
          <button type="button" className="reset" onClick={(e) => (e.preventDefault(), f.reset())}>
            Reset
          </button>
        )}
      </label>
    </div>
  );
}
