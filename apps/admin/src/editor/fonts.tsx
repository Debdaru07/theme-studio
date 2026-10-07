import { useEffect, useMemo, useRef, useState } from 'react';
import FONTS from './google-fonts.json';
import { LockIcon, useField } from './fields.tsx';

export type FontCategory = 'sans' | 'serif' | 'display' | 'handwriting' | 'mono';

export interface FontInfo {
  /** family */
  f: string;
  /** category */
  c: FontCategory;
  /** available weights (100–900) */
  w: number[];
  /** has italics */
  i: boolean;
}

const ALL = FONTS as FontInfo[];
const BY_NAME = new Map(ALL.map((f) => [f.f.toLowerCase(), f]));
const ALL_WEIGHTS = [100, 200, 300, 400, 500, 600, 700, 800, 900];

/** Google Fonts metadata for a family, or undefined for a family not in the catalog. */
export function fontInfo(family: string | undefined): FontInfo | undefined {
  return family ? BY_NAME.get(family.toLowerCase()) : undefined;
}

export function availableWeights(family: string | undefined): number[] {
  return fontInfo(family)?.w ?? ALL_WEIGHTS;
}

const CATEGORIES: { id: FontCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'sans', label: 'Sans' },
  { id: 'serif', label: 'Serif' },
  { id: 'display', label: 'Display' },
  { id: 'handwriting', label: 'Script' },
  { id: 'mono', label: 'Mono' },
];

const loaded = new Set<string>();

/** Loads just the glyphs needed to render a family's own name, so previews stay cheap. */
function usePreviewFont(family: string) {
  useEffect(() => {
    if (loaded.has(family)) return;
    loaded.add(family);
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, '+')}&text=${encodeURIComponent(family + 'Aa')}&display=swap`;
    document.head.appendChild(link);
  }, [family]);
}

function FontOption({ font, selected, onPick }: { font: FontInfo; selected: boolean; onPick(): void }) {
  usePreviewFont(font.f);
  return (
    <button type="button" role="option" aria-selected={selected} className={`font-option ${selected ? 'on' : ''}`} onClick={onPick}>
      <span className="font-name" style={{ fontFamily: `'${font.f}', system-ui` }}>
        {font.f}
      </span>
      <span className="muted small">
        {font.w.length} weight{font.w.length === 1 ? '' : 's'}
        {font.i ? ' · italic' : ''}
      </span>
    </button>
  );
}

const PAGE = 60;

/** Searchable Google Fonts picker bound to a font family token. */
export function FontPicker({ path, label, hint }: { path: string; label: string; hint?: string }) {
  const f = useField<string>(path);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<FontCategory | 'all'>('all');
  const [limit, setLimit] = useState(PAGE);
  const root = useRef<HTMLDivElement>(null);
  const current = f.value ?? '';
  const info = fontInfo(current);

  usePreviewFont(current);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ALL.filter((font) => (category === 'all' || font.c === category) && (!q || font.f.toLowerCase().includes(q)));
  }, [query, category]);

  useEffect(() => setLimit(PAGE), [query, category]);

  const pick = (family: string) => {
    f.set(family);
    setOpen(false);
    setQuery('');
  };
  const exact = query.trim() && !fontInfo(query.trim());

  return (
    <div className={`tf ${f.locked ? 'locked' : ''} ${f.issue ? 'invalid' : ''}`} title={f.lockedReason} ref={root}>
      <div className="tf-label">
        <span>{label}</span>
        {f.locked && <LockIcon label={f.lockedReason} />}
        {f.overridden && !f.locked && (
          <button type="button" className="reset" onClick={f.reset} title="Reset to inherited value" aria-label={`Reset ${label}`}>
            Reset
          </button>
        )}
      </div>
      <button
        type="button"
        className="font-trigger"
        disabled={f.locked}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span style={{ fontFamily: `'${current}', system-ui` }}>{current || 'Choose a font'}</span>
        <span aria-hidden>▾</span>
      </button>
      <div className="tf-hint">
        {info ? `${categoryLabel(info.c)} · ${info.w.length} weights${info.i ? ' · italic' : ''}` : current ? 'Not in Google Fonts — uses the name as-is' : hint}
      </div>

      {open && (
        <div className="font-popover" role="dialog" aria-label={`Choose ${label}`}>
          <input autoFocus placeholder={`Search ${ALL.length.toLocaleString()} Google Fonts…`} value={query} onChange={(e) => setQuery(e.target.value)} />
          <div className="segmented font-cats">
            {CATEGORIES.map((c) => (
              <button key={c.id} type="button" className={category === c.id ? 'on' : ''} onClick={() => setCategory(c.id)}>
                {c.label}
              </button>
            ))}
          </div>
          <div className="font-list" role="listbox">
            {matches.slice(0, limit).map((font) => (
              <FontOption key={font.f} font={font} selected={font.f === current} onPick={() => pick(font.f)} />
            ))}
            {matches.length > limit && (
              <button type="button" className="btn ghost small block" onClick={() => setLimit((l) => l + PAGE)}>
                Show more ({(matches.length - limit).toLocaleString()} left)
              </button>
            )}
            {matches.length === 0 && <p className="muted small">No Google Fonts match “{query}”.</p>}
          </div>
          {exact && (
            <button type="button" className="btn ghost small block" onClick={() => pick(query.trim())}>
              Use “{query.trim()}” anyway
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function categoryLabel(c: FontCategory) {
  return CATEGORIES.find((x) => x.id === c)?.label ?? c;
}
