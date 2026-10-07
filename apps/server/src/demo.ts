import { DEMO_CLIENTS, DEMO_TENANT_BASE } from '@debdaru07/schema';
import type { Db } from './db.ts';
import { randomBytes } from 'node:crypto';
import { hashPassword, verifyPassword } from './passwords.ts';
import { Repo } from './repo.ts';
import { ThemeService } from './themes.ts';

/** Demo logins. The platform admin password is replaced by ADMIN_PASSWORD when set. */
export const DEMO_USERS = {
  platform: { email: 'admin@dts.local', password: 'admin12345' },
  tenant: { email: 'owner@northwind.test', password: 'northwind123' },
  acmeEditor: { email: 'editor@acme.test', password: 'acme12345' },
} as const;

/** Fixed keys so SDK examples work out of the box. */
export const DEMO_KEYS = { acme: 'pk_demo_acme', globex: 'pk_demo_globex' } as const;

export interface SeedOptions {
  /**
   * Platform admin password: a string uses it, `null` uses the public demo password,
   * `undefined` skips creating the platform admin (production without ADMIN_PASSWORD).
   */
  adminPassword?: string | null;
}

export const MIN_ADMIN_PASSWORD_LENGTH = 12;

export type AdminSync = 'set' | 'created' | 'locked' | 'weak-password-locked' | 'unchanged';

/**
 * Applies ADMIN_PASSWORD to the platform admin on every start, so changing the variable takes effect
 * on the next deploy. In production a missing or short password never leaves the public demo password
 * usable: the account is locked with a random password instead.
 */
export async function syncPlatformAdmin(db: Db, { password, production }: { password?: string; production: boolean }): Promise<AdminSync> {
  const repo = new Repo(db, db);
  const existing = await repo.getUserWithHash(DEMO_USERS.platform.email);
  const strong = !!password && password.length >= MIN_ADMIN_PASSWORD_LENGTH;

  if (password && (strong || !production)) {
    if (existing) {
      if (verifyPassword(password, existing.passwordHash)) return 'unchanged';
      await repo.setPasswordHash(existing.id, hashPassword(password));
      return 'set';
    }
    await repo.createUser({
      email: DEMO_USERS.platform.email,
      name: 'Platform Admin',
      passwordHash: hashPassword(password),
      role: 'platform_admin',
      tenantId: null,
      clientId: null,
    });
    return 'created';
  }

  if (production && existing && (password || verifyPassword(DEMO_USERS.platform.password, existing.passwordHash))) {
    await repo.setPasswordHash(existing.id, hashPassword(randomBytes(32).toString('base64url')));
    return password ? 'weak-password-locked' : 'locked';
  }
  return 'unchanged';
}

/**
 * Seeds one tenant ("Northwind Studio") with a published base theme and two published clients.
 * No-op if the tenant already exists.
 */
export async function seedDemo(db: Db, { adminPassword = null }: SeedOptions = {}) {
  const repo = new Repo(db, db);
  const themes = new ThemeService(repo);
  if ((await repo.listTenants()).some((t) => t.slug === 'northwind')) return { created: false as const };

  const user = (
    role: 'platform_admin' | 'tenant_admin' | 'client_editor',
    name: string,
    creds: { email: string; password: string },
    tenantId: string | null,
    clientId: string | null,
  ) => repo.createUser({ email: creds.email, name, passwordHash: hashPassword(creds.password), role, tenantId, clientId });

  if (adminPassword !== undefined) {
    await user('platform_admin', 'Platform Admin', { ...DEMO_USERS.platform, password: adminPassword ?? DEMO_USERS.platform.password }, null, null);
  }
  const tenant = await repo.createTenant('northwind', 'Northwind Studio');
  const owner = await user('tenant_admin', 'Nora Owner', DEMO_USERS.tenant, tenant.id, null);

  await repo.saveDraft('tenant', tenant.id, DEMO_TENANT_BASE, owner.id);
  await themes.publishTenant(tenant, owner, 'Initial base theme');

  const clients = {} as Record<keyof typeof DEMO_KEYS, string>;
  for (const id of ['acme', 'globex'] as const) {
    const client = await repo.createClient(tenant.id, id, DEMO_CLIENTS[id].name, DEMO_KEYS[id]);
    await repo.saveDraft('client', client.id, DEMO_CLIENTS[id].layer, owner.id);
    await themes.publishClient(client, owner, 'Initial theme');
    clients[id] = client.id;
  }
  await user('client_editor', 'Ada Acme', DEMO_USERS.acmeEditor, tenant.id, clients.acme);

  return { created: true as const, tenantId: tenant.id, clients };
}
