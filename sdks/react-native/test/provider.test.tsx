import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { __mock } from 'react-native';
import type { Theme } from '@dts/schema';
import acmeJson from '@dts/schema/fixtures/acme.json' with { type: 'json' };
import globexJson from '@dts/schema/fixtures/globex.json' with { type: 'json' };
import {
  createThemeClient,
  DEFAULT_THEME,
  ThemeProvider,
  useBreakpoint,
  useMotion,
  useNavigationPattern,
  useTheme,
  useToken,
  type FetchLike,
  type MotionTokens,
  type NativeThemeContextValue,
  type ThemeStorage,
} from '../src/index.ts';

const acme = acmeJson as unknown as Theme;
const globex = globexJson as unknown as Theme;

let ctx: NativeThemeContextValue | null = null;
let bp: string | null = null;
let nav: string | null = null;
let primary: string | null = null;
let motion: MotionTokens | null = null;

function Probe() {
  ctx = useTheme();
  bp = useBreakpoint();
  nav = useNavigationPattern();
  primary = useToken('color.primary');
  motion = useMotion();
  return null;
}

beforeEach(() => __mock.reset());
afterEach(() => {
  cleanup();
  ctx = bp = nav = primary = null;
  motion = null;
});

/** AsyncStorage-shaped adapter (async getItem/setItem). */
function asyncStorage(initial: Record<string, string> = {}): ThemeStorage & { data: Map<string, string> } {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: async (k) => data.get(k) ?? null,
    setItem: async (k, v) => {
      data.set(k, v);
    },
  };
}

describe('ThemeProvider (react-native)', () => {
  it('follows useColorScheme in system mode', () => {
    render(
      <ThemeProvider theme={acme}>
        <Probe />
      </ThemeProvider>,
    );
    expect(ctx?.mode).toBe('light');
    expect(ctx?.colors.primary).toBe('#1D4ED8');
    act(() => __mock.set({ colorScheme: 'dark' }));
    expect(ctx?.mode).toBe('dark');
    expect(primary).toBe('#B7C4FF');
    act(() => __mock.set({ colorScheme: null }));
    expect(ctx?.mode).toBe('light');
  });

  it('explicit mode overrides the system scheme', () => {
    __mock.set({ colorScheme: 'light' });
    render(
      <ThemeProvider theme={globex} mode="dark">
        <Probe />
      </ThemeProvider>,
    );
    expect(ctx?.colors).toBe(globex.color.dark);
  });

  it('breakpoint + navigation pattern come from window width', () => {
    render(
      <ThemeProvider theme={acme} mode="light">
        <Probe />
      </ThemeProvider>,
    );
    expect([bp, nav]).toEqual(['mobile', 'bottomBar']);
    act(() => __mock.set({ window: { width: 834, height: 1194, scale: 2, fontScale: 1 } }));
    expect([bp, nav]).toEqual(['tablet', 'rail']);
    act(() => __mock.set({ window: { width: 1366, height: 1024, scale: 2, fontScale: 1 } }));
    expect([bp, nav]).toEqual(['desktop', 'sidebar']);
  });

  it('loads from the client with async storage: cache first, then network', async () => {
    const storage = asyncStorage({ 'dts:theme:pk_demo_acme': JSON.stringify({ etag: '"a"', theme: acme }) });
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    const fetch: FetchLike = async (_url, init) => {
      expect(init?.headers?.['If-None-Match']).toBe('"a"');
      await gate;
      return { status: 200, ok: true, headers: { get: () => '"b"' }, json: async () => globex };
    };
    const client = createThemeClient({ endpoint: 'http://localhost:8787', key: 'pk_demo_acme', storage, fetch });

    render(
      <ThemeProvider client={client} mode="light">
        <Probe />
      </ThemeProvider>,
    );
    expect(ctx?.theme).toBe(DEFAULT_THEME);
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(ctx?.theme.assets.appName).toBe('Acme Fleet');
    expect(ctx?.source).toBe('cache');

    await act(async () => {
      release();
      await client.load();
    });
    expect(ctx?.theme.assets.appName).toBe('Globex Care');
    expect(ctx?.status).toBe('ready');
    expect(JSON.parse(storage.data.get('dts:theme:pk_demo_acme')!).etag).toBe('"b"');
  });

  it('useMotion follows AccessibilityInfo reduce-motion', async () => {
    render(
      <ThemeProvider theme={acme} mode="light">
        <Probe />
      </ThemeProvider>,
    );
    await act(async () => {});
    expect(motion?.pageTransition).toBe('slide');
    act(() => __mock.set({ reduceMotion: true }));
    expect(motion?.pageTransition).toBe('none');
    expect(motion?.duration.long).toBe(0);
  });

  it('useTheme throws outside the provider', () => {
    const orig = console.error;
    console.error = () => {};
    try {
      expect(() => render(<Probe />)).toThrow(/inside <ThemeProvider>/);
    } finally {
      console.error = orig;
    }
  });
});
