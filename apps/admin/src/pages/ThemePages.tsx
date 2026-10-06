import { leafPaths } from '@dts/schema';
import { useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import { API_URL } from '../api.ts';
import { useAuth } from '../auth.tsx';
import { TopBar } from '../components/TopBar.tsx';
import { EditorContext } from '../editor/fields.tsx';
import { ContrastPanel, SECTIONS } from '../editor/sections.tsx';
import { useThemeEditor, type OwnerKind, type ThemeEditor } from '../editor/useThemeEditor.ts';
import { Preview } from '../preview/Preview.tsx';

export function TenantThemePage() {
  return <EditorPage kind="tenant" id={useParams().id!} />;
}

export function ClientThemePage() {
  return <EditorPage kind="client" id={useParams().id!} />;
}

type Tab = (typeof SECTIONS)[number]['id'] | 'history' | 'integrate';

function EditorPage({ kind, id }: { kind: OwnerKind; id: string }) {
  const ed = useThemeEditor(kind, id);
  const [tab, setTab] = useState<Tab>('colors');
  const [publishing, setPublishing] = useState(false);
  /** Compact layouts (phones, short landscape) show one pane at a time; wider layouts ignore this. */
  const [pane, setPane] = useState<'edit' | 'preview'>('edit');
  const panel = useRef<HTMLDivElement>(null);

  const selectTab = (t: Tab) => {
    setTab(t);
    panel.current?.scrollTo({ top: 0 });
  };

  if (ed.state.error) return <ErrorPage message={ed.state.error.message} />;
  if (!ed.state.data || !ed.layer || !ed.resolved.theme) {
    return (
      <div className="page">
        <TopBar />
        <p className="center muted">Loading theme…</p>
      </div>
    );
  }

  const name = kind === 'client' ? ed.state.data.client?.name : `${ed.state.data.tenant?.name} · Base theme`;
  const section = SECTIONS.find((s) => s.id === tab);
  const blocked = !ed.resolved.contrast?.publishable || ed.resolved.issues.length > 0;

  return (
    <EditorContext.Provider value={ed}>
      <div className="page editor-page" data-pane={pane}>
        <TopBar>
          <div className="editor-title">
            <Link to="/" className="back-link" aria-label="All clients">
              <span aria-hidden>←</span>
              <span className="back-label">All clients</span>
            </Link>
            <strong title={name}>{name}</strong>
            <SaveBadge ed={ed} />
          </div>
          <button className="btn primary publish-btn" onClick={() => setPublishing(true)} disabled={ed.changes.length === 0 || ed.saveStatus === 'saving'}>
            Publish{ed.changes.length ? ` (${ed.changes.length})` : ''}
          </button>
        </TopBar>

        <div className="editor-grid">
          <nav className="editor-tabs" aria-label="Theme categories">
            {SECTIONS.map((s) => (
              <button key={s.id} className={tab === s.id ? 'on' : ''} aria-current={tab === s.id ? 'page' : undefined} onClick={() => selectTab(s.id)}>
                {s.title}
                {sectionChanged(ed, s.paths) && <span className="dot" title="Unpublished changes" />}
              </button>
            ))}
            <hr />
            <button className={tab === 'history' ? 'on' : ''} aria-current={tab === 'history' ? 'page' : undefined} onClick={() => selectTab('history')}>
              History
            </button>
            {kind === 'client' && (
              <button className={tab === 'integrate' ? 'on' : ''} aria-current={tab === 'integrate' ? 'page' : undefined} onClick={() => selectTab('integrate')}>
                Integrate
              </button>
            )}
          </nav>

          <div className="editor-panel" ref={panel}>
            {kind === 'tenant' && (
              <div className="notice info small">
                Base theme for every client of this agency. Clients inherit these values and can override brand,
                layout and style tokens.
              </div>
            )}
            {section && (
              <>
                <h2>{section.title}</h2>
                {section.render()}
              </>
            )}
            {tab === 'history' && <History ed={ed} />}
            {tab === 'integrate' && <Integrate ed={ed} />}
          </div>

          <div className="editor-preview">
            <Preview theme={ed.resolved.theme} />
          </div>
        </div>

        <nav className="pane-switch" aria-label="Editor view">
          <button aria-pressed={pane === 'edit'} className={pane === 'edit' ? 'on' : ''} onClick={() => setPane('edit')}>
            <span aria-hidden>✎</span> Edit
          </button>
          <button aria-pressed={pane === 'preview'} className={pane === 'preview' ? 'on' : ''} onClick={() => setPane('preview')}>
            <span aria-hidden>▢</span> Preview
          </button>
        </nav>

        {publishing && <PublishDialog ed={ed} blocked={blocked} onClose={() => setPublishing(false)} />}
      </div>
    </EditorContext.Provider>
  );
}

function sectionChanged(ed: ThemeEditor, prefixes: string[]) {
  return ed.changes.some((c) => prefixes.some((p) => c.path === p || c.path.startsWith(`${p}.`)));
}

function SaveBadge({ ed }: { ed: ThemeEditor }) {
  const label = {
    idle: ed.changes.length ? 'Draft saved' : 'Up to date',
    saving: 'Saving…',
    saved: 'Draft saved',
    error: ed.saveError ?? 'Not saved',
  }[ed.saveStatus];
  return <span className={`pill ${ed.saveStatus === 'error' ? 'error' : ed.changes.length ? 'warn' : 'ok'}`}>{label}</span>;
}

function PublishDialog({ ed, blocked, onClose }: { ed: ThemeEditor; blocked: boolean; onClose(): void }) {
  const [note, setNote] = useState('');
  const isTenant = ed.kind === 'tenant';
  const fmt = (v: unknown) => (v === undefined ? 'inherited' : typeof v === 'string' ? v : JSON.stringify(v));
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal onClick={(e) => e.stopPropagation()}>
        <h2>Publish changes</h2>
        {isTenant && (
          <p className="notice info small">Publishing the base theme updates every client that inherits from it.</p>
        )}
        <ContrastPanel />
        {ed.resolved.issues.length > 0 && (
          <div className="notice error">
            {ed.resolved.issues.map((i) => (
              <div key={i.path}>
                {i.path}: {i.message}
              </div>
            ))}
          </div>
        )}
        <div className="changes">
          {ed.changes.map((c) => (
            <div key={c.path} className="change">
              <code>{c.path}</code>
              <span className="muted">{fmt(c.from)}</span>
              <span>→</span>
              <span>{fmt(c.to)}</span>
            </div>
          ))}
        </div>
        <label className="field">
          <span>Note (optional)</span>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Spring rebrand" />
        </label>
        {ed.publish.error && <p className="error-text">{ed.publish.error.message}</p>}
        <div className="modal-actions">
          <button className="btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn primary"
            disabled={blocked || ed.publish.isPending}
            onClick={() => ed.publish.mutate(note, { onSuccess: onClose })}
          >
            {ed.publish.isPending ? 'Publishing…' : 'Publish now'}
          </button>
        </div>
      </div>
    </div>
  );
}

function History({ ed }: { ed: ThemeEditor }) {
  const versions = ed.versions.data?.versions ?? [];
  const current = versions[0]?.version;
  return (
    <>
      <h2>History</h2>
      {versions.length === 0 && <p className="muted">Nothing published yet.</p>}
      <ol className="history">
        {versions.map((v) => (
          <li key={v.version}>
            <div>
              <strong>v{v.version}</strong> {v.version === current && <span className="pill ok">Live</span>}
              <div className="small">{v.note ?? <span className="muted">No note</span>}</div>
              <div className="muted small">
                {new Date(v.publishedAt).toLocaleString()} · {v.publishedBy ?? 'system'}
              </div>
            </div>
            {ed.kind === 'client' && v.version !== current && (
              <button
                className="btn ghost small"
                disabled={ed.rollback.isPending}
                onClick={() => confirm(`Publish v${v.version} again as the live theme?`) && ed.rollback.mutate(v.version)}
              >
                Restore
              </button>
            )}
          </li>
        ))}
      </ol>
      {ed.rollback.error && <p className="error-text">{ed.rollback.error.message}</p>}
    </>
  );
}

const SNIPPETS = {
  Flutter: (endpoint: string, key: string) => `import 'package:dynamic_theme/dynamic_theme.dart';
import 'package:flutter/material.dart';

final client = DynamicThemeClient('${endpoint}', '${key}');

void main() => runApp(DynamicThemeApp(
      client: client, // cached theme first, then live updates
      pollInterval: const Duration(minutes: 5),
      home: const HomePage(),
    ));

// Anywhere below: Theme.of(context) for Material,
// context.dt.spacing.md, context.dt.colors.success, DtAdaptiveScaffold, DtButton…`,
  Web: (endpoint: string, key: string) => `import { createThemeClient, applyTheme } from '@dts/web';

const client = createThemeClient({ endpoint: '${endpoint}', key: '${key}' });
const theme = await client.load();
applyTheme(theme, { mode: 'system', breakpoint: 'auto' });
client.subscribe((t) => applyTheme(t, { mode: 'system', breakpoint: 'auto' }));

/* CSS */
.button { background: var(--dts-color-primary); border-radius: var(--dts-button-radius); }`,
  React: (endpoint: string, key: string) => `import { createThemeClient } from '@dts/web';
import { ThemeProvider, useTheme } from '@dts/react';

const client = createThemeClient({ endpoint: '${endpoint}', key: '${key}' });

export function App() {
  return (
    <ThemeProvider client={client} mode="system">
      <Routes />
    </ThemeProvider>
  );
}`,
  'React Native': (endpoint: string, key: string) => `import AsyncStorage from '@react-native-async-storage/async-storage';
import { createThemeClient } from '@dts/web';
import { ThemeProvider, useTheme, textStyle } from '@dts/react-native';

const client = createThemeClient({ endpoint: '${endpoint}', key: '${key}', storage: AsyncStorage });

export default () => (
  <ThemeProvider client={client}>
    <Navigation />
  </ThemeProvider>
);`,
} as const;

function Integrate({ ed }: { ed: ThemeEditor }) {
  const client = ed.state.data?.client;
  const [lang, setLang] = useState<keyof typeof SNIPPETS>('Flutter');
  if (!client) return null;
  const code = SNIPPETS[lang](API_URL, client.publishableKey);
  return (
    <>
      <h2>Integrate</h2>
      <p className="muted small">Apps fetch the live theme with this publishable key. It is safe to ship in client apps.</p>
      <div className="key-row">
        <code>{client.publishableKey}</code>
        <button className="btn ghost small" onClick={() => navigator.clipboard?.writeText(client.publishableKey)}>
          Copy
        </button>
      </div>
      <div className="segmented wide">
        {(Object.keys(SNIPPETS) as (keyof typeof SNIPPETS)[]).map((l) => (
          <button key={l} className={lang === l ? 'on' : ''} onClick={() => setLang(l)}>
            {l}
          </button>
        ))}
      </div>
      <pre className="code">{code}</pre>
      <button className="btn ghost small" onClick={() => navigator.clipboard?.writeText(code)}>
        Copy snippet
      </button>
      <p className="muted small">
        This theme sets {leafPaths(ed.layer).length} tokens; everything else is inherited from the agency base theme.
      </p>
    </>
  );
}

function ErrorPage({ message }: { message: string }) {
  const { user } = useAuth();
  return (
    <div className="page">
      <TopBar />
      <div className="center">
        <p className="error-text">{message}</p>
        {user && <Link to="/">Back</Link>}
      </div>
    </div>
  );
}
