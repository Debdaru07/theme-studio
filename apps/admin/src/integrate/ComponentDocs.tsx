import { ThemeProvider } from '@dts/react';
import type { Theme } from '@dts/schema';
import { useId, useState } from 'react';
import { CodeBlock, type Copy } from './CodeBlock.tsx';
import { COMPONENT_SETUP, COMPONENTS, type ComponentDoc } from './components.ts';
import { DEMOS } from './demos.tsx';
import type { SdkId } from './sdks.ts';

const CATEGORIES = ['All', 'Actions', 'Inputs', 'Display', 'Feedback', 'Overlays', 'Navigation'] as const;

/** Integrate tab: how to use each SDK component, following the SDK picker. */
export function ComponentDocs({ sdk, sdkLabel, copy, theme }: { sdk: SdkId; sdkLabel: string; copy: Copy; theme: Theme }) {
  const searchId = useId();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('All');
  const setup = COMPONENT_SETUP[sdk];
  const q = query.trim().toLowerCase();
  const shown = COMPONENTS.filter(
    (c) => (category === 'All' || c.category === category) && (!q || `${c.name} ${c.summary} ${c.category}`.toLowerCase().includes(q)),
  );

  return (
    <section className="int-section" aria-labelledby="int-components">
      <div className="int-ref-head">
        <h3 id="int-components">Components</h3>
        <span className="muted small">{COMPONENTS.length} components · live in Preview → Component library</span>
      </div>
      <p className="muted small">{setup.note}</p>
      <CodeBlock code={setup.code} label={setup.file} lang={setup.lang} copy={copy} />

      <div className="int-filters">
        <label htmlFor={searchId} className="sr-only">
          Search components
        </label>
        <input id={searchId} type="search" placeholder="Search components, e.g. dialog, badge, form" value={query} onChange={(e) => setQuery(e.target.value)} autoComplete="off" />
      </div>
      <div className="int-recipes" role="group" aria-label="Component category">
        {CATEGORIES.map((c) => (
          <button key={c} type="button" className={`chip-btn${category === c ? ' on' : ''}`} aria-pressed={category === c} onClick={() => setCategory(c)}>
            {c}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="int-empty muted">
          No components match “{query.trim()}”.{' '}
          <button
            type="button"
            className="link-btn"
            onClick={() => {
              setQuery('');
              setCategory('All');
            }}
          >
            Clear filters
          </button>
        </p>
      ) : (
        <div className="int-comps">
          {shown.map((c) => (
            <ComponentEntry key={c.id} doc={c} sdk={sdk} sdkLabel={sdkLabel} copy={copy} theme={theme} />
          ))}
        </div>
      )}
    </section>
  );
}

/** The component's variants live in this client's theme. Overlays open inside the panel. */
function LivePreview({ doc, theme }: { doc: ComponentDoc; theme: Theme }) {
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  const demo = DEMOS[doc.id];
  if (!demo) return null;
  return (
    <div className="int-preview" data-overlay={doc.category === 'Overlays' || doc.id === 'toast' || undefined}>
      <div className="int-preview-bar">
        <span className="int-preview-title">Preview · this client’s theme</span>
        <div className="segmented" role="group" aria-label={`${doc.name} preview mode`}>
          {(['light', 'dark'] as const).map((m) => (
            <button key={m} type="button" className={mode === m ? 'on' : ''} aria-pressed={mode === m} onClick={() => setMode(m)}>
              {m === 'light' ? 'Light' : 'Dark'}
            </button>
          ))}
        </div>
      </div>
      <ThemeProvider theme={theme} mode={mode} scope="element" className="int-preview-app">
        {demo()}
      </ThemeProvider>
    </div>
  );
}

function ComponentEntry({ doc, sdk, sdkLabel, copy, theme }: { doc: ComponentDoc; sdk: SdkId; sdkLabel: string; copy: Copy; theme: Theme }) {
  const signature = sdk === 'flutter' ? doc.flutter : sdk === 'react-native' ? doc.native : null;
  return (
    <details className="int-comp">
      <summary>
        <span className="int-comp-name">{doc.name}</span>
        <span className="int-comp-cat">{doc.category}</span>
        <span className="int-comp-summary muted">{doc.summary}</span>
      </summary>
      <div className="int-comp-body">
        <div className="int-showcase">
          <LivePreview doc={doc} theme={theme} />
          <CodeBlock code={doc.code[sdk]} label={`${doc.name} · ${sdkLabel}`} lang={sdk === 'web' ? 'html' : sdk === 'flutter' ? 'dart' : 'tsx'} copy={copy} />
        </div>

        {signature ? (
          <div className="int-comp-block">
            <h4>API</h4>
            <code className="int-signature">{signature}</code>
            <p className="muted small">Props mean the same as in React; the table below lists them.</p>
          </div>
        ) : null}

        <div className="int-comp-block">
          <h4>{sdk === 'web' ? 'Options (classes and attributes mirror these props)' : 'Props'}</h4>
          <div className="int-props">
            <table className="int-table">
              <thead>
                <tr>
                  <th scope="col">Prop</th>
                  <th scope="col">Type</th>
                  <th scope="col">Default</th>
                  <th scope="col">Description</th>
                </tr>
              </thead>
              <tbody>
                {doc.props.map((p) => (
                  <tr key={p.name}>
                    <td data-label="Prop">
                      <code>{p.name}</code>
                    </td>
                    <td data-label="Type">
                      <code className="int-type">{p.type}</code>
                    </td>
                    <td data-label="Default">{p.default ? <code>{p.default}</code> : <span className="muted">—</span>}</td>
                    <td data-label="About">{p.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="int-comp-cols">
          <div className="int-comp-block">
            <h4>Theme tokens it reads</h4>
            <ul className="int-tokens">
              {doc.tokens.map((t) => (
                <li key={t}>
                  <code>{t}</code>
                </li>
              ))}
            </ul>
          </div>
          <div className="int-comp-block">
            <h4>Accessibility</h4>
            <ul className="int-a11y">
              {doc.a11y.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </details>
  );
}
