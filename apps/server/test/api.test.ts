import type { FastifyInstance } from 'fastify';
import { beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.ts';
import { openDb } from '../src/db.ts';
import { DEMO_KEYS, DEMO_USERS, seedDemo } from '../src/demo.ts';

let app: FastifyInstance;
let ids: { tenantId: string; clients: { acme: string; globex: string } };

beforeEach(async () => {
  const db = openDb(':memory:');
  const seeded = seedDemo(db);
  if (!seeded.created) throw new Error('seed failed');
  ids = seeded;
  app = await buildApp({ db, jwtSecret: 'test-secret-test-secret-test-secret' });
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
