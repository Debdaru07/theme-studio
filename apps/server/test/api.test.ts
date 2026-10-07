import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { FastifyInstance } from 'fastify';
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.ts';
import { openDb, type Db } from '../src/db.ts';
import { DEMO_KEYS, DEMO_USERS, seedDemo, syncPlatformAdmin } from '../src/demo.ts';

let app: FastifyInstance;
let db: Db;
let ids: { tenantId: string; clients: { acme: string; globex: string } };
const dir = mkdtempSync(join(tmpdir(), 'dts-test-'));
let n = 0;

// A temp file per test: libSQL runs transactions on their own connection, which an in-memory DB would not share.
beforeEach(async () => {
  db = await openDb({ url: `file:${join(dir, `test-${n++}.db`).replace(/\\/g, '/')}` });
  const seeded = await seedDemo(db);
  if (!seeded.created) throw new Error('seed failed');
  ids = seeded;
  app = await buildApp({ db, jwtSecret: 'test-secret-test-secret-test-secret' });
});

afterEach(async () => {
  await app.close();
  db.close();
});

// Windows may still hold the files briefly after close; leftovers in the OS temp dir are harmless.
afterAll(() => {
  try {
    rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  } catch {
    /* left for the OS to clean up */
  }
});

async function login(who: keyof typeof DEMO_USERS) {
  const res = await app.inject({ method: 'POST', url: '/auth/login', payload: DEMO_USERS[who] });
  expect(res.statusCode).toBe(200);
  return { authorization: `Bearer ${res.json().token}` };
}

const getTheme = (key: string, etag?: string) =>
  app.inject({
    method: 'GET',
    url: '/v1/theme',
    headers: { 'x-theme-key': key, ...(etag ? { 'if-none-match': etag } : {}) },
  });

describe('public theme endpoint', () => {
  it('serves the resolved published theme with an ETag', async () => {
    const res = await getTheme(DEMO_KEYS.acme);
    expect(res.statusCode).toBe(200);
    const theme = res.json();
    expect(theme.color.light.primary).toBe('#1D4ED8');
    expect(theme.meta).toMatchObject({ tenant: 'northwind', client: 'acme', version: 1 });
    expect(res.headers.etag).toBe(`"${theme.meta.hash}"`);
  });

  it('returns 304 when the ETag matches', async () => {
    const first = await getTheme(DEMO_KEYS.acme);
    const second = await getTheme(DEMO_KEYS.acme, first.headers.etag as string);
    expect(second.statusCode).toBe(304);
    expect(second.body).toBe('');
  });

  it('rejects missing and unknown keys', async () => {
    expect((await app.inject({ method: 'GET', url: '/v1/theme' })).statusCode).toBe(401);
    expect((await getTheme('pk_nope')).statusCode).toBe(401);
  });

  it('allows browser preflights for draft saves (PUT)', async () => {
    const res = await app.inject({
      method: 'OPTIONS',
      url: `/clients/${ids.clients.acme}/theme/draft`,
      headers: {
        origin: 'http://localhost:5173',
        'access-control-request-method': 'PUT',
        'access-control-request-headers': 'authorization,content-type',
      },
    });
    expect(res.statusCode).toBe(204);
    expect(res.headers['access-control-allow-methods']).toContain('PUT');
  });

  it('exposes ETag to browsers', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/theme',
      headers: { 'x-theme-key': DEMO_KEYS.acme, origin: 'http://localhost:5173' },
    });
    expect(res.headers['access-control-expose-headers']).toContain('ETag');
  });
});

describe('auth', () => {
  it('rejects bad credentials and unauthenticated calls', async () => {
    const bad = await app.inject({ method: 'POST', url: '/auth/login', payload: { ...DEMO_USERS.tenant, password: 'wrong' } });
    expect(bad.statusCode).toBe(401);
    expect((await app.inject({ method: 'GET', url: '/tenants' })).statusCode).toBe(401);
  });

  it('scopes client editors to their own client', async () => {
    const headers = await login('acmeEditor');
    const list = await app.inject({ method: 'GET', url: `/tenants/${ids.tenantId}/clients`, headers });
    expect(list.json().clients.map((c: { slug: string }) => c.slug)).toEqual(['acme']);
    const other = await app.inject({ method: 'GET', url: `/clients/${ids.clients.globex}/theme`, headers });
    expect(other.statusCode).toBe(403);
    const base = await app.inject({ method: 'PUT', url: `/tenants/${ids.tenantId}/theme/draft`, headers, payload: { layer: {} } });
    expect(base.statusCode).toBe(403);
  });
});

describe('platform admin password (syncPlatformAdmin)', () => {
  const tryLogin = async (password: string) =>
    (await app.inject({ method: 'POST', url: '/auth/login', payload: { email: DEMO_USERS.platform.email, password } })).statusCode;

  it('applies ADMIN_PASSWORD on every start, replacing the demo password', async () => {
    expect(await tryLogin(DEMO_USERS.platform.password)).toBe(200); // dev seed
    expect(await syncPlatformAdmin(db, { password: 'a-much-better-secret', production: true })).toBe('set');
    expect(await tryLogin(DEMO_USERS.platform.password)).toBe(401);
    expect(await tryLogin('a-much-better-secret')).toBe(200);
    expect(await syncPlatformAdmin(db, { password: 'a-much-better-secret', production: true })).toBe('unchanged');
  });

  it('locks the demo password in production when ADMIN_PASSWORD is missing or too short', async () => {
    expect(await syncPlatformAdmin(db, { password: undefined, production: true })).toBe('locked');
    expect(await tryLogin(DEMO_USERS.platform.password)).toBe(401);

    expect(await syncPlatformAdmin(db, { password: 'short', production: true })).toBe('weak-password-locked');
    expect(await tryLogin('short')).toBe(401);
  });

  it('leaves development alone', async () => {
    expect(await syncPlatformAdmin(db, { password: undefined, production: false })).toBe('unchanged');
    expect(await tryLogin(DEMO_USERS.platform.password)).toBe(200);
  });
});

describe('client theme lifecycle', () => {
  it('saves a draft, publishes it, and the SDK endpoint reflects it', async () => {
    const headers = await login('acmeEditor');
    const url = `/clients/${ids.clients.acme}/theme`;

    const before = await getTheme(DEMO_KEYS.acme);

    const save = await app.inject({
      method: 'PUT',
      url: `${url}/draft`,
      headers,
      payload: { layer: { color: { seed: { primary: '#7C3AED' } }, motion: { pageTransition: 'fade' } } },
    });
    expect(save.statusCode).toBe(200);
    expect(save.json().contrast.publishable).toBe(true);

    const state = (await app.inject({ method: 'GET', url, headers })).json();
    expect(state.hasUnpublishedChanges).toBe(true);
    expect(state.base).toMatchObject({ assets: { appName: 'Northwind' } });

    // Not live until published.
    expect((await getTheme(DEMO_KEYS.acme)).json().color.light.primary).toBe('#1D4ED8');

    const pub = await app.inject({ method: 'POST', url: `${url}/publish`, headers, payload: { note: 'Purple rebrand' } });
    expect(pub.statusCode).toBe(200);
    expect(pub.json().version).toMatchObject({ version: 2, note: 'Purple rebrand', publishedBy: 'Ada Acme' });

    const after = await getTheme(DEMO_KEYS.acme, before.headers.etag as string);
    expect(after.statusCode).toBe(200);
    expect(after.json().color.light.primary).toBe('#7C3AED');
    expect(after.json().motion.pageTransition).toBe('fade');
  });

  it('rejects locked and unknown tokens with paths', async () => {
    const headers = await login('acmeEditor');
    const res = await app.inject({
      method: 'PUT',
      url: `/clients/${ids.clients.acme}/theme/draft`,
      headers,
      payload: { layer: { sizing: { minTouchTarget: 20 }, components: { button: { height: 24 } }, bogus: 1 } },
    });
    expect(res.statusCode).toBe(422);
    expect(res.json().issues.map((i: { path: string }) => i.path).sort()).toEqual([
      'bogus',
      'components.button.height',
      'sizing.minTouchTarget',
    ]);
  });

  it('lets the agency set agency-level tokens on a client; the client keeps but cannot change them', async () => {
    const url = `/clients/${ids.clients.acme}/theme`;
    const agency = await login('tenant');
    const draft = (await app.inject({ method: 'GET', url, headers: agency })).json().draft;
    const withHeight = { ...draft, components: { ...draft.components, button: { ...draft.components.button, height: 44 } } };
    const set = await app.inject({ method: 'PUT', url: `${url}/draft`, headers: agency, payload: { layer: withHeight } });
    expect(set.statusCode).toBe(200);

    const client = await login('acmeEditor');
    // Editing their brand color keeps the agency's button height.
    const recolor = { ...withHeight, color: { seed: { ...withHeight.color.seed, primary: '#0E7490' } } };
    expect((await app.inject({ method: 'PUT', url: `${url}/draft`, headers: client, payload: { layer: recolor } })).statusCode).toBe(200);
    // Changing or removing it is refused.
    const changed = { ...recolor, components: { ...recolor.components, button: { ...recolor.components.button, height: 30 } } };
    const res = await app.inject({ method: 'PUT', url: `${url}/draft`, headers: client, payload: { layer: changed } });
    expect(res.statusCode).toBe(422);
    expect(res.json().issues[0].path).toBe('components.button.height');

    // And it still publishes.
    expect((await app.inject({ method: 'POST', url: `${url}/publish`, headers: client })).statusCode).toBe(200);
    expect((await getTheme(DEMO_KEYS.acme)).json().components.button.height).toBe(44);
  });

  it('saves a draft that fails contrast but refuses to publish it', async () => {
    const headers = await login('acmeEditor');
    const url = `/clients/${ids.clients.acme}/theme`;
    const save = await app.inject({
      method: 'PUT',
      url: `${url}/draft`,
      headers,
      payload: { layer: { color: { light: { onPrimary: '#2244CC' } } } },
    });
    expect(save.statusCode).toBe(200);
    expect(save.json().contrast.publishable).toBe(false);

    const pub = await app.inject({ method: 'POST', url: `${url}/publish`, headers });
    expect(pub.statusCode).toBe(422);
    expect(pub.json().details.contrast.issues[0]).toMatchObject({ mode: 'light', fg: 'onPrimary', level: 'error' });
  });

  it('rolls back to an earlier version', async () => {
    const headers = await login('tenant');
    const url = `/clients/${ids.clients.globex}/theme`;
    await app.inject({ method: 'PUT', url: `${url}/draft`, headers, payload: { layer: { motion: { pageTransition: 'none' } } } });
    await app.inject({ method: 'POST', url: `${url}/publish`, headers });
    expect((await getTheme(DEMO_KEYS.globex)).json().motion.pageTransition).toBe('none');

    const rb = await app.inject({ method: 'POST', url: `${url}/versions/1/rollback`, headers });
    expect(rb.statusCode).toBe(200);
    expect(rb.json().version).toMatchObject({ version: 3, note: 'Rollback to v1' });
    expect((await getTheme(DEMO_KEYS.globex)).json().motion.pageTransition).toBe('fade');

    const versions = (await app.inject({ method: 'GET', url: `${url}/versions`, headers })).json().versions;
    expect(versions.map((v: { version: number }) => v.version)).toEqual([3, 2, 1]);
  });
});

describe('database migrations', () => {
  it('opens a database created by the earlier node:sqlite server (no _migrations table)', async () => {
    const { createClient } = await import('@libsql/client');
    const url = `file:${join(dir, `legacy-${n++}.db`).replace(/\\/g, '/')}`;
    const legacy = createClient({ url });
    await legacy.execute('CREATE TABLE tenants (id TEXT PRIMARY KEY, slug TEXT NOT NULL UNIQUE, name TEXT NOT NULL, created_at TEXT NOT NULL)');
    await legacy.execute("INSERT INTO tenants VALUES ('t1', 'old', 'Old Tenant', '2026-01-01')");
    legacy.close();

    const reopened = await openDb({ url });
    const { rows } = await reopened.execute('SELECT name FROM tenants');
    expect(rows.map((r) => r.name)).toEqual(['Old Tenant']); // data kept, no "table already exists"
    const { rows: m } = await reopened.execute('SELECT version FROM _migrations');
    expect(m.map((r) => Number(r.version))).toEqual([1]);
    reopened.close();
  });
});

describe('component tuning', () => {
  it('agency tunes a component per size; clients cannot; guardrails gate publishing; SDKs receive it', async () => {
    const url = `/clients/${ids.clients.acme}/theme`;
    const agency = await login('tenant');
    const draft = (await app.inject({ method: 'GET', url, headers: agency })).json().draft;
    const tuned = { ...draft, components: { ...draft.components, button: { ...draft.components?.button, sizes: { lg: { paddingX: 40 } } } } };
    expect((await app.inject({ method: 'PUT', url: `${url}/draft`, headers: agency, payload: { layer: tuned } })).statusCode).toBe(200);

    // The client editor keeps the agency's tuning but cannot change it.
    const client = await login('acmeEditor');
    const changed = { ...tuned, components: { ...tuned.components, button: { ...tuned.components.button, sizes: { lg: { paddingX: 16 } } } } };
    const refused = await app.inject({ method: 'PUT', url: `${url}/draft`, headers: client, payload: { layer: changed } });
    expect(refused.statusCode).toBe(422);
    expect(refused.json().issues[0].path).toBe('components.button.sizes.lg.paddingX');

    // An unsafe value saves as a draft (with the report) but cannot be published.
    const unsafe = { ...tuned, components: { ...tuned.components, button: { ...tuned.components.button, sizes: { lg: { paddingX: 40, height: 20 } } } } };
    const saved = await app.inject({ method: 'PUT', url: `${url}/draft`, headers: agency, payload: { layer: unsafe } });
    expect(saved.json().components.publishable).toBe(false);
    const blocked = await app.inject({ method: 'POST', url: `${url}/publish`, headers: agency });
    expect(blocked.statusCode).toBe(422);
    expect(blocked.json().details.components.issues[0]).toMatchObject({ path: 'components.button.sizes.lg.height', level: 'error' });

    // Fix it, publish, and the SDK endpoint serves the tuned component with everything else still from the theme.
    await app.inject({ method: 'PUT', url: `${url}/draft`, headers: agency, payload: { layer: tuned } });
    expect((await app.inject({ method: 'POST', url: `${url}/publish`, headers: agency })).statusCode).toBe(200);
    const button = (await getTheme(DEMO_KEYS.acme)).json().components.button;
    expect(button.sizes.lg).toEqual({ height: 48, paddingX: 40, textStyle: 'labelLarge' });
    expect(button.variants.filled).toMatchObject({ container: 'primary', content: 'onPrimary' });
  });
});

describe('tenant base theme', () => {
  it('rebases published clients when the base is published', async () => {
    const headers = await login('tenant');
    await app.inject({
      method: 'PUT',
      url: `/tenants/${ids.tenantId}/theme/draft`,
      headers,
      payload: { layer: { components: { card: { bordered: true } }, assets: { appName: 'Northwind' } } },
    });
    const pub = await app.inject({ method: 'POST', url: `/tenants/${ids.tenantId}/theme/publish`, headers });
    expect(pub.statusCode).toBe(200);
    expect(pub.json().rebased).toHaveLength(2);
    expect(pub.json().skipped).toEqual([]);

    const acme = (await getTheme(DEMO_KEYS.acme)).json();
    expect(acme.components.card.bordered).toBe(true);
    expect(acme.color.light.primary).toBe('#1D4ED8'); // client layer kept
    expect(acme.meta.version).toBe(2);
  });

  it('lets tenants create clients with generated keys', async () => {
    const headers = await login('tenant');
    const res = await app.inject({
      method: 'POST',
      url: `/tenants/${ids.tenantId}/clients`,
      headers,
      payload: { slug: 'initech', name: 'Initech' },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().client.publishableKey).toMatch(/^pk_/);
    // Nothing published yet.
    expect((await getTheme(res.json().client.publishableKey)).statusCode).toBe(404);

    const dup = await app.inject({
      method: 'POST',
      url: `/tenants/${ids.tenantId}/clients`,
      headers,
      payload: { slug: 'initech', name: 'Initech again' },
    });
    expect(dup.statusCode).toBe(409);
  });
});
