import { useMemo, useState } from 'react';
import { DEMO_CLIENTS, DEMO_TENANT_BASE, resolveTheme, type ThemeInput } from '@debdaru07/schema';
import type { Theme } from '@debdaru07/react';
import Device from './Device.tsx';

/**
 * Theme layers, one step at a time: the same screen resolved from platform defaults, then the demo agency's
 * base theme, then one client's overrides. The JSON shown is the layer each step adds, from `@debdaru07/schema`.
 */
const STEPS: Array<{ id: string; title: string; who: string; body: string; layer: ThemeInput | null }> = [
  {
    id: 'platform',
    title: 'Platform defaults',
    who: 'Theme Studio',
    body: 'Every token has an accessible default, so an empty theme still renders a complete app.',
    layer: null,
  },
  {
    id: 'agency',
    title: 'Agency base',
    who: 'Northwind (the agency)',
    body: 'The agency sets the product look once. It can lock tokens its clients cannot change.',
    layer: DEMO_TENANT_BASE,
  },
  {
    id: 'client',
    title: 'Client overrides',
    who: 'Acme Fleet (a client)',
    body: 'Each client changes only what makes it theirs. Everything else follows the agency base.',
    layer: DEMO_CLIENTS.acme.layer,
  },
];

export default function LayerStack() {
  const [step, setStep] = useState(2);
  const theme = useMemo(() => {
    const layers = STEPS.slice(1, step + 1).map((s) => s.layer as ThemeInput);
    return resolveTheme(layers).theme as unknown as Theme;
  }, [step]);
  const current = STEPS[step];

  return (
    <div className="layers">
      <ol className="layer-steps">
        {STEPS.map((s, i) => (
          <li key={s.id} data-state={i < step ? 'below' : i === step ? 'current' : 'above'}>
            <button type="button" aria-pressed={i === step} onClick={() => setStep(i)}>
              <span className="layer-index" aria-hidden="true">{i + 1}</span>
              <span className="layer-text">
                <span className="layer-title">{s.title}</span>
                <span className="layer-who">{s.who}</span>
              </span>
            </button>
          </li>
        ))}
      </ol>

      <div className="layer-view">
        <Device theme={theme} mode="light" label={`Sample app screen resolved up to: ${current.title}`} />
        <div className="layer-detail" aria-live="polite">
          <p className="layer-body">{current.body}</p>
          {current.layer ? (
            <pre className="layer-json"><code>{JSON.stringify(current.layer, null, 2)}</code></pre>
          ) : (
            <p className="layer-empty">No layer yet. This is <code>resolveTheme([])</code>.</p>
          )}
        </div>
      </div>
    </div>
  );
}
