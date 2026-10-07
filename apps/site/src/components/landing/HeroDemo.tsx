import { useEffect, useRef, useState } from 'react';
import type { Theme } from '@debdaru07/react';
import acmeJson from '@debdaru07/schema/fixtures/acme.json';
import globexJson from '@debdaru07/schema/fixtures/globex.json';
import Device from './Device.tsx';
import Segmented from './Segmented.tsx';

/**
 * Hero demo: two published client themes of one agency, rendered by `@debdaru07/react`.
 * Plays one short Acme → Globex → dark sequence (under 5s, WCAG 2.2.2), skipped with reduced motion
 * and cancelled by any interaction.
 */
const THEMES = { acme: acmeJson as unknown as Theme, globex: globexJson as unknown as Theme };
type ClientId = keyof typeof THEMES;
type Mode = 'light' | 'dark';

const SEQUENCE: Array<[number, ClientId, Mode]> = [
  [1600, 'globex', 'light'],
  [3200, 'globex', 'dark'],
];

const NAV_LABEL: Record<string, string> = {
  bottomBar: 'Bottom bar',
  drawer: 'Drawer',
  rail: 'Rail',
  sidebar: 'Sidebar',
  topTabs: 'Top tabs',
};

export default function HeroDemo() {
  const [client, setClient] = useState<ClientId>('acme');
  const [mode, setMode] = useState<Mode>('light');
  const timers = useRef<number[]>([]);

  const stopAutoplay = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    timers.current = SEQUENCE.map(([at, c, m]) =>
      window.setTimeout(() => {
        setClient(c);
        setMode(m);
      }, at),
    );
    return stopAutoplay;
  }, []);

  const theme = THEMES[client];
  const name = theme.assets.appName;
  const primary = theme.color[mode].primary;

  return (
    <div className="hero-demo" onPointerDown={stopAutoplay} onKeyDown={stopAutoplay} onFocus={stopAutoplay}>
      <div className="hero-stage">
        <Device theme={theme} mode={mode} label={`Sample app screen themed as ${name}, ${mode} mode`} />
        <dl className="token-readout" aria-label={`${name} theme tokens`}>
          <div>
            <dt>primary</dt>
            <dd>
              <span className="swatch" style={{ background: primary }} aria-hidden="true" />
              {primary.toUpperCase()}
            </dd>
          </div>
          <div>
            <dt>font</dt>
            <dd>{theme.typography.fontFamily.primary}</dd>
          </div>
          <div>
            <dt>nav · phone</dt>
            <dd>{NAV_LABEL[theme.navigation.pattern.mobile] ?? theme.navigation.pattern.mobile}</dd>
          </div>
        </dl>
      </div>
      <div className="demo-controls">
        <Segmented
          label="Client"
          value={client}
          options={(['acme', 'globex'] as const).map((id) => ({ value: id, label: THEMES[id].assets.appName }))}
          onChange={(c) => {
            stopAutoplay();
            setClient(c);
          }}
        />
        <Segmented
          label="Mode"
          value={mode}
          options={[
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
          ]}
          onChange={(m) => {
            stopAutoplay();
            setMode(m);
          }}
        />
      </div>
    </div>
  );
}
