import type { Theme } from '@debdaru07/schema';
import { themeStylesheet } from '@debdaru07/web';
import { Fragment, useId, useMemo, useState } from 'react';
import { API_URL } from '../api.ts';
import type { ThemeEditor } from '../editor/useThemeEditor.ts';
import { CodeBlock, useCopy } from './CodeBlock.tsx';
import { ComponentDocs } from './ComponentDocs.tsx';
import { buildRows, CATEGORIES, type Category } from './reference.ts';
import { DOCS_URL, SDKS, type SdkId } from './sdks.ts';
import './integrate.css';

const SDK_KEY = 'dts:integrate:sdk';
const FIRST_SDK = SDKS[0]!;
const readSdk = (): SdkId => {
  try {
    const v = localStorage.getItem(SDK_KEY);
    return SDKS.some((s) => s.id === v) ? (v as SdkId) : 'flutter';
  } catch {
    return 'flutter';
  }
};

/** Lets long token paths wrap after a dot (on narrow cards) instead of mid-word. */
function dotted(text: string) {
  const parts = text.split('.');
  return parts.map((part, i) => (
    <Fragment key={i}>
      {part}
      {i < parts.length - 1 && (
        <>
          .<wbr />
        </>
      )}
    </Fragment>
  ));
}

function download(name: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  a.click();
  URL.revokeObjectURL(url);
}

export function Integrate({ ed }: { ed: ThemeEditor }) {
  const client = ed.state.data?.client;
  const theme = ed.resolved.theme as Theme | undefined;
  const ids = { search: useId(), only: useId() };
  const [sdkId, setSdkId] = useState<SdkId>(readSdk);
  const [recipe, setRecipe] = useState(0);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category | 'All'>('All');
  const [onlySet, setOnlySet] = useState(false);
  const { copy, message } = useCopy();

  const rows = useMemo(() => (theme ? buildRows(theme, ed.layer) : []), [theme, ed.layer]);
  if (!client || !theme) return null;

  const sdk = SDKS.find((s) => s.id === sdkId) ?? FIRST_SDK;
  const setup = sdk.setup(API_URL, client.publishableKey);
  const active = sdk.recipes[recipe] ?? sdk.recipes[0]!;
  const q = query.trim().toLowerCase();
  const shown = rows.filter(
    (r) =>
      (category === 'All' || r.category === category) &&
      (!onlySet || r.set) &&
      (!q || r.path.toLowerCase().includes(q) || r.access[sdk.id].toLowerCase().includes(q) || r.value.toLowerCase().includes(q)),
  );
  const ownCount = rows.filter((r) => r.set).length;
  const slug = client.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'theme';

  const pickSdk = (id: SdkId) => {
    setSdkId(id);
    setRecipe(0);
    try {
      localStorage.setItem(SDK_KEY, id);
    } catch {
      /* Private mode: the choice just isn't remembered. */
    }
  };

  return (
    <div className="integrate">
      <header className="int-head">
        <h2>Integrate</h2>
        <p className="muted">
          Connect an app to {client.name}’s live theme, then style it with tokens. Apps receive changes when you
          publish, with no rebuild.
        </p>
        {ed.changes.length > 0 && (
          <p className="notice warn small">
            Values below include {ed.changes.length} unpublished {ed.changes.length === 1 ? 'change' : 'changes'}. Apps see
            them after you publish.
          </p>
        )}
      </header>

      <section className="int-section" aria-labelledby="int-connect">
        <h3 id="int-connect">Connection</h3>
        <dl className="int-keys">
          <div className="key-row">
            <dt>Endpoint</dt>
            <dd>
              <code>{API_URL}</code>
            </dd>
            <button type="button" className="btn ghost small" onClick={() => copy(API_URL, 'endpoint')}>
              Copy
            </button>
          </div>
          <div className="key-row">
            <dt>Publishable key</dt>
            <dd>
              <code>{client.publishableKey}</code>
            </dd>
            <button type="button" className="btn ghost small" onClick={() => copy(client.publishableKey, 'publishable key')}>
              Copy
            </button>
          </div>
        </dl>
        <p className="muted small">
          The key is read-only and only returns this client’s published theme, so it is safe to ship inside an app.
        </p>
      </section>

      <div className="int-sdk" role="group" aria-label="SDK">
        <span className="int-sdk-label">SDK</span>
        <div className="segmented">
          {SDKS.map((s) => (
            <button key={s.id} type="button" className={s.id === sdk.id ? 'on' : ''} aria-pressed={s.id === sdk.id} onClick={() => pickSdk(s.id)}>
              {s.label}
            </button>
          ))}
        </div>
        <a className="int-guide" href={`${DOCS_URL}${sdk.guide}`} target="_blank" rel="noreferrer">
          {sdk.label} guide <span aria-hidden>↗</span>
        </a>
      </div>

      <ol className="int-steps">
        <li>
          <h3>Install</h3>
          <p className="muted small">{sdk.install.note}</p>
          <CodeBlock code={sdk.install.code} label={sdk.id === 'flutter' ? 'pubspec.yaml' : 'Terminal'} lang={sdk.install.lang} copy={copy} />
        </li>
        <li>
          <h3>Connect</h3>
          <p className="muted small">Your endpoint and key are filled in. The cached theme renders first, so apps never wait on the network.</p>
          <CodeBlock code={setup.code} label={setup.file} lang={setup.lang} copy={copy} />
        </li>
        <li>
          <h3>Use tokens</h3>
          <p className="muted small">Templates for each token category. Look up any single token in the reference below.</p>
          <div className="int-recipes" role="group" aria-label="Token category">
            {sdk.recipes.map((r, i) => (
              <button key={r.title} type="button" className={`chip-btn${r === active ? ' on' : ''}`} aria-pressed={r === active} onClick={() => setRecipe(i)}>
                {r.title}
              </button>
            ))}
          </div>
          <CodeBlock code={active.code} label={`${active.title} · ${sdk.label}`} lang={active.lang} copy={copy} />
        </li>
      </ol>

      <ComponentDocs sdk={sdk.id} sdkLabel={sdk.label} copy={copy} theme={theme} />

      <section className="int-section" aria-labelledby="int-ref">
        <div className="int-ref-head">
          <h3 id="int-ref">Token reference</h3>
          <span className="muted small">
            {rows.length} tokens · {ownCount} set by this client, the rest inherited
          </span>
        </div>
        <div className="int-filters">
          <label htmlFor={ids.search} className="sr-only">
            Search tokens
          </label>
          <input
            id={ids.search}
            type="search"
            placeholder="Search tokens, e.g. primary, radius, --dts-space"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
          <label className="int-only" htmlFor={ids.only}>
            <input id={ids.only} type="checkbox" checked={onlySet} onChange={(e) => setOnlySet(e.target.checked)} />
            Only tokens this client sets
          </label>
        </div>
        <div className="int-recipes" role="group" aria-label="Filter by category">
          {(['All', ...CATEGORIES] as const).map((c) => (
            <button key={c} type="button" className={`chip-btn${category === c ? ' on' : ''}`} aria-pressed={category === c} onClick={() => setCategory(c)}>
              {c}
            </button>
          ))}
        </div>

        {shown.length === 0 ? (
          <p className="int-empty muted">
            No tokens match{q ? ` “${query.trim()}”` : ''}
            {category !== 'All' ? ` in ${category}` : ''}.{' '}
            <button
              type="button"
              className="link-btn"
              onClick={() => {
                setQuery('');
                setCategory('All');
                setOnlySet(false);
              }}
            >
              Clear filters
            </button>
          </p>
        ) : (
          <div className="int-table-wrap">
            <table className="int-table">
              <thead>
                <tr>
                  <th scope="col">Token</th>
                  <th scope="col">Value</th>
                  <th scope="col">{sdk.label}</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((r) => (
                  <tr key={r.path}>
                    <td>
                      <code className="int-path">{dotted(r.path)}</code>
                      {r.set && <span className="pill ok int-set">Set here</span>}
                    </td>
                    <td className="int-value" data-label="Value">
                      {r.swatch ? (
                        <span className="int-swatches">
                          <span title={`Light ${r.value}`}>
                            <i style={{ background: r.swatch[0] }} aria-hidden />
                            {r.value}
                          </span>
                          <span title={`Dark ${r.dark}`}>
                            <i style={{ background: r.swatch[1] }} aria-hidden />
                            {r.dark}
                          </span>
                        </span>
                      ) : (
                        r.value
                      )}
                    </td>
                    <td data-label={sdk.label}>
                      <button type="button" className="int-access" onClick={() => copy(r.access[sdk.id], r.access[sdk.id])} title="Copy">
                        <code>{dotted(r.access[sdk.id])}</code>
                        <span className="sr-only">Copy</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="int-section" aria-labelledby="int-files">
        <h3 id="int-files">Static files</h3>
        <p className="muted small">
          Snapshots of the current values, for server-rendered pages, design tools or tests. Live apps should use an SDK so
          they pick up new versions.
        </p>
        <div className="int-downloads">
          <button type="button" className="btn small" onClick={() => download(`${slug}.css`, themeStylesheet(theme), 'text/css')}>
            Download CSS variables
          </button>
          <button type="button" className="btn small" onClick={() => download(`${slug}.theme.json`, JSON.stringify(theme, null, 2), 'application/json')}>
            Download theme JSON
          </button>
        </div>
      </section>

      <p className="sr-only" role="status" aria-live="polite">
        {message}
      </p>
      {message && (
        <div className="int-toast" aria-hidden>
          {message}
        </div>
      )}
    </div>
  );
}
