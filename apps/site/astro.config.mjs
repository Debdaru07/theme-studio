// @ts-check
import react from '@astrojs/react';
import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';
import starlightLinksValidator from 'starlight-links-validator';
import { REPO_URL, SITE_URL } from './src/config.ts';

const DESCRIPTION =
  'Runtime, per-client theming for multi-tenant SaaS. Edit visually, publish live to Flutter, Web, React and React Native.';

/** Display (Bricolage Grotesque), text (Inter) and code (JetBrains Mono) faces — see design-taste/direction.md. */
const FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600..800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Theme Studio',
  description: DESCRIPTION,
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'Web, Android, iOS',
  url: SITE_URL,
  codeRepository: REPO_URL,
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

export default defineConfig({
  site: SITE_URL,
  output: 'static',
  integrations: [
    starlight({
      title: 'Theme Studio',
      description: DESCRIPTION,
      favicon: '/favicon.svg',
      logo: { src: './src/assets/logo.svg', alt: '' },
      social: [{ icon: 'github', label: 'GitHub', href: REPO_URL }],
      customCss: ['./src/styles/custom.css', './src/styles/landing.css'],
      components: {
        Hero: './src/components/landing/Hero.astro',
        PageTitle: './src/components/docs/PageTitle.astro',
        SiteTitle: './src/components/docs/SiteTitle.astro',
        SocialIcons: './src/components/docs/SocialIcons.astro',
        // Light only (design-taste/direction.md).
        ThemeProvider: './src/components/docs/ThemeProvider.astro',
        ThemeSelect: './src/components/docs/ThemeSelect.astro',
      },
      editLink: { baseUrl: `${REPO_URL}/edit/main/apps/site/` },
      expressiveCode: {
        themes: ['github-light'],
        styleOverrides: {
          borderRadius: '10px',
          borderColor: 'var(--ts-line)',
          codeFontFamily: 'var(--__sl-font-mono)',
          codeFontSize: '0.8125rem',
          codeLineHeight: '1.7',
          codeBackground: 'var(--ts-code-bg)',
          uiFontFamily: 'var(--__sl-font)',
          frames: {
            frameBoxShadowCssValue: 'none',
            editorBackground: 'var(--ts-code-bg)',
            editorActiveTabBackground: 'var(--ts-code-bg)',
            editorActiveTabIndicatorTopColor: 'transparent',
            editorActiveTabIndicatorBottomColor: 'var(--sl-color-accent)',
            editorTabBarBackground: 'var(--ts-surface-2)',
            editorTabBarBorderBottomColor: 'var(--ts-line)',
            terminalBackground: 'var(--ts-code-bg)',
            terminalTitlebarBackground: 'var(--ts-surface-2)',
            terminalTitlebarBorderBottomColor: 'var(--ts-line)',
          },
        },
      },
      head: [
        { tag: 'link', attrs: { rel: 'preconnect', href: 'https://fonts.googleapis.com' } },
        { tag: 'link', attrs: { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' } },
        { tag: 'link', attrs: { rel: 'stylesheet', href: FONTS_URL } },
        { tag: 'meta', attrs: { property: 'og:image', content: `${SITE_URL}/og.png` } },
        { tag: 'meta', attrs: { property: 'og:image:width', content: '1200' } },
        { tag: 'meta', attrs: { property: 'og:image:height', content: '630' } },
        { tag: 'meta', attrs: { property: 'og:image:alt', content: 'Theme Studio: one product, every client’s brand, live.' } },
        { tag: 'meta', attrs: { name: 'twitter:card', content: 'summary_large_image' } },
        { tag: 'meta', attrs: { name: 'twitter:image', content: `${SITE_URL}/og.png` } },
        { tag: 'script', attrs: { type: 'application/ld+json' }, content: JSON.stringify(jsonLd) },
      ],
      lastUpdated: false,
      // No site search: the header links, sidebar and /llms.txt cover navigation.
      pagefind: false,
      plugins: [starlightLinksValidator()],
      sidebar: [
        {
          label: 'Getting started',
          items: [{ label: 'Overview & local setup', slug: 'getting-started' }],
        },
        {
          label: 'Concepts',
          items: [
            { label: 'Tokens', slug: 'concepts/tokens' },
            { label: 'Theme layers & resolution', slug: 'concepts/layers' },
            { label: 'Roles & permissions', slug: 'concepts/roles' },
            { label: 'Contrast & publishing', slug: 'concepts/publishing' },
            { label: 'Typography', slug: 'concepts/typography' },
            { label: 'Customize components', slug: 'concepts/components' },
          ],
        },
        {
          label: 'SDKs',
          items: [
            { label: 'Flutter', slug: 'sdks/flutter' },
            { label: 'Web', slug: 'sdks/web' },
            { label: 'React', slug: 'sdks/react' },
            { label: 'React Native', slug: 'sdks/react-native' },
          ],
        },
        { label: 'API reference', items: [{ label: 'Theme API', slug: 'api' }] },
        { label: 'Deploy', items: [{ label: 'Deploy on free tiers', slug: 'deploy' }] },
      ],
    }),
    react(),
  ],
});
