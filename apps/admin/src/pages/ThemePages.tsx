import { useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import { useAuth } from '../auth.tsx';
import { TopBar } from '../components/TopBar.tsx';
import { EditorContext } from '../editor/fields.tsx';
import { ContrastPanel, SECTIONS } from '../editor/sections.tsx';
import { useThemeEditor, type OwnerKind, type ThemeEditor } from '../editor/useThemeEditor.ts';
import { Integrate } from '../integrate/Integrate.tsx';
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
      <div className="page editor-page" data-pane={pane} data-view={tab === 'integrate' ? 'integrate' : undefined}>
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
