#!/usr/bin/env node
/**
 * Responsive + accessibility smoke audit for Theme Studio and the docs site.
 *
 * For every target page × viewport it reports:
 *   - horizontal overflow and the elements that cause it
 *   - touch targets under 40px on touch-sized viewports
 *   - form fields under 16px text (iOS Safari zooms on focus)
 *   - images without alt text, buttons/links without an accessible name
 *   - uncaught page errors and failed (4xx/5xx) requests
 * and saves screenshots for a representative subset.
 *
 * Usage (servers must already be running — see SKILL.md):
 *   npm run audit:ui                       # all targets
 *   npm run audit:ui -- --only site        # admin | site
 *   npm run audit:ui -- --json report.json # also write machine-readable results
 *
 * Env: ADMIN_URL (default http://localhost:5173), SITE_URL (http://localhost:4321),
 *      BROWSER_CHANNEL (default "chrome"; set "" to use Playwright's bundled Chromium),
 *      SHOTS ("390x844,768x1024,1280x800"), OUT_DIR (default .ui-audit/).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright-core';

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};

const ADMIN = process.env.ADMIN_URL ?? 'http://localhost:5173';
const SITE = process.env.SITE_URL ?? 'http://localhost:4321';
const OUT = resolve(process.env.OUT_DIR ?? '.ui-audit');
const SHOTS = new Set((process.env.SHOTS ?? '390x844,768x1024,1280x800').split(','));
const ONLY = flag('only');
const JSON_OUT = flag('json');

/** Phones, phone landscape, tablets, laptops, desktop. */
export const VIEWPORTS = [
  [320, 568], [360, 740], [390, 844], [414, 896],
  [844, 390],
  [768, 1024], [1024, 768],
  [1280, 800], [1440, 900], [1920, 1080],
];

const signIn = async (page) => {
  await page.goto(ADMIN);
  await page.evaluate(() => localStorage.clear());
  await page.goto(ADMIN);
  await page.getByRole('button', { name: /Agency admin/ }).click();
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.getByText('Acme Logistics').first().waitFor({ timeout: 60_000 });
};
const openEditor = async (page) => {
  await signIn(page);
  await page.getByText('Acme Logistics').first().click();
  await page.waitForSelector('.editor-grid', { timeout: 60_000 });
};

/** Pages and the steps to reach them. Add new screens here. */
export const TARGETS = [
  { app: 'admin', name: 'admin-login', go: (p) => p.goto(ADMIN) },
  { app: 'admin', name: 'admin-home', go: signIn },
  { app: 'admin', name: 'admin-editor', go: openEditor },
  {
    app: 'admin',
    name: 'admin-preview',
    go: async (p) => {
      await openEditor(p);
      const toggle = p.getByRole('button', { name: /^.?\s*Preview$/ });
      if (await toggle.isVisible()) await toggle.click();
    },
  },
  {
    app: 'admin',
    name: 'admin-font-picker',
    go: async (p) => {
      await openEditor(p);
      await p.getByRole('button', { name: /^Typography/ }).first().click();
      await p.locator('.font-trigger').first().click();
    },
  },
  { app: 'site', name: 'site-home', go: (p) => p.goto(SITE + '/', { waitUntil: 'networkidle' }) },
  { app: 'site', name: 'site-getting-started', go: (p) => p.goto(SITE + '/getting-started/', { waitUntil: 'networkidle' }) },
  { app: 'site', name: 'site-flutter', go: (p) => p.goto(SITE + '/sdks/flutter/', { waitUntil: 'networkidle' }) },
];

const measure = (page, touch) =>
  page.evaluate((touch) => {
    const vw = document.documentElement.clientWidth;
    const label = (el) =>
      el.tagName.toLowerCase() +
      (el.id ? '#' + el.id : '') +
      (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '');
    const clipped = (el) => {
      for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
        if (/(auto|scroll|hidden|clip)/.test(getComputedStyle(p).overflowX)) return true;
      }
      return false;
    };
    const visible = (el, r, s) => r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none';
    // Known exemptions: skip links (off-screen until focused), heading permalinks, links that flow inline in
    // running text (WCAG 2.5.8 "inline" exception), and the simulated client app inside the preview frame.
    // "Stretched links" (an absolutely positioned ::before covering the card, e.g. Starlight LinkCard) make the
    // whole card the target, so the anchor's own text box doesn't matter.
    const stretched = (el) => {
      const b = getComputedStyle(el, '::before');
      return b.content !== 'none' && b.position === 'absolute';
    };
    const exempt = (el) =>
      el.matches('.sl-skip-link, .sl-anchor-link') ||
      (el.matches('a') && (getComputedStyle(el).display === 'inline' || stretched(el))) ||
      !!el.closest('.dts-app');

    const out = { overflow: document.documentElement.scrollWidth - vw, offenders: [], smallTargets: [], zoomInputs: [], unnamed: [], noAlt: [] };
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      if (!visible(el, r, s)) continue;
      if ((r.right > vw + 1 || r.left < -1) && s.position !== 'fixed' && !clipped(el)) {
        const pr = el.parentElement?.getBoundingClientRect();
        if (!pr || pr.right <= vw + 1) out.offenders.push(`${label(el)} [${Math.round(r.left)}..${Math.round(r.right)}]`);
      }
      const interactive = el.matches('button, a[href], input, select, textarea, summary, [role=button], [role=tab], [role=option]');
      if (interactive && touch && !exempt(el) && (r.height < 40 || r.width < 32)) {
        // A control inside a larger tappable label is fine.
        const host = el.closest('label');
        const hr = host?.getBoundingClientRect();
        if (!hr || hr.height < 40) out.smallTargets.push(`${label(el)} ${Math.round(r.width)}x${Math.round(r.height)}`);
      }
      if (touch && el.matches('input:not([type=checkbox],[type=radio],[type=color],[type=range]), select, textarea') && parseFloat(s.fontSize) < 16) {
        out.zoomInputs.push(`${label(el)} ${s.fontSize}`);
      }
      if (el.matches('button, a[href], [role=button]') && !exempt(el)) {
        const name = (el.getAttribute('aria-label') || el.getAttribute('title') || el.textContent || '').trim();
        if (!name && !el.querySelector('img[alt]:not([alt=""]), svg title')) out.unnamed.push(label(el));
      }
      if (el.matches('img') && !el.hasAttribute('alt')) out.noAlt.push(label(el));
    }
    for (const k of ['offenders', 'smallTargets', 'zoomInputs', 'unnamed', 'noAlt']) out[k] = [...new Set(out[k])].slice(0, 8);
    return out;
  }, touch);

const browser = await chromium.launch(process.env.BROWSER_CHANNEL === '' ? {} : { channel: process.env.BROWSER_CHANNEL ?? 'chrome' });
mkdirSync(OUT, { recursive: true });
const results = [];

for (const target of TARGETS.filter((t) => !ONLY || t.app === ONLY)) {
  for (const [w, h] of VIEWPORTS) {
    const touch = w < 1024 || h <= 500;
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: touch, isMobile: touch && w < 900 });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e).split('\n')[0].slice(0, 160)));
    page.on('response', (r) => {
      if (r.status() >= 400 && !/fonts\.(googleapis|gstatic)/.test(r.url())) errors.push(`${r.status()} ${r.url()}`);
    });
    const vp = `${w}x${h}`;
    try {
      await target.go(page);
      await page.addStyleTag({ content: 'astro-dev-toolbar{display:none!important}' }).catch(() => {});
      await page.waitForTimeout(600);
      results.push({ target: target.name, vp, ...(await measure(page, touch)), errors });
      if (SHOTS.has(vp)) await page.screenshot({ path: join(OUT, `${target.name}-${vp}.png`) });
    } catch (e) {
      results.push({ target: target.name, vp, failed: String(e).split('\n')[0].slice(0, 200), errors });
    }
    await ctx.close();
  }
}
await browser.close();

let problems = 0;
for (const r of results) {
  const lines = [];
  if (r.failed) lines.push(`FLOW FAILED: ${r.failed}`);
  if (r.overflow > 1) lines.push(`horizontal overflow +${r.overflow}px: ${r.offenders.join(' ; ')}`);
  if (r.smallTargets?.length) lines.push(`touch targets < 40px: ${r.smallTargets.join(', ')}`);
  if (r.zoomInputs?.length) lines.push(`inputs < 16px (iOS zoom): ${r.zoomInputs.join(', ')}`);
  if (r.unnamed?.length) lines.push(`no accessible name: ${r.unnamed.join(', ')}`);
  if (r.noAlt?.length) lines.push(`img without alt: ${r.noAlt.join(', ')}`);
  if (r.errors?.length) lines.push(`errors: ${r.errors.join(' | ')}`);
  problems += lines.length ? 1 : 0;
  console.log(`${lines.length ? '✗' : '✓'} ${r.target.padEnd(22)} ${r.vp}${lines.map((l) => `\n    ${l}`).join('')}`);
}
console.log(`\n${results.length - problems}/${results.length} views clean. Screenshots: ${OUT}`);
if (JSON_OUT) writeFileSync(JSON_OUT, JSON.stringify(results, null, 2));
process.exitCode = problems ? 1 : 0;
