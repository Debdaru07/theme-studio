import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { FastifyInstance } from 'fastify';
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.ts';
import { openDb, type Db } from '../src/db.ts';
import { DEMO_KEYS, DEMO_USERS, seedDemo } from '../src/demo.ts';
import type { LiveLimits } from '../src/events.ts';

let app: FastifyInstance;
let db: Db;
let base: string;
let ids: { tenantId: string; clients: { acme: string; globex: string } };
const dir = mkdtempSync(join(tmpdir(), 'dts-events-'));
let n = 0;
const streams: Stream[] = [];

async function start(live?: Partial<LiveLimits>) {
  app = await buildApp({ db, jwtSecret: 'test-secret-test-secret-test-secret', live });
  base = await app.listen({ port: 0, host: '127.0.0.1' });
}

beforeEach(async () => {
  db = await openDb({ url: `file:${join(dir, `test-${n++}.db`).replace(/\\/g, '/')}` });
  const seeded = await seedDemo(db);
  if (!seeded.created) throw new Error('seed failed');
  ids = seeded;
});

afterEach(async () => {
  for (const s of streams.splice(0)) s.close();
  await app.close();
  db.close();
});

afterAll(() => {
  try {
    rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  } catch {
    /* left for the OS to clean up */
  }
});

interface SseMessage {
  event: string;
  data: string;
}

interface Stream {
  res: Response;
  comments: string[];
  next(timeoutMs?: number): Promise<SseMessage>;
  close(): void;
}

async function open(query: string, headers: Record<string, string> = {}): Promise<Stream> {
  const ctrl = new AbortController();
  const res = await fetch(`${base}/v1/theme/events${query}`, { headers, signal: ctrl.signal });
  const queue: SseMessage[] = [];
  const waiters: ((m: SseMessage) => void)[] = [];
  const comments: string[] = [];
  const deliver = (m: SseMessage) => {
    const w = waiters.shift();
    if (w) w(m);
    else queue.push(m);
  };
  if (res.ok && res.body) {
    void (async () => {
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      try {
        for (let r = await reader.read(); !r.done; r = await reader.read()) {
          buffer += decoder.decode(r.value, { stream: true });
          let i: number;
          while ((i = buffer.indexOf('\n\n')) >= 0) {
            const lines = buffer.slice(0, i).split('\n');
            buffer = buffer.slice(i + 2);
            const msg: SseMessage = { event: 'message', data: '' };
            for (const line of lines) {
              if (line.startsWith(':')) comments.push(line);
              else if (line.startsWith('event: ')) msg.event = line.slice(7);
              else if (line.startsWith('data: ')) msg.data = line.slice(6);
            }
            if (!lines.every((l) => l.startsWith(':'))) deliver(msg);
          }
        }
      } catch {
        /* aborted */
      }
    })();
  }
  const stream: Stream = {
    res,
    comments,
    next: (timeoutMs = 2000) =>
      queue.length
        ? Promise.resolve(queue.shift()!)
        : new Promise((resolve, reject) => {
            const t = setTimeout(() => reject(new Error('no event')), timeoutMs);
            waiters.push((m) => {
              clearTimeout(t);
              resolve(m);
            });
          }),
    close: () => ctrl.abort(),
  };
  streams.push(stream);
  return stream;
}

const hashOf = async (key: string) =>
  ((await (await fetch(`${base}/v1/theme`, { headers: { 'x-theme-key': key } })).json()) as { meta: { hash: string } }).meta.hash;

const hashIn = (m: SseMessage) => (JSON.parse(m.data) as { hash: string | null }).hash;

async function login(who: keyof typeof DEMO_USERS) {
  const res = await app.inject({ method: 'POST', url: '/auth/login', payload: DEMO_USERS[who] });
  return { authorization: `Bearer ${res.json().token}` };
}

describe('GET /v1/theme/events', () => {
  it('streams the current hash with SSE headers, CORS and no buffering', async () => {
    await start();
    const s = await open(`?key=${DEMO_KEYS.acme}`, { origin: 'http://localhost:5173' });
    expect(s.res.status).toBe(200);
    expect(s.res.headers.get('content-type')).toMatch(/^text\/event-stream/);
    expect(s.res.headers.get('cache-control')).toContain('no-cache');
    expect(s.res.headers.get('x-accel-buffering')).toBe('no');
    expect(s.res.headers.get('access-control-allow-origin')).toBe('http://localhost:5173');
    const first = await s.next();
    expect(first.event).toBe('theme');
    expect(hashIn(first)).toBe(await hashOf(DEMO_KEYS.acme));
  });

  it('accepts the X-Theme-Key header and rejects missing or unknown keys', async () => {
    await start();
    const s = await open('', { 'x-theme-key': DEMO_KEYS.globex });
    expect((await s.next()).event).toBe('theme');
    expect((await open('')).res.status).toBe(401);
    expect((await open('?key=pk_nope')).res.status).toBe(401);
  });

  it('sends the new hash when the client publishes, and nothing to other clients', async () => {
    await start();
    const acme = await open(`?key=${DEMO_KEYS.acme}`);
    const globex = await open(`?key=${DEMO_KEYS.globex}`);
    await acme.next();
    await globex.next();

    const headers = await login('acmeEditor');
    const url = `/clients/${ids.clients.acme}/theme`;
    await app.inject({ method: 'PUT', url: `${url}/draft`, headers, payload: { layer: { color: { seed: { primary: '#7C3AED' } } } } });
    expect((await app.inject({ method: 'POST', url: `${url}/publish`, headers })).statusCode).toBe(200);

    expect(hashIn(await acme.next())).toBe(await hashOf(DEMO_KEYS.acme));
    await expect(globex.next(300)).rejects.toThrow('no event');
  });

  it('fans out a tenant base publish to every client under the tenant', async () => {
    await start();
    const acme = await open(`?key=${DEMO_KEYS.acme}`);
    const globex = await open(`?key=${DEMO_KEYS.globex}`);
    const before = [hashIn(await acme.next()), hashIn(await globex.next())];

    const headers = await login('tenant');
    await app.inject({
      method: 'PUT',
      url: `/tenants/${ids.tenantId}/theme/draft`,
      headers,
      payload: { layer: { components: { card: { bordered: true } }, assets: { appName: 'Northwind' } } },
    });
    expect((await app.inject({ method: 'POST', url: `/tenants/${ids.tenantId}/theme/publish`, headers })).statusCode).toBe(200);

    const after = [hashIn(await acme.next()), hashIn(await globex.next())];
    expect(after).toEqual([await hashOf(DEMO_KEYS.acme), await hashOf(DEMO_KEYS.globex)]);
    expect(after[0]).not.toBe(before[0]);
    expect(after[1]).not.toBe(before[1]);
  });

  it('sends the restored hash on rollback', async () => {
    await start();
    const headers = await login('tenant');
    const url = `/clients/${ids.clients.globex}/theme`;
    await app.inject({ method: 'PUT', url: `${url}/draft`, headers, payload: { layer: { motion: { pageTransition: 'none' } } } });
    await app.inject({ method: 'POST', url: `${url}/publish`, headers });

    const s = await open(`?key=${DEMO_KEYS.globex}`);
    const current = hashIn(await s.next());
    await app.inject({ method: 'POST', url: `${url}/versions/1/rollback`, headers });
    const restored = hashIn(await s.next());
    expect(restored).not.toBe(current);
    expect(restored).toBe(await hashOf(DEMO_KEYS.globex));
  });

  it('sends revoked and closes when the key no longer belongs to the client', async () => {
    await start();
    const s = await open(`?key=${DEMO_KEYS.acme}`);
    await s.next();
    await db.execute({ sql: 'UPDATE clients SET publishable_key = ? WHERE id = ?', args: ['pk_rotated', ids.clients.acme] });
    const headers = await login('acmeEditor');
    await app.inject({ method: 'POST', url: `/clients/${ids.clients.acme}/theme/versions/1/rollback`, headers });
    expect((await s.next()).event).toBe('revoked');
  });

  it('sends heartbeat comments', async () => {
    await start({ heartbeatMs: 50 });
    const s = await open(`?key=${DEMO_KEYS.acme}`);
    await s.next();
    await new Promise((r) => setTimeout(r, 180));
    expect(s.comments.filter((c) => c === ': ping').length).toBeGreaterThanOrEqual(2);
  });

  it('caps connections per key and per IP, and frees the slot on disconnect', async () => {
    await start({ maxPerKey: 2, maxPerIp: 3 });
    const first = await open(`?key=${DEMO_KEYS.acme}`);
    await open(`?key=${DEMO_KEYS.acme}`);
    expect((await open(`?key=${DEMO_KEYS.acme}`)).res.status).toBe(429);
    await open(`?key=${DEMO_KEYS.globex}`);
    expect((await open(`?key=${DEMO_KEYS.globex}`)).res.status).toBe(429);

    first.close();
    await new Promise((r) => setTimeout(r, 100));
    const again = await open(`?key=${DEMO_KEYS.acme}`);
    expect(again.res.status).toBe(200);
    expect((await again.next()).event).toBe('theme');
  });
});
