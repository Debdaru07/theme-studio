import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';

/**
 * Raw Markdown for every docs page at `/<slug>.md` (used by "Copy page" and listed in /llms.txt).
 * The landing page is left out: it is mostly interactive components.
 */
export const getStaticPaths = (async () => {
  const docs = await getCollection('docs', (e) => e.id !== 'index');
  return docs.map((entry) => ({ params: { slug: entry.id }, props: { entry } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute<{ entry: CollectionEntry<'docs'> }> = ({ props: { entry } }) => {
  const { title, description } = entry.data;
  // MDX component imports mean nothing outside the site; drop them so the Markdown reads cleanly.
  const body = (entry.body ?? '').replace(/^import\s.+\sfrom\s['"].+['"];?\s*$/gm, '').trim();
  const text = `# ${title}\n\n${description ? `> ${description}\n\n` : ''}${body}\n`;
  return new Response(text, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
};
