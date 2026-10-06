import {
  BREAKPOINTS,
  NAV_PATTERNS,
  PAGE_TRANSITIONS,
  TEXT_STYLES,
  canEdit,
  type ColorRole,
  type TextStyleName,
} from '@dts/schema';
import { FontPicker, availableWeights, fontInfo } from './fonts.tsx';
import { useState, type ReactNode } from 'react';
import {
  BezierField,
  ColorField,
  FontRefField,
  NumberField,
  SegmentedField,
  SelectField,
  TextField,
  ToggleField,
  humanize,
  useEditor,
  useField,
} from './fields.tsx';

export interface SectionDef {
  id: string;
  title: string;
  /** Path prefixes this section edits — used to show a "managed by" notice when all are locked. */
  paths: string[];
  render: () => ReactNode;
}

function Group({ title, children, note }: { title?: string; children: ReactNode; note?: string }) {
  return (
    <fieldset className="group">
      {title && <legend>{title}</legend>}
      {note && <p className="muted small">{note}</p>}
      <div className="group-fields">{children}</div>
    </fieldset>
  );
}

// ── Colors ───────────────────────────────────────────────────────────────────

const ROLE_GROUPS: { title: string; roles: ColorRole[] }[] = [
  { title: 'Primary', roles: ['primary', 'onPrimary', 'primaryContainer', 'onPrimaryContainer'] },
  { title: 'Secondary', roles: ['secondary', 'onSecondary', 'secondaryContainer', 'onSecondaryContainer'] },
  { title: 'Accent', roles: ['accent', 'onAccent', 'accentContainer', 'onAccentContainer'] },
  {
    title: 'Surfaces & text',
    roles: ['background', 'surface', 'surfaceContainerLow', 'surfaceContainer', 'surfaceContainerHigh', 'onSurface', 'onSurfaceMuted', 'outline', 'outlineMuted', 'focusRing'],
  },
  { title: 'Success', roles: ['success', 'onSuccess', 'successContainer', 'onSuccessContainer'] },
  { title: 'Warning', roles: ['warning', 'onWarning', 'warningContainer', 'onWarningContainer'] },
  { title: 'Error', roles: ['error', 'onError', 'errorContainer', 'onErrorContainer'] },
  { title: 'Info', roles: ['info', 'onInfo', 'infoContainer', 'onInfoContainer'] },
];

function ColorsSection() {
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  const [advanced, setAdvanced] = useState(false);
  return (
    <>
      <ContrastPanel />
      <Group title="Brand" note="Pick your brand colors. Everything else (text on brand, containers, dark mode) is generated to match.">
        <ColorField path="color.seed.primary" label="Primary" hint="Buttons, links, active states" />
        <ColorField path="color.seed.secondary" label="Secondary" />
        <ColorField path="color.seed.accent" label="Accent" />
        <ColorField path="color.seed.neutral" label="Neutral tint" hint="Tints backgrounds & surfaces" emptyLabel="Auto (from primary)" />
      </Group>
      <Group title="Status">
        <ColorField path="color.seed.success" label="Success" />
        <ColorField path="color.seed.warning" label="Warning" />
        <ColorField path="color.seed.error" label="Error" />
        <ColorField path="color.seed.info" label="Info" />
      </Group>
      <button type="button" className="btn ghost small block" onClick={() => setAdvanced((a) => !a)}>
        {advanced ? 'Hide' : 'Fine-tune'} individual colors
      </button>
      {advanced && (
        <>
          <div className="segmented wide">
            {(['light', 'dark'] as const).map((m) => (
              <button key={m} type="button" className={mode === m ? 'on' : ''} onClick={() => setMode(m)}>
                {humanize(m)} mode
              </button>
            ))}
          </div>
          <p className="muted small">Overrides win over generated colors until the matching brand color is changed.</p>
          {ROLE_GROUPS.map((g) => (
            <Group key={g.title} title={g.title}>
              {g.roles.map((r) => (
                <ColorField key={r} path={`color.${mode}.${r}`} label={humanize(r)} />
              ))}
            </Group>
          ))}
        </>
      )}
    </>
  );
}

export function ContrastPanel() {
  const { resolved } = useEditor();
  const issues = resolved.contrast?.issues ?? [];
  if (!resolved.contrast) return null;
  if (issues.length === 0) return <div className="notice ok">All color pairs meet WCAG AA contrast.</div>;
  const errors = issues.filter((i) => i.level === 'error');
  return (
    <div className={`notice ${errors.length ? 'error' : 'warn'}`}>
      <strong>
        {errors.length ? `${errors.length} required contrast check${errors.length > 1 ? 's' : ''} failing — publishing is blocked` : 'Contrast warnings'}
      </strong>
      <ul>
        {issues.map((i) => (
          <li key={`${i.mode}-${i.fg}-${i.bg}`} className={i.level}>
            {humanize(i.fg)} on {humanize(i.bg)} ({i.mode}): {i.ratio}:1, needs {i.min}:1
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Typography ───────────────────────────────────────────────────────────────

const WEIGHT_NAMES: Record<number, string> = {
  100: 'Thin', 200: 'Extra light', 300: 'Light', 400: 'Regular', 500: 'Medium',
  600: 'Semibold', 700: 'Bold', 800: 'Extra bold', 900: 'Black',
};

/** Weight options limited to what the style's font family actually ships. */
function WeightField({ style }: { style: TextStyleName }) {
  const family = useField<string>(`typography.styles.${style}.family`).value;
  const f = useField<number>(`typography.styles.${style}.weight`);
  const weights = availableWeights(family);
  const missing = f.value !== undefined && !weights.includes(f.value);
  return (
    <div className={`tf ${f.locked ? 'locked' : ''}`} title={f.lockedReason}>
      <div className="tf-label">
        <span>Weight</span>
        {f.locked && <span className="lock">🔒</span>}
        {f.overridden && !f.locked && (
          <button type="button" className="reset" onClick={f.reset}>
            reset
          </button>
        )}
      </div>
      <select value={f.value} disabled={f.locked} onChange={(e) => f.set(Number(e.target.value))}>
        {[...weights, ...(missing ? [f.value] : [])].map((w) => (
          <option key={w} value={w}>
            {w} · {WEIGHT_NAMES[w]}
            {missing && w === f.value ? ' (not in this font)' : ''}
          </option>
        ))}
      </select>
      {missing && <div className="tf-hint">{family} has no {f.value}; the nearest weight is used.</div>}
    </div>
  );
}

function ItalicField({ style }: { style: TextStyleName }) {
  const family = useField<string>(`typography.styles.${style}.family`).value;
  const f = useField<boolean>(`typography.styles.${style}.italic`);
  const info = fontInfo(family);
  const unsupported = info && !info.i;
  return (
    <div className={`tf ${f.locked ? 'locked' : ''}`} title={f.lockedReason}>
      <div className="tf-label">
        <span>Italic</span>
        {f.locked && <span className="lock">🔒</span>}
      </div>
      <label className="switch">
        <input type="checkbox" checked={!!f.value} disabled={f.locked || (unsupported && !f.value)} onChange={(e) => f.set(e.target.checked)} />
        <span>{unsupported ? 'Not available' : f.value ? 'Italic' : 'Upright'}</span>
      </label>
    </div>
  );
}

/** Live sample of a text style using its resolved tokens. */
function StyleSample({ style }: { style: TextStyleName }) {
  const { resolved } = useEditor();
  const s = resolved.theme?.typography.styles[style];
  if (!s) return null;
  return (
    <div
      className="type-sample"
      style={{
        fontFamily: `'${s.family}', system-ui`,
        fontSize: Math.min(s.size, 40),
        fontWeight: s.weight,
        fontStyle: s.italic ? 'italic' : 'normal',
        lineHeight: `${Math.min(s.lineHeight, 48)}px`,
        letterSpacing: s.letterSpacing,
      }}
    >
      {SAMPLE_TEXT[style]}
    </div>
  );
}

const SAMPLE_TEXT: Record<TextStyleName, string> = {
  display: 'Ship faster',
  headline: 'Quarterly overview',
  titleLarge: 'Recent shipments',
  titleMedium: 'Delivery address',
  bodyLarge: 'Your order is on its way and arrives tomorrow.',
  bodyMedium: 'Track every delivery in real time from one place.',
  bodySmall: 'Updated 2 minutes ago by the dispatch team.',
  labelLarge: 'Save changes',
  labelMedium: 'In transit',
  caption: 'Last synced 09:41',
};

function TypographySection() {
  const { policy } = useEditor();
  const stylesEditable = canEdit(policy, 'typography.styles.display.size');
  return (
    <>
      <Group title="Font families" note="Pick from Google Fonts. Text styles below use one of these three.">
        <div className="span-2">
          <FontPicker path="typography.fontFamily.primary" label="Primary (UI)" />
        </div>
        <div className="span-2">
          <FontPicker path="typography.fontFamily.secondary" label="Secondary (display & headings)" />
        </div>
        <div className="span-2">
          <FontPicker path="typography.fontFamily.mono" label="Monospace (code, IDs)" />
        </div>
      </Group>
      {!stylesEditable && (
        <div className="notice info small">Sizes, weights and spacing of text styles are managed by your agency.</div>
      )}
      {TEXT_STYLES.map((s) => (
        <Group key={s} title={humanize(s)}>
          <div className="span-2">
            <StyleSample style={s} />
          </div>
          <FontRefField path={`typography.styles.${s}.family`} label="Font" />
          <NumberField path={`typography.styles.${s}.size`} label="Size" unit="px" min={8} max={120} />
          <WeightField style={s} />
          <ItalicField style={s} />
          <NumberField path={`typography.styles.${s}.lineHeight`} label="Line height" unit="px" />
          <NumberField path={`typography.styles.${s}.letterSpacing`} label="Letter spacing" unit="px" step={0.05} />
        </Group>
      ))}
      <Group title="Responsive scale" note="Multiplies Display and Headline only.">
        {BREAKPOINTS.map((b) => (
          <NumberField key={b} path={`typography.responsiveScale.${b}`} label={humanize(b)} step={0.05} min={0.5} max={2} unit="×" />
        ))}
      </Group>
    </>
  );
}

// ── Layout, shape, elevation ─────────────────────────────────────────────────

function LayoutSection() {
  return (
    <>
      {BREAKPOINTS.map((b) => (
        <Group key={b} title={`${humanize(b)} layout`}>
          <NumberField path={`spacing.layout.${b}.pagePadding`} label="Page padding" unit="px" />
          <NumberField path={`spacing.layout.${b}.sectionGap`} label="Section gap" unit="px" />
          <NumberField path={`spacing.layout.${b}.cardGap`} label="Card gap" unit="px" />
          <NumberField path={`spacing.layout.${b}.contentMaxWidth`} label="Max content width" unit="px" nullable hint="Empty = full width" />
        </Group>
      ))}
      <Group title="Component spacing">
        <NumberField path="spacing.component.cardPadding" label="Card padding" unit="px" />
        <NumberField path="spacing.component.dialogPadding" label="Dialog padding" unit="px" />
        <NumberField path="spacing.component.listGap" label="List gap" unit="px" />
        <NumberField path="spacing.component.formGap" label="Form gap" unit="px" />
      </Group>
      <Group title="Spacing scale" note="The 4px grid every app uses.">
        {(['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'] as const).map((k) => (
          <NumberField key={k} path={`spacing.scale.${k}`} label={k} unit="px" />
        ))}
      </Group>
      <Group title="Breakpoints">
        <NumberField path="sizing.breakpoints.tablet" label="Tablet from" unit="px" />
        <NumberField path="sizing.breakpoints.desktop" label="Desktop from" unit="px" />
        <NumberField path="sizing.breakpoints.wide" label="Wide from" unit="px" />
      </Group>
    </>
  );
}

function ShapeSection() {
  return (
    <>
      <Group title="Corners">
        <SegmentedField path="shape.cornerStyle" label="Corner style" options={['rounded', 'cut']} />
        {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((k) => (
          <NumberField key={k} path={`shape.radius.${k}`} label={`Radius ${k}`} unit="px" min={0} max={64} />
        ))}
      </Group>
      <Group title="Borders">
        <NumberField path="shape.borderWidth.thin" label="Thin" unit="px" />
        <NumberField path="shape.borderWidth.thick" label="Thick" unit="px" />
      </Group>
      <Group title="Elevation">
        <ColorField path="elevation.shadowColor.light" label="Shadow color (light)" />
        <ColorField path="elevation.shadowColor.dark" label="Shadow color (dark)" />
        {[1, 2, 3, 4, 5].map((l) => (
          <div key={l} className="row-3">
            <NumberField path={`elevation.levels.level${l}.offsetY`} label={`L${l} offset`} unit="px" />
            <NumberField path={`elevation.levels.level${l}.blur`} label="blur" unit="px" />
            <NumberField path={`elevation.levels.level${l}.opacity`} label="opacity" step={0.02} min={0} max={1} />
          </div>
        ))}
      </Group>
    </>
  );
}

// ── Motion & navigation ──────────────────────────────────────────────────────

function MotionSection() {
  return (
    <>
      <Group title="Page transitions">
        <SelectField path="motion.pageTransition" label="Transition" options={PAGE_TRANSITIONS} hint="Use “Replay” in the preview to see it" />
        <ToggleField path="motion.respectReducedMotion" label="Respect reduced-motion settings" />
      </Group>
      <Group title="Durations">
        <NumberField path="motion.duration.short" label="Short" unit="ms" step={10} />
        <NumberField path="motion.duration.medium" label="Medium" unit="ms" step={10} />
        <NumberField path="motion.duration.long" label="Long" unit="ms" step={10} />
      </Group>
      <Group title="Easing curves">
        <BezierField path="motion.easing.standard" label="Standard" />
        <BezierField path="motion.easing.emphasized" label="Emphasized" />
        <BezierField path="motion.easing.decelerate" label="Decelerate (enter)" />
        <BezierField path="motion.easing.accelerate" label="Accelerate (exit)" />
      </Group>
    </>
  );
}

function NavigationSection() {
  return (
    <>
      <Group title="Navigation pattern" note="Switch the preview device to see each one.">
        {BREAKPOINTS.map((b) => (
          <SelectField key={b} path={`navigation.pattern.${b}`} label={humanize(b)} options={NAV_PATTERNS} />
        ))}
      </Group>
      <Group title="Style">
        <SegmentedField path="navigation.showLabels" label="Labels" options={['always', 'selected', 'never']} />
        <SegmentedField path="navigation.indicator" label="Active indicator" options={['pill', 'underline', 'none']} />
      </Group>
      <Group title="App bar">
        <ToggleField path="navigation.appBar.centeredTitle" label="Centered title" />
        <ToggleField path="navigation.appBar.elevated" label="Elevated" />
        <NumberField path="navigation.appBar.height" label="Height" unit="px" />
      </Group>
    </>
  );
}

// ── Components & effects ─────────────────────────────────────────────────────

function ComponentsSection() {
  return (
    <>
      <Group title="Buttons">
        <SegmentedField path="components.button.variant" label="Primary style" options={['filled', 'tonal', 'outlined']} />
        <SelectField path="components.button.textTransform" label="Text" options={['none', 'uppercase', 'capitalize']} />
        <NumberField path="components.button.radius" label="Radius" unit="px" />
        <NumberField path="components.button.height" label="Height" unit="px" />
        <NumberField path="components.button.paddingX" label="Horizontal padding" unit="px" />
      </Group>
      <Group title="Inputs">
        <SegmentedField path="components.input.variant" label="Style" options={['outlined', 'filled']} />
        <NumberField path="components.input.radius" label="Radius" unit="px" />
        <NumberField path="components.input.height" label="Height" unit="px" />
      </Group>
      <Group title="Cards">
        <NumberField path="components.card.radius" label="Radius" unit="px" />
        <NumberField path="components.card.elevation" label="Elevation level" min={0} max={5} />
        <ToggleField path="components.card.bordered" label="Border" />
      </Group>
      <Group title="Dialogs, chips & badges">
        <NumberField path="components.dialog.radius" label="Dialog radius" unit="px" />
        <NumberField path="components.dialog.elevation" label="Dialog elevation" min={0} max={5} />
        <NumberField path="components.chip.radius" label="Chip radius" unit="px" />
        <NumberField path="components.badge.radius" label="Badge radius" unit="px" />
      </Group>
    </>
  );
}

function EffectsSection() {
  const stops = useField<string[]>('effects.gradient.stops');
  const roles = ['primary', 'secondary', 'accent', 'primaryContainer', 'secondaryContainer', 'accentContainer', 'surface'];
  return (
    <>
      <Group title="Brand gradient">
        <ToggleField path="effects.gradient.enabled" label="Use gradient" hint="Shown on hero banners" />
        <NumberField path="effects.gradient.angle" label="Angle" unit="°" min={0} max={360} />
        <div className="row-2">
          {[0, 1].map((i) => (
            <label key={i} className="tf">
              <div className="tf-label">{i === 0 ? 'From' : 'To'}</div>
              <select
                value={stops.value?.[i] ?? ''}
                disabled={stops.locked}
                onChange={(e) => {
                  const next = [...(stops.value ?? ['primary', 'accent'])];
                  next[i] = e.target.value;
                  stops.set(next);
                }}
              >
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {humanize(r)}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </Group>
      <Group title="States">
        <NumberField path="effects.opacity.hover" label="Hover overlay" step={0.01} min={0} max={1} />
        <NumberField path="effects.opacity.pressed" label="Pressed overlay" step={0.01} min={0} max={1} />
        <NumberField path="effects.opacity.disabled" label="Disabled opacity" step={0.01} min={0} max={1} />
      </Group>
      <Group title="Focus ring">
        <NumberField path="effects.focusRing.width" label="Width" unit="px" />
        <NumberField path="effects.focusRing.offset" label="Offset" unit="px" />
      </Group>
    </>
  );
}

function BrandAssetsSection() {
  return (
    <Group title="Brand assets" note="Image URLs (https). Upload support comes later.">
      <TextField path="assets.appName" label="App name" />
      <TextField path="assets.logo.light" label="Logo (light mode)" placeholder="https://…" nullable />
      <TextField path="assets.logo.dark" label="Logo (dark mode)" placeholder="https://…" nullable />
      <TextField path="assets.favicon" label="Favicon" placeholder="https://…" nullable />
    </Group>
  );
}

export const SECTIONS: SectionDef[] = [
  { id: 'colors', title: 'Colors', paths: ['color'], render: () => <ColorsSection /> },
  { id: 'typography', title: 'Typography', paths: ['typography'], render: () => <TypographySection /> },
  { id: 'layout', title: 'Layout & spacing', paths: ['spacing', 'sizing'], render: () => <LayoutSection /> },
  { id: 'shape', title: 'Shape & elevation', paths: ['shape', 'elevation'], render: () => <ShapeSection /> },
  { id: 'motion', title: 'Motion', paths: ['motion'], render: () => <MotionSection /> },
  { id: 'navigation', title: 'Navigation', paths: ['navigation'], render: () => <NavigationSection /> },
  { id: 'components', title: 'Components', paths: ['components'], render: () => <ComponentsSection /> },
  { id: 'effects', title: 'Effects', paths: ['effects'], render: () => <EffectsSection /> },
  { id: 'assets', title: 'Brand assets', paths: ['assets'], render: () => <BrandAssetsSection /> },
];
