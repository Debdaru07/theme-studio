import { randomBytes, randomUUID } from 'node:crypto';
import type { Theme, ThemeInput } from '@dts/schema';
import type { Db } from './db.ts';

export type Role = 'platform_admin' | 'tenant_admin' | 'client_editor';
export type OwnerType = 'tenant' | 'client';

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  createdAt: string;
}

export interface Client {
  id: string;
  tenantId: string;
  slug: string;
  name: string;
  publishableKey: string;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  tenantId: string | null;
  clientId: string | null;
}

export interface Draft {
  layer: ThemeInput;
  updatedAt: string;
  updatedBy: string | null;
}

export interface VersionSummary {
  version: number;
  hash: string;
  note: string | null;
  publishedAt: string;
  publishedBy: string | null;
}

export interface Version extends VersionSummary {
  layer: ThemeInput;
  resolved: Theme;
}

const now = () => new Date().toISOString();

/** Thin data-access layer over SQLite. Keeps SQL out of route handlers so the store can be swapped. */
export class Repo {
  constructor(private readonly db: Db) {}

  // ── Tenants ────────────────────────────────────────────────────────────────

  createTenant(slug: string, name: string): Tenant {
    const t = { id: randomUUID(), slug, name, createdAt: now() };
    this.db.prepare('INSERT INTO tenants (id, slug, name, created_at) VALUES (?, ?, ?, ?)').run(t.id, slug, name, t.createdAt);
    return t;
  }

  listTenants(): Tenant[] {
    return this.db.prepare('SELECT id, slug, name, created_at AS createdAt FROM tenants ORDER BY name').all() as unknown as Tenant[];
  }

  getTenant(id: string): Tenant | undefined {
    return this.db.prepare('SELECT id, slug, name, created_at AS createdAt FROM tenants WHERE id = ?').get(id) as
      | Tenant
      | undefined;
  }

  // ── Clients ────────────────────────────────────────────────────────────────

  createClient(tenantId: string, slug: string, name: string, publishableKey = newPublishableKey()): Client {
    const c = { id: randomUUID(), tenantId, slug, name, publishableKey, createdAt: now() };
    this.db
      .prepare('INSERT INTO clients (id, tenant_id, slug, name, publishable_key, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(c.id, tenantId, slug, name, publishableKey, c.createdAt);
    return c;
  }

  private static CLIENT_COLS =
    'id, tenant_id AS tenantId, slug, name, publishable_key AS publishableKey, created_at AS createdAt';

  listClients(tenantId: string): Client[] {
    return this.db
      .prepare(`SELECT ${Repo.CLIENT_COLS} FROM clients WHERE tenant_id = ? ORDER BY name`)
      .all(tenantId) as unknown as Client[];
  }

  getClient(id: string): Client | undefined {
    return this.db.prepare(`SELECT ${Repo.CLIENT_COLS} FROM clients WHERE id = ?`).get(id) as Client | undefined;
  }

  getClientByKey(key: string): Client | undefined {
    return this.db.prepare(`SELECT ${Repo.CLIENT_COLS} FROM clients WHERE publishable_key = ?`).get(key) as
      | Client
      | undefined;
  }

  // ── Users ──────────────────────────────────────────────────────────────────

  createUser(u: Omit<User, 'id'> & { passwordHash: string }): User {
    const id = randomUUID();
    this.db
      .prepare(
        'INSERT INTO users (id, email, name, password_hash, role, tenant_id, client_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      )
      .run(id, u.email, u.name, u.passwordHash, u.role, u.tenantId, u.clientId, now());
    return { id, email: u.email, name: u.name, role: u.role, tenantId: u.tenantId, clientId: u.clientId };
  }

  private static USER_COLS = 'id, email, name, role, tenant_id AS tenantId, client_id AS clientId';

  getUser(id: string): User | undefined {
    return this.db.prepare(`SELECT ${Repo.USER_COLS} FROM users WHERE id = ?`).get(id) as User | undefined;
  }

  getUserWithHash(email: string): (User & { passwordHash: string }) | undefined {
    return this.db
      .prepare(`SELECT ${Repo.USER_COLS}, password_hash AS passwordHash FROM users WHERE email = ?`)
      .get(email) as (User & { passwordHash: string }) | undefined;
  }

  listClientUsers(clientId: string): User[] {
    return this.db
      .prepare(`SELECT ${Repo.USER_COLS} FROM users WHERE client_id = ? ORDER BY name`)
      .all(clientId) as unknown as User[];
  }

  // ── Drafts ─────────────────────────────────────────────────────────────────

  getDraft(ownerType: OwnerType, ownerId: string): Draft | undefined {
    const row = this.db
      .prepare('SELECT layer, updated_at AS updatedAt, updated_by AS updatedBy FROM drafts WHERE owner_type = ? AND owner_id = ?')
      .get(ownerType, ownerId) as { layer: string; updatedAt: string; updatedBy: string | null } | undefined;
    return row && { ...row, layer: JSON.parse(row.layer) as ThemeInput };
  }

  saveDraft(ownerType: OwnerType, ownerId: string, layer: ThemeInput, userId: string | null): Draft {
    const d = { layer, updatedAt: now(), updatedBy: userId };
    this.db
      .prepare(
        `INSERT INTO drafts (owner_type, owner_id, layer, updated_at, updated_by) VALUES (?, ?, ?, ?, ?)
         ON CONFLICT (owner_type, owner_id) DO UPDATE SET layer = excluded.layer, updated_at = excluded.updated_at, updated_by = excluded.updated_by`,
      )
      .run(ownerType, ownerId, JSON.stringify(layer), d.updatedAt, userId);
    return d;
  }

  // ── Versions ───────────────────────────────────────────────────────────────

  private static VERSION_SUMMARY_COLS = `v.version, v.hash, v.note, v.published_at AS publishedAt, u.name AS publishedBy`;

  listVersions(ownerType: OwnerType, ownerId: string): VersionSummary[] {
    return this.db
      .prepare(
        `SELECT ${Repo.VERSION_SUMMARY_COLS} FROM versions v LEFT JOIN users u ON u.id = v.published_by
         WHERE v.owner_type = ? AND v.owner_id = ? ORDER BY v.version DESC`,
      )
      .all(ownerType, ownerId) as unknown as VersionSummary[];
  }

  getVersion(ownerType: OwnerType, ownerId: string, version?: number): Version | undefined {
    const row = this.db
      .prepare(
        `SELECT ${Repo.VERSION_SUMMARY_COLS}, v.layer, v.resolved FROM versions v LEFT JOIN users u ON u.id = v.published_by
         WHERE v.owner_type = ? AND v.owner_id = ? ${version === undefined ? '' : 'AND v.version = ?'}
         ORDER BY v.version DESC LIMIT 1`,
      )
      .get(...([ownerType, ownerId, version].filter((x) => x !== undefined) as (string | number)[])) as
      | (VersionSummary & { layer: string; resolved: string })
      | undefined;
    return row && { ...row, layer: JSON.parse(row.layer), resolved: JSON.parse(row.resolved) };
  }

  /** Raw resolved JSON + hash of the latest client version, for the hot public endpoint. */
  getPublishedJson(clientId: string): { resolved: string; hash: string } | undefined {
    return this.db
      .prepare(
        `SELECT resolved, hash FROM versions WHERE owner_type = 'client' AND owner_id = ? ORDER BY version DESC LIMIT 1`,
      )
      .get(clientId) as { resolved: string; hash: string } | undefined;
  }

  nextVersion(ownerType: OwnerType, ownerId: string): number {
    const row = this.db
      .prepare('SELECT COALESCE(MAX(version), 0) + 1 AS next FROM versions WHERE owner_type = ? AND owner_id = ?')
      .get(ownerType, ownerId) as { next: number };
    return row.next;
  }

  insertVersion(
    ownerType: OwnerType,
    ownerId: string,
    v: { version: number; layer: ThemeInput; resolved: Theme; hash: string; note: string | null; publishedAt: string },
    userId: string | null,
  ) {
    this.db
      .prepare(
        `INSERT INTO versions (owner_type, owner_id, version, layer, resolved, hash, note, published_at, published_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(ownerType, ownerId, v.version, JSON.stringify(v.layer), JSON.stringify(v.resolved), v.hash, v.note, v.publishedAt, userId);
  }

  /** Clients of a tenant that have at least one published version. */
  publishedClientIds(tenantId: string): string[] {
    return (
      this.db
        .prepare(
          `SELECT DISTINCT c.id FROM clients c JOIN versions v ON v.owner_type = 'client' AND v.owner_id = c.id
           WHERE c.tenant_id = ?`,
        )
        .all(tenantId) as { id: string }[]
    ).map((r) => r.id);
  }
}

export function newPublishableKey(): string {
  return `pk_${randomBytes(18).toString('base64url')}`;
}
