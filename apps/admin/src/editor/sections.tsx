import {
  BREAKPOINTS,
  NAV_PATTERNS,
  PAGE_TRANSITIONS,
  TEXT_STYLES,
  canEdit,
  type ColorRole,
} from '@dts/schema';
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

const GOOGLE_FONTS = [
  'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins', 'Nunito Sans', 'Source Sans 3', 'Work Sans',
  'DM Sans', 'Manrope', 'Rubik', 'IBM Plex Sans', 'Noto Sans', 'Raleway', 'Playfair Display', 'Merriweather',
  'Lora', 'DM Serif Display', 'Space Grotesk', 'JetBrains Mono', 'Fira Code', 'Roboto Mono', 'IBM Plex Mono',
];

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

function TypographySection() {
  const { policy } = useEditor();
  const stylesEditable = canEdit(policy, 'typography.styles.display.size');
  return (
    <>
      <datalist id="google-fonts">
        {GOOGLE_FONTS.map((f) => (
          <option key={f} value={f} />
        ))}
      </datalist>
      <Group title="Fonts" note="Any Google Fonts family name.">
        <TextField path="typography.fontFamily.primary" label="Primary (UI)" list="google-fonts" />
        <TextField path="typography.fontFamily.secondary" label="Secondary (display & headings)" list="google-fonts" />
        <TextField path="typography.fontFamily.mono" label="Monospace" list="google-fonts" />
      </Group>
      {TEXT_STYLES.map((s) => (
        <Group key={s} title={humanize(s)} note={!stylesEditable && s === 'display' ? 'Text sizes are managed by your agency.' : undefined}>
          <FontRefField path={`typography.styles.${s}.family`} label="Font" />
          <NumberField path={`typography.styles.${s}.size`} label="Size" unit="px" min={8} max={120} />
          <SelectField path={`typography.styles.${s}.weight`} label="Weight" options={['100', '200', '300', '400', '500', '600', '700', '800', '900']} />
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
