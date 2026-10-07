#!/usr/bin/env node
/**
 * Editor input-latency check for Theme Studio: types a hex color into the Primary field and scrubs the native color
 * picker, at normal speed and with the CPU slowed 4× (a mid-range laptop), and fails over budget.
 *
 * Draft saves and publishes are blocked, so it is safe to point at the hosted demo.
 *
 * Usage (server and admin running, or ADMIN_URL set):
 *   npm run perf:editor
 *   ADMIN_URL=https://theme-studio.debdarudasgupta0799.workers.dev npm run perf:editor
 *
 * Budgets (ms, slowest key event from keydown to next paint): BUDGET_1X (default 16), BUDGET_4X (default 50).
 */
import { chromium } from 'playwright-core';

const ADMIN = process.env.ADMIN_URL ?? 'http://localhost:5173';
const BUDGET = { 1: Number(process.env.BUDGET_1X ?? 16), 4: Number(process.env.BUDGET_4X ?? 50) };

const browser = await chromium.launch(process.env.BROWSER_CHANNEL === '' ? {} : { channel: process.env.BROWSER_CHANNEL ?? 'chrome' });
let failed = false;

for (const rate of [1, 4]) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await page.route(/\/(draft|publish)/, (r) => (r.request().method() === 'GET' ? r.continue() : r.abort()));
  await page.goto(ADMIN);
  await page.evaluate(() => localStorage.clear());
  await page.goto(ADMIN);
  await page.getByRole('button', { name: /Agency admin/ }).click();
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.getByText('Acme Logistics').first().click({ timeout: 90_000 });
  await page.waitForSelector('.editor-grid', { timeout: 90_000 });
  await page.waitForTimeout(1500);

  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate });
  await page.evaluate(() => {
    window.__events = [];
    new PerformanceObserver((list) => list.getEntries().forEach((e) => window.__events.push({ name: e.name, duration: e.duration })))
      .observe({ type: 'event', durationThreshold: 16 });
  });

  const hex = page.getByRole('textbox', { name: /Primary/ }).first();
  await hex.click();
  await hex.press('ControlOrMeta+a');
  await hex.pressSequentially('#E8590C', { delay: 120 });
  await page.waitForTimeout(600);

  const scrub = await page.evaluate(async () => {
    const input = document.querySelector('input[type=color]');
    const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    const frames = [];
    for (let i = 0; i < 30; i++) {
      set.call(input, '#' + (0x2040a0 + i * 0x030201).toString(16).padStart(6, '0'));
      input.dispatchEvent(new Event('input', { bubbles: true }));
      const t = performance.now();
      await new Promise((r) => requestAnimationFrame(() => r()));
      frames.push(performance.now() - t);
    }
    return Math.round(Math.max(...frames));
  });

  const keys = (await page.evaluate(() => window.__events))
    .filter((e) => /^key|^input|^beforeinput/.test(e.name))
    .map((e) => Math.round(e.duration));
  const worst = keys.length ? Math.max(...keys) : 0;
  const ok = worst <= BUDGET[rate];
  failed ||= !ok;
  console.log(`${ok ? '✓' : '✗'} CPU ×${rate}: slowest key event ${worst}ms (budget ${BUDGET[rate]}ms), ${keys.length} events over 16ms; color-picker scrub worst frame ${scrub}ms`);
  await ctx.close();
}

await browser.close();
process.exitCode = failed ? 1 : 0;
