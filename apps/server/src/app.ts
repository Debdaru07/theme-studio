import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { ThemeValidationError, type ThemeInput } from '@dts/schema';
import Fastify, { type FastifyInstance, type FastifyRequest } from 'fastify';
import { z, ZodError } from 'zod';
import type { Db } from './db.ts';
import { HttpError, forbidden, notFound } from './errors.ts';
import { hashPassword, verifyPassword } from './passwords.ts';
import { Repo, type Client, type User } from './repo.ts';
import { ThemeService } from './themes.ts';

export interface AppOptions {
  db: Db;
  jwtSecret: string;
  logger?: boolean;
}

// ── Request bodies ───────────────────────────────────────────────────────────

const slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'lowercase letters, digits and dashes').max(48);
const LoginBody = z.object({ email: z.string().email(), password: z.string().min(1) });
const CreateTenantBody = z.object({ slug, name: z.string().min(1).max(120) });
const CreateClientBody = CreateTenantBody;
const CreateUserBody = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(120),
  password: z.string().min(8),
});
const LayerBody = z.object({ layer: z.record(z.string(), z.unknown()) });
const PublishBody = z.object({ note: z.string().max(500).optional() }).optional();
const IdParams = z.object({ id: z.string().min(1) });
const VersionParams = z.object({ id: z.string().min(1), version: z.coerce.number().int().min(1) });

// ── Access rules ─────────────────────────────────────────────────────────────

const canManageTenant = (u: User, tenantId: string) =>
  u.role === 'platform_admin' || (u.role === 'tenant_admin' && u.tenantId === tenantId);
const canViewTenant = (u: User, tenantId: string) => canManageTenant(u, tenantId) || u.tenantId === tenantId;
const canEditClient = (u: User, c: Client) =>
  canManageTenant(u, c.tenantId) || (u.role === 'client_editor' && u.clientId === c.id);

export async function buildApp(opts: AppOptions): Promise<FastifyInstance> {
  const app = Fastify({ logger: opts.logger ?? false });
  const repo = new Repo(opts.db);
  const themes = new ThemeService(opts.db, repo);

  await app.register(cors, {
    // Bearer tokens, not cookies, so reflecting any origin is safe. SDKs need to read ETag.
    origin: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'],
    exposedHeaders: ['ETag'],
    allowedHeaders: ['Authorization', 'Content-Type', 'X-Theme-Key', 'If-None-Match'],
  });
  await app.register(jwt, { secret: opts.jwtSecret, sign: { expiresIn: '12h' } });

  app.setErrorHandler((err, _req, reply) => {
    if (err instanceof HttpError) {
      return reply.status(err.statusCode).send({ error: err.message, ...(err.details ? { details: err.details } : {}) });
    }
    if (err instanceof ThemeValidationError) {
      return reply.status(422).send({ error: 'Invalid theme', issues: err.issues });
    }
    if (err instanceof ZodError) {
      return reply.status(400).send({
        error: 'Invalid request',
        issues: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      });
    }
    const status = (err as { statusCode?: number }).statusCode;
    if (status && status < 500) return reply.status(status).send({ error: (err as Error).message });
    app.log.error(err);
    return reply.status(500).send({ error: 'Internal server error' });
  });

  const auth = async (req: FastifyRequest): Promise<User> => {
    try {
      const { sub } = await req.jwtVerify<{ sub: string }>();
      const user = repo.getUser(sub);
      if (user) return user;
    } catch {
      /* fall through */
    }
    throw new HttpError(401, 'Unauthorized');
  };

  const loadClient = async (req: FastifyRequest) => {
    const user = await auth(req);
    const client = themes.client(IdParams.parse(req.params).id);
    if (!canEditClient(user, client)) throw forbidden();
    return { user, client };
  };

  const loadTenant = async (req: FastifyRequest, need: 'view' | 'manage') => {
    const user = await auth(req);
    const tenant = themes.tenant(IdParams.parse(req.params).id);
    const ok = need === 'manage' ? canManageTenant(user, tenant.id) : canViewTenant(user, tenant.id);
    if (!ok) throw forbidden();
    return { user, tenant };
  };

  // ── Health & auth ──────────────────────────────────────────────────────────

  app.get('/health', async () => ({ ok: true }));

  app.post('/auth/login', async (req) => {
    const { email, password } = LoginBody.parse(req.body);
    const found = repo.getUserWithHash(email);
    if (!found || !verifyPassword(password, found.passwordHash)) throw new HttpError(401, 'Invalid email or password');
    const { passwordHash: _h, ...user } = found;
    return { token: app.jwt.sign({ sub: user.id }), user };
  });

  app.get('/me', async (req) => ({ user: await auth(req) }));

  // ── Tenants ────────────────────────────────────────────────────────────────

  app.get('/tenants', async (req) => {
    const user = await auth(req);
    const all = repo.listTenants();
    return { tenants: user.role === 'platform_admin' ? all : all.filter((t) => t.id === user.tenantId) };
  });

  app.post('/tenants', async (req, reply) => {
    const user = await auth(req);
    if (user.role !== 'platform_admin') throw forbidden();
    const body = CreateTenantBody.parse(req.body);
    reply.status(201);
    return { tenant: guardUnique(() => repo.createTenant(body.slug, body.name), 'Tenant slug') };
  });

  app.post('/tenants/:id/users', async (req, reply) => {
    const { tenant } = await loadTenant(req, 'manage');
    const body = CreateUserBody.parse(req.body);
    reply.status(201);
    const user = guardUnique(
      () =>
        repo.createUser({ ...body, passwordHash: hashPassword(body.password), role: 'tenant_admin', tenantId: tenant.id, clientId: null }),
      'Email',
    );
    return { user };
  });

  app.get('/tenants/:id/clients', async (req) => {
    const { user, tenant } = await loadTenant(req, 'view');
    const clients = repo.listClients(tenant.id).filter((c) => canEditClient(user, c));
    return {
      clients: clients.map((c) => ({ ...c, published: repo.listVersions('client', c.id)[0] ?? null })),
    };
  });

  app.post('/tenants/:id/clients', async (req, reply) => {
    const { tenant } = await loadTenant(req, 'manage');
    const body = CreateClientBody.parse(req.body);
    reply.status(201);
    return { client: guardUnique(() => repo.createClient(tenant.id, body.slug, body.name), 'Client slug') };
  });

  // ── Tenant base theme ──────────────────────────────────────────────────────

  app.get('/tenants/:id/theme', async (req) => {
    const { tenant } = await loadTenant(req, 'view');
    const published = repo.getVersion('tenant', tenant.id);
    const draft = repo.getDraft('tenant', tenant.id);
    return {
      tenant,
      draft: draft?.layer ?? published?.layer ?? {},
      draftUpdatedAt: draft?.updatedAt ?? null,
      published: published ? summary(published) : null,
      publishedLayer: published?.layer ?? null,
      hasUnpublishedChanges: !!draft && JSON.stringify(draft.layer) !== JSON.stringify(published?.layer ?? {}),
    };
  });

  app.put('/tenants/:id/theme/draft', async (req) => {
    const { user, tenant } = await loadTenant(req, 'manage');
    return themes.saveDraft('tenant', tenant.id, LayerBody.parse(req.body).layer as ThemeInput, user);
  });

  app.post('/tenants/:id/theme/preview', async (req) => {
    await loadTenant(req, 'manage');
    return themes.previewTenant(LayerBody.parse(req.body).layer as ThemeInput);
  });

  app.post('/tenants/:id/theme/publish', async (req) => {
    const { user, tenant } = await loadTenant(req, 'manage');
    return themes.publishTenant(tenant, user, PublishBody.parse(req.body)?.note ?? null);
  });

  app.get('/tenants/:id/theme/versions', async (req) => {
    const { tenant } = await loadTenant(req, 'view');
    return { versions: repo.listVersions('tenant', tenant.id) };
  });

  // ── Clients ────────────────────────────────────────────────────────────────

  app.get('/clients/:id', async (req) => {
    const { client } = await loadClient(req);
    return { client, tenant: themes.tenant(client.tenantId) };
  });

  app.get('/clients/:id/users', async (req) => {
    const { client } = await loadClient(req);
    return { users: repo.listClientUsers(client.id) };
  });

  app.post('/clients/:id/users', async (req, reply) => {
    const { user, client } = await loadClient(req);
    if (!canManageTenant(user, client.tenantId)) throw forbidden();
    const body = CreateUserBody.parse(req.body);
    reply.status(201);
    const created = guardUnique(
      () =>
        repo.createUser({
          ...body,
          passwordHash: hashPassword(body.password),
          role: 'client_editor',
          tenantId: client.tenantId,
          clientId: client.id,
        }),
      'Email',
    );
    return { user: created };
  });

  // ── Client theme ───────────────────────────────────────────────────────────

  app.get('/clients/:id/theme', async (req) => {
    const { client } = await loadClient(req);
    const published = repo.getVersion('client', client.id);
    const draft = repo.getDraft('client', client.id);
    return {
      client,
      /** Published tenant base layer; the admin resolves `[base, draft]` locally for instant preview. */
      base: themes.baseLayer(client.tenantId),
      draft: draft?.layer ?? published?.layer ?? {},
      draftUpdatedAt: draft?.updatedAt ?? null,
      published: published ? summary(published) : null,
      publishedLayer: published?.layer ?? null,
      hasUnpublishedChanges: !!draft && JSON.stringify(draft.layer) !== JSON.stringify(published?.layer ?? {}),
    };
  });

  app.put('/clients/:id/theme/draft', async (req) => {
    const { user, client } = await loadClient(req);
    return themes.saveDraft('client', client.id, LayerBody.parse(req.body).layer as ThemeInput, user);
  });

  app.post('/clients/:id/theme/preview', async (req) => {
    const { client } = await loadClient(req);
    return themes.previewClient(client, LayerBody.parse(req.body).layer as ThemeInput);
  });

  app.post('/clients/:id/theme/publish', async (req) => {
    const { user, client } = await loadClient(req);
    return themes.publishClient(client, user, PublishBody.parse(req.body)?.note ?? null);
  });

  app.get('/clients/:id/theme/versions', async (req) => {
    const { client } = await loadClient(req);
    return { versions: repo.listVersions('client', client.id) };
  });

  app.get('/clients/:id/theme/versions/:version', async (req) => {
    const { client } = await loadClient(req);
    const { version } = VersionParams.parse(req.params);
    const v = repo.getVersion('client', client.id, version) ?? throwErr(notFound(`Version ${version}`));
    return { version: v };
  });

  app.post('/clients/:id/theme/versions/:version/rollback', async (req) => {
    const { user, client } = await loadClient(req);
    return themes.rollbackClient(client, VersionParams.parse(req.params).version, user);
  });

  // ── Public SDK endpoint ────────────────────────────────────────────────────

  app.get('/v1/theme', async (req, reply) => {
    const key =
      (req.headers['x-theme-key'] as string | undefined) ?? (req.query as Record<string, string | undefined>).key;
    if (!key) throw new HttpError(401, 'Missing X-Theme-Key header');
    const client = repo.getClientByKey(key);
    if (!client) throw new HttpError(401, 'Unknown theme key');
    const published = repo.getPublishedJson(client.id);
    if (!published) throw new HttpError(404, 'No published theme for this client');

    const etag = `"${published.hash}"`;
    reply.header('ETag', etag).header('Cache-Control', 'no-cache');
    const ifNoneMatch = req.headers['if-none-match'];
    if (ifNoneMatch && ifNoneMatch.split(',').some((t) => t.trim().replace(/^W\//, '') === etag)) {
      return reply.status(304).send();
    }
    return reply.type('application/json').send(published.resolved);
  });

  return app;
}

const summary = <T extends { version: number; hash: string; note: string | null; publishedAt: string; publishedBy: string | null }>(
  v: T,
) => ({ version: v.version, hash: v.hash, note: v.note, publishedAt: v.publishedAt, publishedBy: v.publishedBy });

function guardUnique<T>(fn: () => T, what: string): T {
  try {
    return fn();
  } catch (e) {
    if (/UNIQUE constraint failed/.test((e as Error).message)) throw new HttpError(409, `${what} already exists`);
    throw e;
  }
}

function throwErr(e: Error): never {
  throw e;
}
