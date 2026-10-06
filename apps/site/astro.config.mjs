// @ts-check
import react from '@astrojs/react';
import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';
import starlightLinksValidator from 'starlight-links-validator';
import { REPO_URL } from './src/config.ts';

export default defineConfig({
  output: 'static',
  integrations: [
    starlight({
      title: 'Theme Studio',
      description:
        'Runtime, per-client theming for multi-tenant SaaS. Edit visually, publish live to Flutter, Web, React and React Native.',
      favicon: '/favicon.svg',
      social: [{ icon: 'github', label: 'GitHub', href: REPO_URL }],
      customCss: ['./src/styles/custom.css'],
      lastUpdated: false,
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
