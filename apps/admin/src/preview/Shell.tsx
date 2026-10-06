import { useTheme } from '@dts/react';
import type { CSSProperties, ReactNode } from 'react';
import { useState } from 'react';
import { Icon, type IconName } from './icons.tsx';

export type ScreenId = 'home' | 'orders' | 'form' | 'overlays';

export const DESTINATIONS: { id: ScreenId; label: string; icon: IconName }[] = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'orders', label: 'Orders', icon: 'list' },
  { id: 'form', label: 'Settings', icon: 'form' },
  { id: 'overlays', label: 'Components', icon: 'layers' },
];

/**
 * A miniature app that renders the theme's navigation pattern for the current (container) breakpoint.
 * Everything is styled with the SDK's CSS variables, the same way a customer's web app would be.
 */
export function Shell({
  screen,
  onNavigate,
  title,
  children,
}: {
  screen: ScreenId;
  onNavigate(id: ScreenId): void;
  title?: string;
  children: ReactNode;
}) {
  const { theme, breakpoint, mode } = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pattern = theme.navigation.pattern[breakpoint];
  const { showLabels, indicator, appBar } = theme.navigation;
  const logo = theme.assets.logo[mode];

  const rootStyle = {
    '--p-text-scale': theme.typography.responsiveScale[breakpoint],
    '--dts-app-bar-height': `${appBar.height}px`,
    '--dts-card-border': theme.components.card.bordered
      ? `${theme.shape.borderWidth.thin}px solid var(--dts-color-outline-muted)`
      : '0 solid transparent',
  } as CSSProperties;

  const navItems = (variant: 'bar' | 'rail' | 'side' | 'tabs' | 'drawer') =>
    DESTINATIONS.map((d) => {
      const active = d.id === screen;
      // `showLabels` only applies to compact navigation; lists and tabs always need text.
      const compact = variant === 'bar' || variant === 'rail';
      const label = !compact || showLabels === 'always' || (showLabels === 'selected' && active);
      return (
        <button
          key={d.id}
          type="button"
          className={`p-nav-item ${active ? 'active' : ''}`}
          aria-current={active ? 'page' : undefined}
          onClick={() => {
            onNavigate(d.id);
            setDrawerOpen(false);
          }}
        >
          {variant !== 'tabs' && (
            <span className="p-nav-icon">
              <Icon name={d.icon} />
            </span>
          )}
          {label && <span className="p-nav-label">{d.label}</span>}
        </button>
      );
    });

  const brand = (
    <div className="p-brand">
      {logo ? <img src={logo} alt="" /> : <span className="p-brand-mark" />}
      <span>{theme.assets.appName}</span>
    </div>
  );

  const bar = (
    <header className={`p-appbar ${appBar.elevated ? 'elevated' : ''} ${appBar.centeredTitle ? 'centered' : ''}`}>
      {pattern === 'drawer' && (
        <button type="button" className="p-icon-btn" aria-label="Open menu" onClick={() => setDrawerOpen(true)}>
          <Icon name="menu" />
        </button>
      )}
      <div className="p-appbar-title">{pattern === 'sidebar' ? title : (title ?? theme.assets.appName)}</div>
      <div className="p-appbar-actions">
        <button type="button" className="p-icon-btn" aria-label="Search">
          <Icon name="search" />
        </button>
        <button type="button" className="p-icon-btn" aria-label="Notifications">
          <Icon name="bell" />
          <span className="p-badge dot" />
        </button>
      </div>
    </header>
  );

  return (
    <div
      className={`p-shell pattern-${pattern}`}
      data-indicator={indicator}
      data-labels={showLabels}
      data-corner={theme.shape.cornerStyle}
      data-reduced-motion={theme.motion.respectReducedMotion}
      style={rootStyle}
    >
      {pattern === 'sidebar' && (
        <aside className="p-sidebar">
          {brand}
          <nav>{navItems('side')}</nav>
        </aside>
      )}
      {pattern === 'rail' && (
        <aside className="p-rail">
          <span className="p-brand-mark" />
          <nav>{navItems('rail')}</nav>
        </aside>
      )}

      <div className="p-main">
        {bar}
        {pattern === 'topTabs' && <nav className="p-tabs">{navItems('tabs')}</nav>}
        <div className="p-content">{children}</div>
        {pattern === 'bottomBar' && <nav className="p-bottombar">{navItems('bar')}</nav>}
      </div>

      {pattern === 'drawer' && (
        <>
          <div className={`p-scrim ${drawerOpen ? 'open' : ''}`} onClick={() => setDrawerOpen(false)} />
          <aside className={`p-drawer ${drawerOpen ? 'open' : ''}`} aria-hidden={!drawerOpen}>
            {brand}
            <nav>{navItems('drawer')}</nav>
          </aside>
        </>
      )}
    </div>
  );
}
