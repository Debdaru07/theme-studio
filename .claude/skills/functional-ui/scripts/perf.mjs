#!/usr/bin/env node
/**
 * Editor input-latency check for Theme Studio. It types into a field that re-themes on every keystroke (a Layout
 * number field) and into the Primary hex field, at normal speed and with the CPU slowed 4× (a mid-range laptop),
 * and fails when the app's own work per input event goes over budget.
 *
 * It measures JS processing time per event (Event Timing processingEnd − processingStart): the part the app
 * controls. The full event duration also includes waiting for the next frame (~16–33ms at 60Hz), which no code
 * change removes, so it is reported but not budgeted.
 *
 * Draft saves and publishes are blocked, so it is safe to point at the hosted demo.
 *
 * Usage (server and admin running, or ADMIN_URL set):
 *   npm run perf:editor
 *   ADMIN_URL=https://theme-studio.debdarudasgupta0799.workers.dev npm run perf:editor
 *
 * Budgets (ms of JS per input event): BUDGET_1X (default 16), BUDGET_4X (default 50).
 */
import { chromium } from 'playwright-core';

const ADMIN = process.env.ADMIN_URL ?? 'http://localhost:5173';
const BUDGET = { 1: Number(process.env.BUDGET_1X ?? 16), 4: Number(process.env.BUDGET_4X ?? 50) };

const browser = await chromium.launch(process.env.BROWSER_CHANNEL === '' ? {} : { channel: process.env.BROWSER_CHANNEL ?? 'chrome' });
let failed = false;

const observe = (page) =>
  page.evaluate(() => {
    window.__events = [];
    new PerformanceObserver((list) =>
      list.getEntries().forEach((e) => window.__events.push({ js: e.processingEnd - e.processingStart, total: e.duration })),
    ).observe({ type: 'event', durationThreshold: 16 });
  });
const collect = async (page) => {
  const events = await page.evaluate(() => window.__events);
  return {
    js: Math.round(Math.max(0, ...events.map((e) => e.js))),
    total: Math.round(Math.max(0, ...events.map((e) => e.total))),
  };
};

for (const rate of [1, 4]) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await page.route(/\/(draft|publish)/, (r) => (r.request().method() === 'GET' ? r.continue() : r.abort()));
  await page.goto(ADMIN);
  await page.evaluate(() => localStorage.clear());
  await page.goto(ADMIN);
  // Demo accounts sign in with one click.
  await page.getByRole('button', { name: /Agency admin/ }).click();
  await page.getByText('Acme Logistics').first().click({ timeout: 90_000 });
  await page.waitForSelector('.editor-grid', { timeout: 90_000 });
  await page.waitForTimeout(1500);

  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate });

  await observe(page);
  const hex = page.getByRole('textbox', { name: 'Primary', exact: true });
  await hex.click();
  await hex.press('ControlOrMeta+a');
  await hex.pressSequentially('#E8590C', { delay: 120 });
  await hex.press('Enter');
  await page.waitForTimeout(600);
  const hexResult = await collect(page);

  await page.locator('.editor-tabs button', { hasText: 'Layout' }).click();
  await page.waitForTimeout(500);
  await observe(page);
  const num = page.locator('.editor-panel input[type=number]').first();
  await num.click();
  await num.press('ControlOrMeta+a');
  await num.pressSequentially('20', { delay: 100 }); // a realistic value, in case a save slips through
  await page.waitForTimeout(600);
  const numResult = await collect(page);

  for (const [name, r] of [['hex field', hexResult], ['number field (re-themes per key)', numResult]]) {
    const ok = r.js <= BUDGET[rate];
    failed ||= !ok;
    console.log(`${ok ? '✓' : '✗'} CPU ×${rate} ${name}: app JS ${r.js}ms (budget ${BUDGET[rate]}ms); slowest event incl. next frame ${r.total}ms`);
  }
  await ctx.close();
}

await browser.close();
process.exitCode = failed ? 1 : 0;
