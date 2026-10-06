import { useState, type CSSProperties } from 'react';
import { ThemeProvider, useTheme, type Theme } from '@dts/react';
import acmeJson from '@dts/schema/fixtures/acme.json';
import globexJson from '@dts/schema/fixtures/globex.json';

/**
 * Live demo: the real `@dts/react` ThemeProvider, scoped to one element, rendering two published
 * fixture themes. Everything inside is styled only with the `--dts-*` CSS variables the Web SDK writes.
 */
const THEMES = {
  acme: acmeJson as unknown as Theme,
  globex: globexJson as unknown as Theme,
} as const;
type ClientId = keyof typeof THEMES;
type Mode = 'light' | 'dark';

const v = (name: string) => `var(--dts-${name})`;
const text = (style: string): CSSProperties => ({
  fontFamily: v(`text-${style}-family`),
  fontSize: v(`text-${style}-size`),
  fontWeight: v(`text-${style}-weight`) as CSSProperties['fontWeight'],
  lineHeight: v(`text-${style}-line-height`),
  letterSpacing: v(`text-${style}-letter-spacing`),
  margin: 0,
});

const buttonBase: CSSProperties = {
  ...text('label-large'),
  height: v('button-height'),
  paddingInline: v('button-padding-x'),
  borderRadius: v('button-radius'),
  textTransform: v('button-text-transform') as CSSProperties['textTransform'],
  border: `${v('border-thin')} solid transparent`,
  cursor: 'pointer',
  transition: `filter ${v('duration-short')} ${v('easing-standard')}`,
};

function Sample() {
  const { theme } = useTheme();
  const chip = (bg: string, fg: string, label: string) => (
    <span
      style={{
        ...text('label-medium'),
        background: v(`color-${bg}`),
        color: v(`color-${fg}`),
        borderRadius: v('chip-radius'),
        padding: `${v('space-xs')} ${v('space-md')}`,
      }}
    >
      {label}
    </span>
  );
  return (
    <div style={{ background: v('color-background'), padding: v('page-padding'), minHeight: '100%' }}>
      <div
        style={{
          background: v('color-surface'),
          color: v('color-on-surface'),
          borderRadius: v('card-radius'),
          border: v('card-border'),
          boxShadow: v('card-shadow'),
          padding: v('card-padding'),
          display: 'grid',
          gap: v('space-md'),
        }}
      >
        <span style={{ ...text('label-medium'), color: v('color-primary') }}>{theme.assets.appName}</span>
        <h3 style={{ ...text('title-large'), color: v('color-on-surface') }}>Vehicle check due</h3>
        <p style={{ ...text('body-medium'), color: v('color-on-surface-muted') }}>
          Three vehicles need an inspection this week. Book a slot to stay compliant.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: v('space-sm') }}>
          {chip('success-container', 'on-success-container', 'On track')}
          {chip('warning-container', 'on-warning-container', '2 due soon')}
          {chip('info-container', 'on-info-container', 'New')}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: v('space-sm'), marginTop: v('space-xs') }}>
          <button type="button" style={{ ...buttonBase, background: v('color-primary'), color: v('color-on-primary') }}>
            Book inspection
          </button>
          <button
            type="button"
            style={{ ...buttonBase, background: v('color-secondary-container'), color: v('color-on-secondary-container') }}
          >
            Remind me
          </button>
          <button
            type="button"
            style={{ ...buttonBase, background: 'transparent', color: v('color-primary'), borderColor: v('color-outline') }}
          >
            Details
          </button>
        </div>
      </div>
    </div>
  );
}

const toggle = (active: boolean): CSSProperties => ({
  font: 'inherit',
  fontSize: '0.875rem',
  padding: '0.3rem 0.8rem',
  borderRadius: '999px',
  cursor: 'pointer',
  border: '1px solid var(--sl-color-gray-5)',
  background: active ? 'var(--sl-color-accent)' : 'transparent',
  color: active ? 'var(--sl-color-black)' : 'var(--sl-color-gray-2)',
});

export default function LiveDemo() {
  const [client, setClient] = useState<ClientId>('acme');
  const [mode, setMode] = useState<Mode>('light');
  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '0.875rem', color: 'var(--sl-color-gray-3)' }}>Client</span>
        {(['acme', 'globex'] as const).map((id) => (
          <button key={id} type="button" style={toggle(client === id)} aria-pressed={client === id} onClick={() => setClient(id)}>
            {THEMES[id].assets.appName}
          </button>
        ))}
        <span style={{ fontSize: '0.875rem', color: 'var(--sl-color-gray-3)', marginLeft: '0.75rem' }}>Mode</span>
        {(['light', 'dark'] as const).map((m) => (
          <button key={m} type="button" style={toggle(mode === m)} aria-pressed={mode === m} onClick={() => setMode(m)}>
            {m}
          </button>
        ))}
      </div>
      <ThemeProvider
        theme={THEMES[client]}
        mode={mode}
        scope="element"
        style={{ borderRadius: '0.75rem', overflow: 'hidden', border: '1px solid var(--sl-color-gray-5)', maxWidth: 520 }}
      >
        <Sample />
      </ThemeProvider>
    </div>
  );
}
