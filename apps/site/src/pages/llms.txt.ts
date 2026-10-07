import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { SITE_URL } from '../config.ts';

/** `/llms.txt` (llmstxt.org): an index of the docs for AI tools, linking each page's Markdown. */
const SECTIONS: Array<[string, (id: string) => boolean]> = [
  ['Getting started', (id) => id === 'getting-started'],
  ['Concepts', (id) => id.startsWith('concepts/')],
  ['SDKs', (id) => id.startsWith('sdks/')],
  ['Reference', (id) => id === 'api' || id === 'deploy'],
];

export const GET: APIRoute = async () => {
  const docs = (await getCollection('docs', (e) => e.id !== 'index')).sort((a, b) => a.id.localeCompare(b.id));
  const lines = [
    '# Theme Studio',
    '',
    '> Runtime, per-client theming for multi-tenant SaaS. Themes are edited visually, resolved by the Theme API',
    '> (platform defaults → agency base → client overrides) and applied at runtime by the Flutter, Web, React and',
    '> React Native SDKs.',
    '',
  ];
  for (const [label, match] of SECTIONS) {
    const pages = docs.filter((e) => match(e.id));
    if (!pages.length) continue;
    lines.push(`## ${label}`, '');
    for (const e of pages) {
      lines.push(`- [${e.data.title}](${SITE_URL}/${e.id}.md)${e.data.description ? `: ${e.data.description}` : ''}`);
    }
    lines.push('');
  }
  lines.push('## Optional', '', `- [Theme JSON Schema](${SITE_URL}/theme.schema.json)`, '');
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
