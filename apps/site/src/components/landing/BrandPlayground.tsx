import { useDeferredValue, useId, useMemo, useState } from 'react';
import { DEMO_TENANT_BASE, contrastRatio, resolveTheme, type ThemeInput } from '@debdaru07/schema';
import type { Theme } from '@debdaru07/react';
import Device from './Device.tsx';
import Segmented from './Segmented.tsx';

/**
 * "Bring your brand": builds a client layer from three choices and resolves it on top of the demo agency
 * base with the same `resolveTheme` the API runs. Palettes, contrast results and the layer JSON are real output.
 */
const PRESETS = ['#3B5BDB', '#E8590C', '#0F766E', '#7C3AED', '#C2255C'];
const FONTS = ['Inter', 'Fraunces', 'Space Grotesk', 'Nunito Sans'] as const;
type Font = (typeof FONTS)[number];
type Shape = 'sharp' | 'soft' | 'round';
type Mode = 'light' | 'dark';

const SHAPES: Record<Shape, ThemeInput> = {
  sharp: { shape: { radius: { xs: 2, sm: 2, md: 4, lg: 6, xl: 8 } }, components: { button: { radius: '{shape.radius.sm}' } } },
  soft: { shape: { radius: { xs: 4, sm: 8, md: 12, lg: 16, xl: 20 } }, components: { button: { radius: '{shape.radius.md}' } } },
  round: { shape: { radius: { xs: 8, sm: 12, md: 20, lg: 24, xl: 32 } }, components: { button: { radius: '{shape.radius.full}' } } },
};
const HEX = /^#?([0-9a-f]{6})$/i;
const ROLES = [
  ['primary', 'Primary'],
  ['primaryContainer', 'Container'],
  ['secondary', 'Secondary'],
  ['accent', 'Accent'],
  ['surface', 'Surface'],
] as const;

function buildLayer(primary: string, font: Font, shape: Shape, appName: string): ThemeInput {
  return {
    color: { seed: { primary } },
    ...(font !== 'Inter' && { typography: { fontFamily: { primary: font } } }),
    ...SHAPES[shape],
    assets: { appName: appName.trim() || 'Your brand' },
  } as ThemeInput;
}

export default function BrandPlayground() {
  const ids = { hex: useId(), hexError: useId(), name: useId() };
  const [primary, setPrimary] = useState('#E8590C');
  const [hexDraft, setHexDraft] = useState('#E8590C');
  const [font, setFont] = useState<Font>('Fraunces');
  const [shape, setShape] = useState<Shape>('soft');
  const [appName, setAppName] = useState('Your brand');
  const [phoneMode, setPhoneMode] = useState<Mode>('light');
  const [copied, setCopied] = useState(false);

  const hexInvalid = !HEX.test(hexDraft);
  const layer = useMemo(() => buildLayer(primary, font, shape, appName), [primary, font, shape, appName]);
  const deferred = useDeferredValue(layer);
  const { theme, contrast } = useMemo(() => {
    const r = resolveTheme([DEMO_TENANT_BASE, deferred]);
    return { theme: r.theme as unknown as Theme, contrast: r.contrast };
  }, [deferred]);

  const pickColor = (hex: string) => {
    const value = hex.toUpperCase();
    setPrimary(value);
    setHexDraft(value);
  };
  const json = JSON.stringify(layer, null, 2);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* Clipboard blocked (insecure origin or denied): the JSON stays selectable. */
    }
  };

  const core = contrast.issues.filter((i) => i.level === 'error');
  const warnings = contrast.issues.filter((i) => i.level !== 'error');
  const ratio = (m: Mode) => contrastRatio(theme.color[m].onPrimary, theme.color[m].primary).toFixed(1);
  const name = theme.assets.appName;

  return (
    <div className="playground">
      <form className="pg-controls" onSubmit={(e) => e.preventDefault()} aria-label="Your client theme">
        <fieldset className="pg-field">
          <legend>Brand color</legend>
          <div className="pg-color-row">
            <input type="color" value={primary} aria-label="Pick a brand color" onChange={(e) => pickColor(e.target.value)} />
            <div className="pg-hex">
              <label htmlFor={ids.hex} className="sr-only">Hex value</label>
              <input
                id={ids.hex}
                type="text"
                inputMode="text"
                autoComplete="off"
                spellCheck={false}
                value={hexDraft}
                maxLength={7}
                aria-invalid={hexInvalid}
                aria-describedby={hexInvalid ? ids.hexError : undefined}
                onChange={(e) => {
                  const next = e.target.value;
                  setHexDraft(next);
                  const m = HEX.exec(next);
                  if (m) setPrimary(`#${m[1].toUpperCase()}`);
                }}
              />
            </div>
          </div>
          {hexInvalid && (
            <p id={ids.hexError} className="pg-error">
              Use six hex digits, like #3B5BDB. Showing {primary}.
            </p>
          )}
          <div className="pg-presets" role="group" aria-label="Preset colors">
            {PRESETS.map((c) => (
              <button key={c} type="button" className="pg-preset" style={{ background: c }}
                aria-label={`Use ${c}`} aria-pressed={primary === c} onClick={() => pickColor(c)} />
            ))}
          </div>
        </fieldset>

        <div className="pg-field pg-fonts">
          <Segmented label="Typeface" value={font} options={FONTS.map((f) => ({ value: f, label: f }))} onChange={setFont} />
        </div>
        <div className="pg-field">
          <Segmented
            label="Shape"
            value={shape}
            options={[
              { value: 'sharp', label: 'Sharp' },
              { value: 'soft', label: 'Soft' },
              { value: 'round', label: 'Round' },
            ]}
            onChange={setShape}
          />
        </div>
        <div className="pg-field">
          <label htmlFor={ids.name} className="pg-label">App name</label>
          <input id={ids.name} type="text" value={appName} maxLength={24} autoComplete="off"
            onChange={(e) => setAppName(e.target.value)} />
        </div>
      </form>

      <div className="pg-output">
        <div className="pg-phone-mode">
          <Segmented
            label="Preview"
            value={phoneMode}
            options={[
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
            ]}
            onChange={setPhoneMode}
          />
        </div>
        <div className="pg-devices" data-show={phoneMode}>
          {(['light', 'dark'] as const).map((m) => (
            <figure key={m} className={`pg-device pg-device-${m}`}>
              <Device theme={theme} mode={m} label={`${name}, ${m} mode`} />
              <figcaption>{m === 'light' ? 'Light' : 'Dark'} · generated</figcaption>
            </figure>
          ))}
        </div>

        <div className="pg-report">
          <p className="pg-verdict" aria-live="polite" data-ok={contrast.publishable}>
            <strong>{contrast.publishable ? 'Publishable.' : 'Publishing blocked.'}</strong>{' '}
            {contrast.publishable
              ? 'Every core text/background pair passes WCAG AA in light and dark.'
              : `${core.length} core ${core.length === 1 ? 'pair fails' : 'pairs fail'} WCAG AA.`}{' '}
            Text on primary: {ratio('light')}:1 light, {ratio('dark')}:1 dark
            {warnings.length > 0 && `. ${warnings.length} non-blocking ${warnings.length === 1 ? 'warning' : 'warnings'}`}.
          </p>

          <div className="pg-palette" aria-label="Generated palette">
            {(['light', 'dark'] as const).map((m) => (
              <div key={m} className="pg-palette-row">
                <span className="pg-palette-mode">{m === 'light' ? 'Light' : 'Dark'}</span>
                {ROLES.map(([role, label]) => {
                  const hex = theme.color[m][role];
                  return (
                    <span key={role} className="pg-chip" title={`${label} ${hex}`}>
                      <span className="swatch" style={{ background: hex }} aria-hidden="true" />
                      <span className="pg-chip-text">
                        <span className="pg-chip-role">{label}</span>
                        <span className="pg-chip-hex">{hex.toUpperCase()}</span>
                      </span>
                    </span>
                  );
                })}
              </div>
            ))}
          </div>

          <details className="pg-json">
            <summary>The client layer you would publish ({json.split('\n').length} lines)</summary>
            <div className="pg-json-body">
              <pre><code>{json}</code></pre>
              <button type="button" className="pg-copy" onClick={copy}>
                {copied ? 'Copied' : 'Copy JSON'}
              </button>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
