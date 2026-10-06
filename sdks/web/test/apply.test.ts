import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { applyTheme, googleFontsUrls, type AppliedThemeState } from '../src/index.ts';
import { acme, globex } from './fixtures.ts';

// Controllable ResizeObserver so we can simulate preview frames of different widths.
class FakeResizeObserver {
  static instances: FakeResizeObserver[] = [];
  targets = new Set<Element>();
  disconnected = false;
  constructor(private cb: ResizeObserverCallback) {
    FakeResizeObserver.instances.push(this);
  }
  observe(el: Element) {
    this.targets.add(el);
  }
  unobserve(el: Element) {
    this.targets.delete(el);
  }
  disconnect() {
    this.disconnected = true;
    this.targets.clear();
  }
  static resize(el: Element, width: number) {
    for (const ro of FakeResizeObserver.instances) {
      if (!ro.targets.has(el)) continue;
      ro.cb([{ target: el, contentRect: { width } as DOMRectReadOnly } as ResizeObserverEntry], ro as unknown as ResizeObserver);
    }
  }
}

function mockColorScheme(dark: boolean) {
  const listeners = new Set<(e: { matches: boolean }) => void>();
  const mql = {
    matches: dark,
    media: '(prefers-color-scheme: dark)',
    addEventListener: (_: string, l: (e: { matches: boolean }) => void) => listeners.add(l),
    removeEventListener: (_: string, l: (e: { matches: boolean }) => void) => listeners.delete(l),
  };
  vi.spyOn(window, 'matchMedia').mockImplementation(() => mql as unknown as MediaQueryList);
  return {
    listeners,
    set(next: boolean) {
      mql.matches = next;
      for (const l of [...listeners]) l({ matches: next });
    },
  };
}

beforeEach(() => {
  FakeResizeObserver.instances = [];
  vi.stubGlobal('ResizeObserver', FakeResizeObserver);
  (window as unknown as { ResizeObserver: unknown }).ResizeObserver = FakeResizeObserver;
  document.head.innerHTML = '';
  document.body.innerHTML = '';
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('applyTheme', () => {
  it('scopes vars and attributes to an element, leaving <html> untouched', () => {
    const pane = document.createElement('div');
    document.body.appendChild(pane);
    const dispose = applyTheme(acme, { root: pane, mode: 'dark', breakpoint: 'desktop', loadFonts: false });

    expect(pane.style.getPropertyValue('--dts-color-primary')).toBe('#B7C4FF');
    expect(pane.style.getPropertyValue('--dts-page-padding')).toBe('32px');
    expect(pane.getAttribute('data-dts-mode')).toBe('dark');
    expect(pane.getAttribute('data-dts-breakpoint')).toBe('desktop');
    expect(document.documentElement.style.getPropertyValue('--dts-color-primary')).toBe('');
    expect(document.documentElement.hasAttribute('data-dts-mode')).toBe(false);
    dispose();
  });

  it('two scoped previews can show different themes side by side', () => {
    const a = document.createElement('div');
    const b = document.createElement('div');
    const da = applyTheme(acme, { root: a, mode: 'light', breakpoint: 'mobile', loadFonts: false });
    const db = applyTheme(globex, { root: b, mode: 'light', breakpoint: 'mobile', loadFonts: false });
    expect(a.style.getPropertyValue('--dts-color-primary')).toBe('#1D4ED8');
    expect(b.style.getPropertyValue('--dts-color-primary')).toBe('#0F766E');
    da();
    db();
  });

  it('dispose removes every var, attribute and listener', () => {
    const scheme = mockColorScheme(false);
    const pane = document.createElement('div');
    pane.style.setProperty('color', 'red');
    const dispose = applyTheme(acme, { root: pane, mode: 'system', loadFonts: false });
    expect(scheme.listeners.size).toBe(1);
    expect(FakeResizeObserver.instances).toHaveLength(1);

    dispose();

    expect([...Array(pane.style.length).keys()].map((i) => pane.style.item(i)).filter((p) => p.startsWith('--dts-'))).toEqual([]);
    expect(pane.style.getPropertyValue('--dts-color-primary')).toBe('');
    expect(pane.style.getPropertyValue('color')).toBe('red');
    expect(pane.hasAttribute('data-dts-mode')).toBe(false);
    expect(pane.hasAttribute('data-dts-breakpoint')).toBe(false);
    expect(scheme.listeners.size).toBe(0);
    expect(FakeResizeObserver.instances[0]?.disconnected).toBe(true);
    dispose(); // idempotent
  });

  it('follows prefers-color-scheme in system mode', () => {
    const scheme = mockColorScheme(false);
    const pane = document.createElement('div');
    const onChange = vi.fn<(s: AppliedThemeState) => void>();
    const dispose = applyTheme(acme, { root: pane, mode: 'system', breakpoint: 'mobile', loadFonts: false, onChange });
    expect(pane.getAttribute('data-dts-mode')).toBe('light');
    expect(pane.style.getPropertyValue('--dts-color-primary')).toBe('#1D4ED8');

    scheme.set(true);
    expect(pane.getAttribute('data-dts-mode')).toBe('dark');
    expect(pane.style.getPropertyValue('--dts-color-primary')).toBe('#B7C4FF');
    expect(pane.style.getPropertyValue('color-scheme')).toBe('dark');
    expect(onChange.mock.calls.map(([s]) => s.mode)).toEqual(['light', 'dark']);
    dispose();
  });

  it('breakpoint "auto" tracks the element width (preview frames)', () => {
    const frame = document.createElement('div');
    document.body.appendChild(frame);
    const onChange = vi.fn<(s: AppliedThemeState) => void>();
    const dispose = applyTheme(acme, { root: frame, mode: 'light', breakpoint: 'auto', loadFonts: false, onChange });

    FakeResizeObserver.resize(frame, 390);
    expect(frame.getAttribute('data-dts-breakpoint')).toBe('mobile');
    expect(frame.style.getPropertyValue('--dts-page-padding')).toBe('16px');
    expect(frame.style.getPropertyValue('--dts-content-max-width')).toBe('none');

    FakeResizeObserver.resize(frame, 820);
    expect(frame.getAttribute('data-dts-breakpoint')).toBe('tablet');
    expect(frame.style.getPropertyValue('--dts-page-padding')).toBe('24px');

    FakeResizeObserver.resize(frame, 1280);
    expect(frame.getAttribute('data-dts-breakpoint')).toBe('desktop');
    expect(frame.style.getPropertyValue('--dts-content-max-width')).toBe('1200px');
    expect(onChange.mock.calls.at(-1)?.[0]).toEqual({ mode: 'light', breakpoint: 'desktop', width: 1280 });
    dispose();
  });

  it('applies to <html> by default and uses the window width', () => {
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1500);
    const dispose = applyTheme(globex, { mode: 'light', loadFonts: false });
    const html = document.documentElement;
    expect(html.style.getPropertyValue('--dts-color-primary')).toBe('#0F766E');
    expect(html.getAttribute('data-dts-breakpoint')).toBe('wide');
    dispose();
    expect(html.style.getPropertyValue('--dts-color-primary')).toBe('');
  });

  it('removes vars that disappear when re-applied (e.g. gradient)', () => {
    const pane = document.createElement('div');
    const withGradient = { ...acme, effects: { ...acme.effects, gradient: { ...acme.effects.gradient, enabled: true } } };
    const d1 = applyTheme(withGradient, { root: pane, mode: 'light', loadFonts: false });
    expect(pane.style.getPropertyValue('--dts-gradient-brand')).toContain('linear-gradient');
    d1();
    const d2 = applyTheme(acme, { root: pane, mode: 'light', loadFonts: false });
    expect(pane.style.getPropertyValue('--dts-gradient-brand')).toBe('');
    d2();
  });

  it('injects deduped Google Fonts links (and can opt out)', () => {
    const d1 = applyTheme(globex, { root: document.createElement('div'), mode: 'light' });
    const d2 = applyTheme(globex, { root: document.createElement('div'), mode: 'light' });
    const links = [...document.head.querySelectorAll('link[data-dts-font]')].map((l) => l.getAttribute('href'));
    expect(links).toEqual(googleFontsUrls(globex));
    expect(links.some((h) => h?.includes('family=Nunito+Sans:wght@'))).toBe(true);
    expect(links.some((h) => h?.includes('family=Merriweather:wght@'))).toBe(true);
    d1();
    d2();

    document.head.innerHTML = '';
    applyTheme(acme, { root: document.createElement('div'), mode: 'light', loadFonts: false })();
    expect(document.head.querySelectorAll('link').length).toBe(0);
  });

  it('builds per-family Google Fonts URLs with sorted weights', () => {
    const urls = googleFontsUrls(acme);
    expect(urls).toContain('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;600;700&display=swap');
    expect(urls).toContain('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');
    expect(urls).toHaveLength(3);
  });
});
