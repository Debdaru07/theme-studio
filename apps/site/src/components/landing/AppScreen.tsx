import type { CSSProperties, ReactNode } from 'react';
import { useTheme } from '@dts/react';

/**
 * A small client app screen ("Northwind Bookings") rendered inside a scoped `<ThemeProvider>`.
 * Styled only with the `--dts-*` variables the Web SDK writes, so it shows the client's theme, never ours.
 * Layout decisions that tokens describe (navigation pattern, nav labels and indicator) are read from the theme.
 */
const v = (name: string) => `var(--dts-${name})`;
const text = (style: string): CSSProperties => ({
  fontFamily: v(`text-${style}-family`),
  fontSize: v(`text-${style}-size`),
  fontWeight: v(`text-${style}-weight`) as CSSProperties['fontWeight'],
  lineHeight: v(`text-${style}-line-height`),
  letterSpacing: v(`text-${style}-letter-spacing`),
  fontStyle: v(`text-${style}-font-style`),
  margin: 0,
});

const button = (kind: 'filled' | 'tonal' | 'outlined'): CSSProperties => ({
  ...text('label-medium'),
  height: v('button-height'),
  paddingInline: v('button-padding-x'),
  borderRadius: v('button-radius'),
  textTransform: v('button-text-transform') as CSSProperties['textTransform'],
  border: `${v('border-thin')} solid ${kind === 'outlined' ? v('color-outline') : 'transparent'}`,
  background:
    kind === 'filled' ? v('color-primary') : kind === 'tonal' ? v('color-secondary-container') : 'transparent',
  color:
    kind === 'filled'
      ? v('color-on-primary')
      : kind === 'tonal'
        ? v('color-on-secondary-container')
        : v('color-primary'),
  whiteSpace: 'nowrap',
});

const Icon = ({ d, size = 20 }: { d: ReactNode; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d}
  </svg>
);
const ICONS = {
  home: <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z" />,
  calendar: (
    <>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M8 3v4M16 3v4M4 10h16" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5 20c1.2-3.5 4-5 7-5s5.8 1.5 7 5" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  chevron: <path d="m9 6 6 6-6 6" />,
};

const NAV = [
  { id: 'home', label: 'Home' },
  { id: 'calendar', label: 'Bookings' },
  { id: 'user', label: 'Account' },
] as const;

export default function AppScreen() {
  const { theme } = useTheme();
  const nav = theme.navigation;
  const pattern = nav.pattern.mobile;
  const bottomBar = pattern === 'bottomBar';
  const pill = nav.indicator === 'pill';

  const chip = (bg: string, fg: string, label: string) => (
    <span style={{ ...text('label-medium'), background: v(`color-${bg}`), color: v(`color-${fg}`),
      borderRadius: v('chip-radius'), padding: `${v('space-xs')} ${v('space-sm')}` }}>
      {label}
    </span>
  );

  return (
    <div className="app-screen" style={{ background: v('color-background'), color: v('color-on-surface') }}>
      {/* App bar: a drawer pattern puts the menu here instead of a bottom bar. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: v('space-sm'), padding: `${v('space-md')} ${v('page-padding')}`,
        background: v('color-surface'), borderBottom: `${v('border-thin')} solid ${v('color-outline-muted')}` }}>
        {!bottomBar && <span style={{ color: v('color-on-surface'), display: 'flex' }}><Icon d={ICONS.menu} /></span>}
        <span style={{ ...text('title-medium'), color: v('color-primary'), flex: 1, overflow: 'hidden',
          textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {theme.assets.appName}
        </span>
        <span style={{ width: 28, height: 28, borderRadius: v('radius-full'), background: v('color-primary-container'),
          color: v('color-on-primary-container'), display: 'grid', placeItems: 'center', ...text('label-medium') }}>
          SK
        </span>
      </div>

      <div style={{ padding: v('page-padding'), display: 'grid', gap: v('space-md'), alignContent: 'start', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gap: v('space-xs') }}>
          <span style={{ ...text('caption'), color: v('color-on-surface-muted') }}>Thursday, 14 November</span>
          <h3 style={{ ...text('headline'), color: v('color-on-surface') }}>Your week</h3>
        </div>

        <div style={{ background: v('color-surface'), borderRadius: v('card-radius'), border: v('card-border'),
          boxShadow: v('card-shadow'), padding: v('card-padding'), display: 'grid', gap: v('space-sm') }}>
          <span style={{ ...text('label-medium'), color: v('color-primary') }}>Next booking</span>
          <span style={{ ...text('title-medium'), color: v('color-on-surface') }}>Service check · 09:30</span>
          <p style={{ ...text('body-medium'), color: v('color-on-surface-muted') }}>
            Two items need attention before your visit.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: v('space-xs') }}>
            {chip('success-container', 'on-success-container', 'Confirmed')}
            {chip('warning-container', 'on-warning-container', '2 to review')}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: v('space-sm'), marginTop: v('space-xs') }}>
            <button type="button" style={button(theme.components.button.variant === 'outlined' ? 'outlined' : 'filled')}>
              Reschedule
            </button>
            <button type="button" style={button('tonal')}>Directions</button>
          </div>
        </div>

        <div style={{ background: v('color-surface'), borderRadius: v('card-radius'), border: v('card-border'),
          boxShadow: v('card-shadow'), overflow: 'hidden' }}>
          {['Invoice #2041 ready', 'Feedback requested'].map((row, i) => (
            <div key={row} style={{ display: 'flex', alignItems: 'center', gap: v('space-sm'),
              padding: `${v('space-sm')} ${v('card-padding')}`,
              borderTop: i ? `${v('border-thin')} solid ${v('color-outline-muted')}` : undefined }}>
              <span style={{ width: 8, height: 8, borderRadius: v('radius-full'), background: i ? v('color-accent') : v('color-info') }} />
              <span style={{ ...text('body-medium'), flex: 1, color: v('color-on-surface') }}>{row}</span>
              <span style={{ color: v('color-on-surface-muted'), display: 'flex' }}><Icon d={ICONS.chevron} size={18} /></span>
            </div>
          ))}
        </div>
      </div>

      {bottomBar && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', background: v('color-surface'),
          borderTop: `${v('border-thin')} solid ${v('color-outline-muted')}`, padding: `${v('space-xs')} ${v('space-sm')}` }}>
          {NAV.map((item, i) => {
            const active = i === 0;
            const showLabel = nav.showLabels === 'always' || (nav.showLabels === 'selected' && active);
            return (
              <span key={item.id} style={{ display: 'grid', justifyItems: 'center', gap: 2, padding: `${v('space-xs')} 0`,
                color: active ? v('color-primary') : v('color-on-surface-muted') }}>
                <span style={{ display: 'flex', padding: `2px ${v('space-md')}`, borderRadius: v('radius-full'),
                  background: active && pill ? v('color-primary-container') : 'transparent',
                  color: active && pill ? v('color-on-primary-container') : undefined,
                  boxShadow: active && nav.indicator === 'underline' ? `inset 0 -2px 0 ${v('color-primary')}` : undefined }}>
                  <Icon d={ICONS[item.id]} />
                </span>
                {showLabel && <span style={text('caption')}>{item.label}</span>}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
