import {
  PLATFORM_DEFAULTS,
  ThemeValidationError,
  canEdit,
  deepMerge,
  getPath,
  leafPaths,
  resolveTheme,
  setPath,
  validateLayerChange,
  type ComponentReport,
  type ContrastReport,
  type Layer,
  type Theme,
  type ThemeInput,
  type ThemeIssue,
} from '@debdaru07/schema';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { api, type Role, type ThemeState, type VersionSummary } from '../api.ts';
import { useAuth } from '../auth.tsx';

/** Mirrors the server: editors act at their role's level, whichever theme they edit. */
const EDITOR_LAYER: Record<Role, Layer> = { platform_admin: 'platform', tenant_admin: 'tenant', client_editor: 'client' };

export type OwnerKind = 'tenant' | 'client';
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface ResolveState {
  /** Last theme that resolved successfully — the preview keeps showing it while a field is invalid. */
  theme: Theme | null;
  contrast: ContrastReport | null;
  /** Component tuning guardrails (errors block publishing, like contrast). */
  components: ComponentReport | null;
  issues: ThemeIssue[];
}

export interface Change {
  path: string;
  from: unknown;
  to: unknown;
}

/**
 * Editor state for a tenant base theme or a client theme. The draft is resolved locally on every
 * change (same resolver as the server) so the preview is instant; the server re-validates on save.
 */
export function useThemeEditor(kind: OwnerKind, id: string) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const base = `/${kind === 'tenant' ? 'tenants' : 'clients'}/${id}/theme`;
  const policy: Layer = EDITOR_LAYER[user?.role ?? 'client_editor'];

  const state = useQuery({ queryKey: ['theme', kind, id], queryFn: () => api<ThemeState>(base) });
  const versions = useQuery({
    queryKey: ['versions', kind, id],
    queryFn: () => api<{ versions: VersionSummary[] }>(`${base}/versions`),
  });

  const [layer, setLayerState] = useState<ThemeInput | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const lastSaved = useRef<string | null>(null);

  // Adopt the server draft on first load and after publish/rollback.
  useEffect(() => {
    if (!state.data) return;
    const json = JSON.stringify(state.data.draft);
    if (lastSaved.current === null || lastSaved.current !== json) {
      setLayerState(state.data.draft);
      lastSaved.current = json;
    }
  }, [state.data]);

  const layers = useMemo<ThemeInput[]>(
    () => (layer ? (state.data?.base ? [state.data.base, layer] : [layer]) : []),
    [layer, state.data?.base],
  );

  const lastGood = useRef<Theme | null>(null);
  const resolved = useMemo<ResolveState>(() => {
    if (!layer) return { theme: null, contrast: null, components: null, issues: [] };
    // Only tokens changed since the last save need the editor's permission (same rule as the server).
    const issues = validateLayerChange(state.data?.draft ?? {}, layer, policy);
    try {
      const r = resolveTheme(layers);
      lastGood.current = r.theme;
      return { theme: r.theme, contrast: r.contrast, components: r.components, issues };
    } catch (e) {
      if (e instanceof ThemeValidationError) return { theme: lastGood.current, contrast: null, components: null, issues: [...issues, ...e.issues] };
      throw e;
    }
  }, [layer, layers, policy, state.data?.draft]);

  /** Platform defaults + base + draft, unresolved: used to show seeds and `{refs}` in fields. */
  const merged = useMemo(() => deepMerge<ThemeInput>(PLATFORM_DEFAULTS, ...layers), [layers]);

  // ── Autosave ───────────────────────────────────────────────────────────────

  const save = useMutation({
    mutationFn: (l: ThemeInput) => api(`${base}/draft`, { method: 'PUT', body: { layer: l } }),
  });

  useEffect(() => {
    if (!layer) return;
    const json = JSON.stringify(layer);
    if (json === lastSaved.current) return;
    if (resolved.issues.length) {
      setSaveStatus('error');
      setSaveError('Fix the highlighted fields to save');
      return;
    }
    setSaveStatus('saving');
    const t = setTimeout(() => {
      save.mutate(layer, {
        onSuccess: () => {
          lastSaved.current = json;
          setSaveStatus('saved');
          setSaveError(null);
          qc.setQueryData<ThemeState>(['theme', kind, id], (s) =>
            s ? { ...s, draft: layer, hasUnpublishedChanges: true } : s,
          );
        },
        onError: (e) => {
          setSaveStatus('error');
          setSaveError(e.message);
        },
      });
    }, 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layer, resolved.issues.length]);

  // ── Publish / rollback ─────────────────────────────────────────────────────

  const refresh = () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ['theme', kind, id] }),
      qc.invalidateQueries({ queryKey: ['versions', kind, id] }),
      qc.invalidateQueries({ queryKey: ['clients'] }),
    ]);

  const publish = useMutation({
    mutationFn: (note: string) => api(`${base}/publish`, { method: 'POST', body: { note: note || undefined } }),
    onSuccess: refresh,
  });

  const rollback = useMutation({
    mutationFn: (version: number) => api(`${base}/versions/${version}/rollback`, { method: 'POST' }),
    onSuccess: () => {
      lastSaved.current = null; // adopt the rolled-back draft
      return refresh();
    },
  });

  const changes = useMemo<Change[]>(() => {
    if (!layer) return [];
    const before = state.data?.publishedLayer ?? {};
    const paths = new Set([...leafPaths(before), ...leafPaths(layer)]);
    return [...paths]
      .sort()
      .map((path) => ({ path, from: getPath(before, path), to: getPath(layer, path) }))
      .filter((c) => JSON.stringify(c.from) !== JSON.stringify(c.to));
  }, [layer, state.data?.publishedLayer]);

  /**
   * Reverts unpublished changes back to the published version: all of them, or only [paths]. Tokens this editor
   * may not change (e.g. an agency's edit on a client theme, seen by a client editor) are kept, because the server
   * would reject reverting them. Autosave then stores the reverted draft.
   */
  const discard = (paths?: string[]) => {
    if (!layer) return { reverted: 0, kept: 0 };
    const targets = changes.filter((c) => !paths || paths.includes(c.path));
    let next: ThemeInput = layer;
    let reverted = 0;
    for (const c of targets) {
      if (!canEdit(policy, c.path)) continue;
      next = setPath(next, c.path, c.from);
      reverted++;
    }
    if (reverted) setLayerState(next);
    return { reverted, kept: targets.length - reverted };
  };

  return {
    kind,
    id,
    policy,
    state,
    versions,
    layer,
    setLayer: setLayerState,
    resolved,
    merged,
    saveStatus,
    saveError,
    changes,
    flushPending: saveStatus === 'saving',
    publish,
    rollback,
    discard,
  };
}

export type ThemeEditor = ReturnType<typeof useThemeEditor>;
