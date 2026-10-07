import { BUTTON_VARIANTS, CONTROL_SIZES, canEdit, getPath, leafPaths, setPath, type ThemeInput } from '@debdaru07/schema';
import { useState, type ReactNode } from 'react';
import { humanize, useEditor } from '../fields.tsx';
import { COMPONENTS, useComponentFocus, type ComponentId } from './focus.tsx';
import { activeCorners, activeDensity, applyCorners, applyDensity, CORNERS, DENSITY } from './presets.ts';
import { ChoiceField, LevelField, RoleField, ScaleField, TextStyleField, ToggleTokenField } from './TokenFields.tsx';
import { snippets, type SnippetLang } from './snippets.ts';

/** Values the agency set for a component (the client-owned default variant doesn't count). */
function customCount(layer: ThemeInput | null, id: ComponentId): number {
  const node = layer ? getPath(layer, `components.${id}`) : undefined;
  return leafPaths(node ?? {}).filter((p) => p !== 'variant').length;
}

function Block({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="cw-block">
      <h3>{title}</h3>
      {hint && <p className="cw-hint">{hint}</p>}
      <div className="cw-fields">{children}</div>
    </section>
  );
}

function Tabs<T extends string>({ value, options, onChange, label }: { value: T; options: readonly T[]; onChange(v: T): void; label: string }) {
  return (
    <div className="cw-tabs" role="tablist" aria-label={label}>
      {options.map((o) => (
        <button key={o} type="button" role="tab" aria-selected={value === o} className={value === o ? 'on' : ''} onClick={() => onChange(o)}>
          {o === 'sm' ? 'Small' : o === 'md' ? 'Medium' : o === 'lg' ? 'Large' : humanize(o)}
        </button>
      ))}
    </div>
  );
}

function ButtonSettings() {
  const { size, setSize, variant, setVariant } = useComponentFocus();
  const s = `components.button.sizes.${size}`;
  const v = `components.button.variants.${variant}`;
  return (
    <>
      <Block title="Default style" hint="The style <Button> uses when the code doesn't pick one. Clients can change this.">
        <ChoiceField path="components.button.variant" label="Default variant" options={['filled', 'tonal', 'outlined']} />
      </Block>
      <Block title="Shape">
        <ScaleField path="components.button.radius" label="Corner radius" scale="radius" />
        <ScaleField path="components.button.borderWidth" label="Border width" scale="border" />
      </Block>
      <Block title="Size" hint="Pick a size, or click a button in the preview.">
        <Tabs label="Button size" value={size} options={CONTROL_SIZES} onChange={setSize} />
        <ScaleField path={`${s}.height`} label="Height" scale="height" />
        <ScaleField path={`${s}.paddingX`} label="Side padding" scale="spacing" />
        <TextStyleField path={`${s}.textStyle`} label="Text style" />
      </Block>
      <Block title="Variant colors" hint="Colors are theme roles, so they adapt to light and dark mode and every client's palette.">
        <Tabs label="Button variant" value={variant} options={BUTTON_VARIANTS} onChange={setVariant} />
        <RoleField path={`${v}.container`} label="Background" allowTransparent />
        <RoleField path={`${v}.content`} label="Text and icon" />
        <RoleField path={`${v}.border`} label="Border" allowTransparent />
        <LevelField path={`${v}.elevation`} label="Shadow" />
      </Block>
      <Block title="Details">
        <ScaleField path="components.button.iconGap" label="Icon gap" scale="spacing" />
        <ChoiceField path="components.button.textTransform" label="Text case" options={['none', 'uppercase', 'capitalize']} />
      </Block>
    </>
  );
}

function InputSettings() {
  return (
    <>
      <Block title="Default style" hint="Clients can change this.">
        <ChoiceField path="components.input.variant" label="Default variant" options={['outlined', 'filled']} />
      </Block>
      <Block title="Shape">
        <ScaleField path="components.input.radius" label="Corner radius" scale="radius" />
        <ScaleField path="components.input.borderWidth" label="Border width" scale="border" />
      </Block>
      <Block title="Size & spacing">
        <ScaleField path="components.input.height" label="Height" scale="height" />
        <ScaleField path="components.input.paddingX" label="Side padding" scale="spacing" />
        <ScaleField path="components.input.labelGap" label="Label gap" scale="spacing" />
      </Block>
    </>
  );
}

function CardSettings() {
  return (
    <>
      <Block title="Shape">
        <ScaleField path="components.card.radius" label="Corner radius" scale="radius" />
        <LevelField path="components.card.elevation" label="Shadow" />
        <ToggleTokenField path="components.card.bordered" label="Show a border" />
      </Block>
      <Block title="Spacing">
        <ScaleField path="components.card.padding" label="Padding" scale="spacing" />
        <ScaleField path="components.card.gap" label="Gap between items" scale="spacing" />
      </Block>
    </>
  );
}

function ChipSettings() {
  return (
    <>
      <Block title="Shape & size">
        <ScaleField path="components.chip.radius" label="Corner radius" scale="radius" />
        <ScaleField path="components.chip.height" label="Height" scale="height" />
      </Block>
      <Block title="Spacing">
        <ScaleField path="components.chip.paddingX" label="Side padding" scale="spacing" />
        <ScaleField path="components.chip.iconGap" label="Icon gap" scale="spacing" />
      </Block>
      <Block title="Selected colors">
        <RoleField path="components.chip.selected.container" label="Background" />
        <RoleField path="components.chip.selected.content" label="Text" />
      </Block>
    </>
  );
}

function BadgeSettings() {
  return (
    <Block title="Shape & spacing">
      <ScaleField path="components.badge.radius" label="Corner radius" scale="radius" />
      <ScaleField path="components.badge.paddingX" label="Side padding" scale="spacing" />
    </Block>
  );
}

function DialogSettings() {
  return (
    <>
      <Block title="Shape">
        <ScaleField path="components.dialog.radius" label="Corner radius" scale="radius" />
        <LevelField path="components.dialog.elevation" label="Shadow" />
      </Block>
      <Block title="Spacing">
        <ScaleField path="components.dialog.padding" label="Padding" scale="spacing" />
        <ScaleField path="components.dialog.actionGap" label="Gap between buttons" scale="spacing" />
      </Block>
    </>
  );
}

const SETTINGS: Record<ComponentId, () => ReactNode> = {
  button: ButtonSettings,
  input: InputSettings,
  card: CardSettings,
  chip: ChipSettings,
  badge: BadgeSettings,
  dialog: DialogSettings,
};

function Presets() {
  const ed = useEditor();
  const layer = ed.layer ?? {};
  const editable = canEdit(ed.policy, 'components.card.padding');
  const density = activeDensity(layer);
  const corners = activeCorners(layer);
  return (
    <section className="cw-presets" aria-label="Quick presets for all components">
      <div className="cw-preset-row">
        <span>Density</span>
        <div className="tk-steps wide" role="radiogroup" aria-label="Density">
          {(Object.keys(DENSITY) as (keyof typeof DENSITY)[]).map((d) => (
            <button key={d} type="button" role="radio" aria-checked={density === d} className={density === d ? 'on' : ''} disabled={!editable} onClick={() => ed.setLayer((l) => applyDensity(l ?? {}, d))}>
              {humanize(d)}
            </button>
          ))}
        </div>
      </div>
      <div className="cw-preset-row">
        <span>Corners</span>
        <div className="tk-steps wide" role="radiogroup" aria-label="Corners">
          {(Object.keys(CORNERS) as (keyof typeof CORNERS)[]).map((c) => (
            <button key={c} type="button" role="radio" aria-checked={corners === c} className={corners === c ? 'on' : ''} disabled={!editable} onClick={() => ed.setLayer((l) => applyCorners(l ?? {}, c))}>
              {humanize(c)}
            </button>
          ))}
        </div>
      </div>
      <p className="cw-hint">Presets change all six components. Fine-tune any value below.</p>
    </section>
  );
}

function CodePanel() {
  const { component, size, variant } = useComponentFocus();
  const [lang, setLang] = useState<SnippetLang>('React');
  const code = snippets(component, { size, variant })[lang];
  return (
    <details className="cw-code" open>
      <summary>Use it in code</summary>
      <div className="cw-tabs small" role="tablist" aria-label="Language">
        {(['React', 'Web', 'React Native', 'Flutter'] as const).map((l) => (
          <button key={l} type="button" role="tab" aria-selected={lang === l} className={lang === l ? 'on' : ''} onClick={() => setLang(l)}>
            {l}
          </button>
        ))}
      </div>
      <pre className="code">{code}</pre>
      <div className="cw-code-foot">
        <button type="button" className="btn ghost small" onClick={() => navigator.clipboard?.writeText(code)}>
          Copy snippet
        </button>
        <span className="cw-hint">No code change needed after you publish: apps pick up the new look on their next theme fetch.</span>
      </div>
    </details>
  );
}

/** The Components tab: pick a component, tune it on top of the theme, see it in the preview, copy the usage. */
export function ComponentsWorkspace() {
  const ed = useEditor();
  const { component, setComponent } = useComponentFocus();
  const Settings = SETTINGS[component];
  const count = customCount(ed.layer, component);
  const editable = canEdit(ed.policy, `components.${component}.radius`);
  const label = COMPONENTS.find((c) => c.id === component)!.label;

  const resetComponent = () =>
    ed.setLayer((l) => {
      const keepVariant = getPath(l ?? {}, `components.${component}.variant`);
      const cleared = setPath<ThemeInput>(l ?? {}, `components.${component}`, undefined);
      return keepVariant === undefined ? cleared : setPath<ThemeInput>(cleared, `components.${component}.variant`, keepVariant);
    });

  return (
    <div className="cw">
      <p className="cw-intro">
        Components start from the theme. Change only what this client needs. Everything else keeps following the theme.
      </p>
      {!editable && <div className="notice info small">Component sizes and colors are managed by your agency. You can still pick default styles.</div>}

      <div className="cw-picker" role="tablist" aria-label="Component">
        {COMPONENTS.map((c) => {
          const n = customCount(ed.layer, c.id);
          return (
            <button key={c.id} type="button" role="tab" aria-selected={component === c.id} className={component === c.id ? 'on' : ''} onClick={() => setComponent(c.id)}>
              {c.label}
              {n > 0 && <span className="cw-count" title={`${n} custom value${n === 1 ? '' : 's'}`}>{n}</span>}
            </button>
          );
        })}
      </div>

      <Presets />

      <div className="cw-title">
        <h2>{label}</h2>
        {count > 0 && editable && (
          <button type="button" className="btn ghost small" onClick={resetComponent}>
            Reset {label.toLowerCase()} to theme
          </button>
        )}
      </div>
      <Settings />
      <CodePanel />
    </div>
  );
}
