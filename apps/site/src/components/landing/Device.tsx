import { useMemo } from 'react';
import { ThemeProvider, type Theme } from '@dts/react';
import { toCssVariables } from '@dts/web';
import AppScreen from './AppScreen.tsx';

interface DeviceProps {
  theme: Theme;
  mode: 'light' | 'dark';
  /** Spoken summary of what the frame shows; the screen itself is a picture, not a working app. */
  label: string;
  className?: string;
}

/** A phone frame rendering `AppScreen` with one theme, scoped to the frame. */
export default function Device({ theme, mode, label, className }: DeviceProps) {
  // The provider writes variables after mount; writing the same ones inline makes the server render (and islands
  // that hydrate later) show the theme from the first paint.
  const vars = useMemo(() => toCssVariables(theme, mode, 'mobile'), [theme, mode]);
  return (
    <div className={`device ${className ?? ''}`} role="img" aria-label={label}>
      <ThemeProvider theme={theme} mode={mode} scope="element" className="device-screen dts-xfade" style={vars}>
        <div inert className="device-inner">
          <AppScreen />
        </div>
      </ThemeProvider>
    </div>
  );
}
