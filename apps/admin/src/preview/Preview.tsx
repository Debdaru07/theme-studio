import { ThemeProvider } from '@debdaru07/react';
import type { Theme } from '@debdaru07/schema';
import { useLayoutEffect, useRef, useState } from 'react';
import { Gallery } from './Gallery.tsx';
import { Specimen } from './Specimen.tsx';
import { HomeScreen, FormScreen, OrdersScreen, OverlaysScreen } from './screens.tsx';
import { DESTINATIONS, Shell, type ScreenId } from './Shell.tsx';

const DEVICES = {
  mobile: { label: 'Phone', width: 390, height: 780 },
  tablet: { label: 'Tablet', width: 820, height: 1000 },
  desktop: { label: 'Desktop', width: 1280, height: 800 },
  wide: { label: 'Wide', width: 1520, height: 860 },
} as const;
type Device = keyof typeof DEVICES;

/** `focus`: the Components tab is open, so show the component being tuned instead of screens/gallery. */
export function Preview({ theme, focus = false }: { theme: Theme; focus?: boolean }) {
  const [device, setDevice] = useState<Device>('mobile');
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  /** Sample app screens, or the gallery of every SDK component. */
  const [view, setView] = useState<'screens' | 'components'>('screens');
  const [screen, setScreen] = useState<ScreenId>('home');
  const [replay, setReplay] = useState(0);
  const stage = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const { width, height } = DEVICES[device];

  // Scale the frame to fit; the frame keeps its real CSS width so breakpoints behave like the device.
  useLayoutEffect(() => {
    const el = stage.current;
    if (!el) return;
    // Skip while hidden (compact layouts hide the preview pane); the observer refits once it shows.
    const fit = () => {
      if (!el.clientWidth || !el.clientHeight) return;
      setScale(Math.max(0.1, Math.min(1, (el.clientWidth - 24) / width, (el.clientHeight - 24) / height)));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [width, height]);

  const transition = theme.motion.pageTransition;
  const animate = transition === 'none' ? '' : `enter-${transition}`;
  const title = DESTINATIONS.find((d) => d.id === screen)?.label;

  return (
    <div className="preview">
      <div className="preview-toolbar">
        {!focus && (
        <div className="segmented" role="group" aria-label="Preview content">
          {(['screens', 'components'] as const).map((v) => (
            <button key={v} type="button" className={view === v ? 'on' : ''} aria-pressed={view === v} onClick={() => setView(v)}>
              {v === 'screens' ? 'Screens' : 'Component library'}
            </button>
          ))}
        </div>
        )}
        <div className="segmented">
          {(Object.keys(DEVICES) as Device[]).map((d) => (
            <button key={d} type="button" className={device === d ? 'on' : ''} onClick={() => setDevice(d)}>
              {DEVICES[d].label}
            </button>
          ))}
        </div>
        <div className="segmented">
          {(['light', 'dark'] as const).map((m) => (
            <button key={m} type="button" className={mode === m ? 'on' : ''} onClick={() => setMode(m)}>
              {m === 'light' ? '☀ Light' : '☾ Dark'}
            </button>
          ))}
        </div>
        {view === 'screens' && !focus && (
          <button type="button" className="btn ghost small" onClick={() => setReplay((r) => r + 1)} title="Replay page transition">
            ↻ Replay motion
          </button>
        )}
        <span className="muted small">
          {width}px · {Math.round(scale * 100)}%
        </span>
      </div>

      <div className="preview-stage" ref={stage}>
        <div className="device" style={{ width: width * scale, height: height * scale }}>
          <div className="device-inner" style={{ width, height, transform: `scale(${scale})` }}>
            {focus ? (
              <ThemeProvider theme={theme} mode={mode} scope="element" className="g-app spec-app">
                <Specimen />
              </ThemeProvider>
            ) : view === 'components' ? (
              <ThemeProvider theme={theme} mode={mode} scope="element" className="g-app">
                <Gallery />
              </ThemeProvider>
            ) : (
              <ThemeProvider theme={theme} mode={mode} scope="element" className="dts-app">
                <Shell screen={screen} onNavigate={setScreen} title={title}>
                  <div key={`${screen}-${replay}`} className={`p-page ${animate}`}>
                    {screen === 'home' && <HomeScreen />}
                    {screen === 'orders' && <OrdersScreen animate={animate} />}
                    {screen === 'form' && <FormScreen />}
                    {screen === 'overlays' && <OverlaysScreen />}
                  </div>
                </Shell>
              </ThemeProvider>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
