/**
 * DOM-free subset of @dts/web (theme client + token helpers), for React Native and other
 * non-browser runtimes: `import { createThemeClient } from '@dts/web/core'`.
 */
export { DEFAULT_THEME } from './default-theme.ts';
export {
  createThemeClient,
  localStorageAdapter,
  memoryStorage,
  ThemeFetchError,
  type FetchLike,
  type ThemeClient,
  type ThemeClientOptions,
  type ThemeSnapshot,
  type ThemeSource,
  type ThemeStatus,
  type ThemeStorage,
} from './client.ts';
export {
  breakpointFor,
  colorsFor,
  cubicBezierCss,
  getToken,
  motionTokens,
  navigationPattern,
  parseHex,
  rgba,
  type ColorMode,
  type CubicBezier,
  type DurationName,
  type EasingName,
  type ElevationLevel,
  type ModePreference,
  type MotionTokens,
  type TokenPath,
  type TokenValue,
} from './tokens.ts';
