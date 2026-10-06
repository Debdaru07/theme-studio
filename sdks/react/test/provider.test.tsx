import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Theme } from '@dts/schema';
import acmeJson from '@dts/schema/fixtures/acme.json' with { type: 'json' };
import globexJson from '@dts/schema/fixtures/globex.json' with { type: 'json' };
import {
  createThemeClient,
  DEFAULT_THEME,
  memoryStorage,
  ThemeProvider,
  useBreakpoint,
  useMotion,
  useNavigationPattern,
  useTheme,
  useToken,
  type FetchLike,
  type MotionTokens,
  type ThemeContextValue,
} from '../src/index.ts';

const acme = acmeJson as unknown as Theme;
const globex = globexJson as unknown as Theme;

// ── Environment mocks ────────────────────────────────────────────────────────

const media = new Map<string, { matches: boolean; listeners: Set<() => void> }>();
function setMedia(query: string, matches: boolean) {
  const entry = media.get(query) ?? { matches, listeners: new Set() };
  entry.matches = matches;
  media.set(query, entry);
  for (const l of [...entry.listeners]) l();
}

class FakeResizeObserver {
  static instances: FakeResizeObserver[] = [];
  targets = new Set<Element>();
  constructor(private cb: ResizeObserverCallback) {
    FakeResizeObserver.instances.push(this);
  }
  observe(el: Element) {
    this.targets.add(el);
  }
  unobserve() {}
  disconnect() {
    this.targets.clear();
  }
  static resize(el: Element, width: number) {
    for (const ro of FakeResizeObserver.instances) {
      if (ro.targets.has(el)) ro.cb([{ target: el, contentRect: { width } } as ResizeObserverEntry], ro as never);
    }
  }
}

beforeEach(() => {
  media.clear();
  setMedia('(prefers-color-scheme: dark)', false);
  setMedia('(prefers-reduced-motion: reduce)', false);
  vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => {
    const entry = media.get(query) ?? { matches: false, listeners: new Set<() => void>() };
    media.set(query, entry);
    return {
      get matches() {
        return entry.matches;
      },
      media: query,
      addEventListener: (_: string, l: () => void) => entry.listeners.add(l),
      removeEventListener: (_: string, l: () => void) => entry.listeners.delete(l),
    } as unknown as MediaQueryList;
  });
  FakeResizeObserver.instances = [];
  (window as unknown as { ResizeObserver: unknown }).ResizeObserver = FakeResizeObserver;
  vi.stubGlobal('ResizeObserver', FakeResizeObserver);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

// ── Probes ───────────────────────────────────────────────────────────────────

let seen: ThemeContextValue | null = null;
let motion: MotionTokens | null = null;

function Probe() {
  seen = useTheme();
  motion = useMotion();
  const primary = useToken('color.primary');
  const md: number = useToken('spacing.scale.md');
  const bp = useBreakpoint();
  const nav = useNavigationPattern();
  return (
    <p data-testid="probe">
      {primary}|{md}|{bp}|{nav}
    </p>
  );
}

const probeText = () => screen.getByTestId('probe').textContent;

// ── Tests ────────────────────────────────────────────────────────────────────

describe('ThemeProvider', () => {
  it('scope="element" applies vars to the wrapper only', () => {
    render(
      <ThemeProvider theme={acme} scope="element" mode="light" className="preview" style={{ width: 390 }} loadFonts={false}>
        <Probe />
      </ThemeProvider>,
    );
    const wrapper = screen.getByTestId('probe').parentElement!;
    expect(wrapper.className).toBe('preview');
    expect(wrapper.style.getPropertyValue('--dts-color-primary')).toBe('#1D4ED8');
    expect(wrapper.style.width).toBe('390px');
    expect(wrapper.getAttribute('data-dts-mode')).toBe('light');
    expect(document.documentElement.style.getPropertyValue('--dts-color-primary')).toBe('');
    expect(seen?.rootElement).toBe(wrapper);
  });

  it('scope="root" applies vars to <html> and cleans up on unmount', () => {
    const { unmount } = render(
      <ThemeProvider theme={globex} mode="dark" loadFonts={false}>
        <Probe />
      </ThemeProvider>,
    );
    const html = document.documentElement;
    expect(html.style.getPropertyValue('--dts-color-primary')).toBe('#80D5CB');
    expect(html.getAttribute('data-dts-mode')).toBe('dark');
    unmount();
    expect(html.style.getPropertyValue('--dts-color-primary')).toBe('');
    expect(html.hasAttribute('data-dts-mode')).toBe(false);
  });

  it('propagates theme prop updates (admin live preview)', () => {
    const { rerender } = render(
      <ThemeProvider theme={acme} scope="element" mode="light" breakpoint="mobile" loadFonts={false}>
        <Probe />
      </ThemeProvider>,
    );
    const wrapper = screen.getByTestId('probe').parentElement!;
    expect(probeText()).toBe('#1D4ED8|12|mobile|bottomBar');

    const draft: Theme = { ...acme, color: { ...acme.color, light: { ...acme.color.light, primary: '#FF0000' } } };
    rerender(
      <ThemeProvider theme={draft} scope="element" mode="light" breakpoint="mobile" loadFonts={false}>
        <Probe />
      </ThemeProvider>,
    );
    expect(probeText()).toBe('#FF0000|12|mobile|bottomBar');
    expect(wrapper.style.getPropertyValue('--dts-color-primary')).toBe('#FF0000');

    rerender(
      <ThemeProvider theme={globex} scope="element" mode="dark" breakpoint="desktop" loadFonts={false}>
        <Probe />
      </ThemeProvider>,
    );
    expect(probeText()).toBe('#80D5CB|12|desktop|topTabs');
    expect(wrapper.getAttribute('data-dts-mode')).toBe('dark');
    expect(seen?.colors).toBe(globex.color.dark);
  });

  it('follows the system color scheme', () => {
    render(
      <ThemeProvider theme={acme} scope="element" loadFonts={false}>
        <Probe />
      </ThemeProvider>,
    );
    expect(seen?.mode).toBe('light');
    act(() => setMedia('(prefers-color-scheme: dark)', true));
    expect(seen?.mode).toBe('dark');
    expect(probeText()?.startsWith('#B7C4FF')).toBe(true);
  });

  it('container breakpoint + navigation pattern follow the scoped element width', () => {
    render(
      <ThemeProvider theme={acme} scope="element" mode="light" loadFonts={false}>
        <Probe />
      </ThemeProvider>,
    );
    const wrapper = screen.getByTestId('probe').parentElement!;
    act(() => FakeResizeObserver.resize(wrapper, 375));
    expect(probeText()).toBe('#1D4ED8|12|mobile|bottomBar');
    act(() => FakeResizeObserver.resize(wrapper, 768));
    expect(probeText()).toBe('#1D4ED8|12|tablet|rail');
    expect(wrapper.style.getPropertyValue('--dts-page-padding')).toBe('24px');
    act(() => FakeResizeObserver.resize(wrapper, 1280));
    expect(probeText()).toBe('#1D4ED8|12|desktop|sidebar');
  });

  it('uses the client and re-renders when the network theme arrives', async () => {
    let resolve!: () => void;
    const gate = new Promise<void>((r) => (resolve = r));
    const fetch: FetchLike = async () => {
      await gate;
      return { status: 200, ok: true, headers: { get: () => '"v1"' }, json: async () => globex };
    };
    const client = createThemeClient({ endpoint: 'http://localhost:8787', key: 'pk_demo_globex', storage: memoryStorage(), fetch });
    render(
      <ThemeProvider client={client} mode="light" breakpoint="mobile" loadFonts={false}>
        <Probe />
      </ThemeProvider>,
    );
    expect(seen?.theme).toBe(DEFAULT_THEME);
    expect(seen?.status).toBe('loading');
    await act(async () => {
      resolve();
      await client.load();
    });
    expect(seen?.status).toBe('ready');
    expect(seen?.source).toBe('network');
    expect(probeText()).toBe('#0F766E|12|mobile|drawer');
    expect(document.documentElement.style.getPropertyValue('--dts-color-primary')).toBe('#0F766E');
  });

  it('theme prop wins over the client', () => {
    const client = createThemeClient({
      endpoint: 'http://x',
      key: 'k',
      storage: memoryStorage(),
      fetch: async () => ({ status: 304, ok: false, headers: { get: () => null }, json: async () => null }),
    });
    render(
      <ThemeProvider client={client} theme={acme} mode="light" loadFonts={false}>
        <Probe />
      </ThemeProvider>,
    );
    expect(seen?.theme).toBe(acme);
    expect(seen?.source).toBe('prop');
  });

  it('useTheme throws outside a provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow(/inside <ThemeProvider>/);
  });
});

describe('useMotion', () => {
  it('returns durations, easings and page transition', () => {
    render(
      <ThemeProvider theme={acme} mode="light" loadFonts={false}>
        <Probe />
      </ThemeProvider>,
    );
    expect(motion?.duration).toEqual({ short: 150, medium: 250, long: 400 });
    expect(motion?.easingCss.standard).toBe('cubic-bezier(0.2, 0, 0, 1)');
    expect(motion?.pageTransition).toBe('slide');
    expect(motion?.reduced).toBe(false);
  });

  it('respects prefers-reduced-motion when the theme opts in', () => {
    setMedia('(prefers-reduced-motion: reduce)', true);
    render(
      <ThemeProvider theme={globex} mode="light" loadFonts={false}>
        <Probe />
      </ThemeProvider>,
    );
    expect(motion?.reduced).toBe(true);
    expect(motion?.duration.medium).toBe(0);
    expect(motion?.pageTransition).toBe('none');
    act(() => setMedia('(prefers-reduced-motion: reduce)', false));
    expect(motion?.pageTransition).toBe('fade');
    expect(motion?.duration.medium).toBe(300);
  });
});
