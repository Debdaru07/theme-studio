import type { ThemeInput } from './tokens.ts';

/**
 * Demo data shared by the server seed, conformance fixtures and SDK examples:
 * one tenant ("Northwind Studio") with a base theme and two very different clients.
 */
export const DEMO_TENANT_BASE: ThemeInput = {
  typography: { fontFamily: { primary: 'Inter' } },
  assets: { appName: 'Northwind' },
};

export const DEMO_CLIENTS: Record<'acme' | 'globex', { name: string; layer: ThemeInput }> = {
  acme: {
    name: 'Acme Logistics',
    layer: {
      color: { seed: { primary: '#1D4ED8', accent: '#F97316' } },
      typography: { fontFamily: { primary: 'Roboto', secondary: 'Poppins' } },
      shape: { radius: { md: 8, xl: 16 } },
      motion: { pageTransition: 'slide' },
      navigation: { pattern: { tablet: 'rail', desktop: 'sidebar' }, indicator: 'underline' },
      components: { button: { variant: 'filled' } },
      assets: { appName: 'Acme Fleet' },
    },
  },
  globex: {
    name: 'Globex Health',
    layer: {
      color: {
        seed: { primary: '#0F766E', secondary: '#7C3AED', accent: '#DB2777', neutral: '#334155' },
        light: { background: '#F6F8F8' },
      },
      typography: { fontFamily: { primary: 'Nunito Sans', secondary: 'Merriweather' } },
      shape: { radius: { sm: 2, md: 4, lg: 6, xl: 8 }, cornerStyle: 'cut' },
      motion: { pageTransition: 'fade', duration: { medium: 300 } },
      navigation: {
        pattern: { mobile: 'drawer', tablet: 'drawer', desktop: 'topTabs', wide: 'topTabs' },
        showLabels: 'selected',
      },
      components: { button: { variant: 'outlined' }, input: { variant: 'filled' } },
      spacing: { layout: { desktop: { contentMaxWidth: 1080 } } },
      assets: { appName: 'Globex Care' },
    },
  },
};
