import { randomBytes, randomUUID } from 'node:crypto';
import type { InValue, Row } from '@libsql/client';
import type { Theme, ThemeInput } from '@dts/schema';
import { tx, type Db, type Executor } from './db.ts';

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

/**
 * Thin data-access layer over libSQL. Keeps SQL out of route handlers. `withTx` gives a Repo bound
 * to a write transaction.
 */
export class Repo {
  constructor(
    private readonly exec: Executor,
    private readonly db?: Db,
  ) {}

  /** Runs `fn` with a Repo bound to one write transaction. */
  withTx<T>(fn: (repo: Repo) => Promise<T>): Promise<T> {
    if (!this.db) return fn(this); // already inside a transaction
    return tx(this.db, (t) => fn(new Repo(t)));
  }

  private async all<T>(sql: string, args: InValue[] = []): Promise<T[]> {
    const rs = await this.exec.execute({ sql, args });
    return rs.rows.map((r) => plain<T>(r, rs.columns));
  }

  private async one<T>(sql: string, args: InValue[] = []): Promise<T | undefined> {
    return (await this.all<T>(sql, args))[0];
  }

  private async run(sql: string, args: InValue[] = []): Promise<void> {
    await this.exec.execute({ sql, args });
  }

  // ── Tenants ────────────────────────────────────────────────────────────────

  async createTenant(slug: string, name: string): Promise<Tenant> {
    const t = { id: randomUUID(), slug, name, createdAt: now() };
    await this.run('INSERT INTO tenants (id, slug, name, created_at) VALUES (?, ?, ?, ?)', [t.id, slug, name, t.createdAt]);
    return t;
  }

  listTenants(): Promise<Tenant[]> {
    return this.all('SELECT id, slug, name, created_at AS createdAt FROM tenants ORDER BY name');
  }

  getTenant(id: string): Promise<Tenant | undefined> {
    return this.one('SELECT id, slug, name, created_at AS createdAt FROM tenants WHERE id = ?', [id]);
  }

  // ── Clients ────────────────────────────────────────────────────────────────

  async createClient(tenantId: string, slug: string, name: string, publishableKey = newPublishableKey()): Promise<Client> {
    const c = { id: randomUUID(), tenantId, slug, name, publishableKey, createdAt: now() };
    await this.run(
      'INSERT INTO clients (id, tenant_id, slug, name, publishable_key, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [c.id, tenantId, slug, name, publishableKey, c.createdAt],
    );
    return c;
  }

  private static CLIENT_COLS =
    'id, tenant_id AS tenantId, slug, name, publishable_key AS publishableKey, created_at AS createdAt';

  listClients(tenantId: string): Promise<Client[]> {
    return this.all(`SELECT ${Repo.CLIENT_COLS} FROM clients WHERE tenant_id = ? ORDER BY name`, [tenantId]);
  }

  getClient(id: string): Promise<Client | undefined> {
    return this.one(`SELECT ${Repo.CLIENT_COLS} FROM clients WHERE id = ?`, [id]);
  }

  getClientByKey(key: string): Promise<Client | undefined> {
    return this.one(`SELECT ${Repo.CLIENT_COLS} FROM clients WHERE publishable_key = ?`, [key]);
  }

  // ── Users ──────────────────────────────────────────────────────────────────

  async createUser(u: Omit<User, 'id'> & { passwordHash: string }): Promise<User> {
    const id = randomUUID();
    await this.run(
      'INSERT INTO users (id, email, name, password_hash, role, tenant_id, client_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, u.email, u.name, u.passwordHash, u.role, u.tenantId, u.clientId, now()],
    );
    return { id, email: u.email, name: u.name, role: u.role, tenantId: u.tenantId, clientId: u.clientId };
  }

  private static USER_COLS = 'id, email, name, role, tenant_id AS tenantId, client_id AS clientId';

  getUser(id: string): Promise<User | undefined> {
    return this.one(`SELECT ${Repo.USER_COLS} FROM users WHERE id = ?`, [id]);
  }

  getUserWithHash(email: string): Promise<(User & { passwordHash: string }) | undefined> {
    return this.one(`SELECT ${Repo.USER_COLS}, password_hash AS passwordHash FROM users WHERE email = ?`, [email]);
  }

  listClientUsers(clientId: string): Promise<User[]> {
    return this.all(`SELECT ${Repo.USER_COLS} FROM users WHERE client_id = ? ORDER BY name`, [clientId]);
  }

  // ── Drafts ─────────────────────────────────────────────────────────────────

  async getDraft(ownerType: OwnerType, ownerId: string): Promise<Draft | undefined> {
    const row = await this.one<{ layer: string; updatedAt: string; updatedBy: string | null }>(
      'SELECT layer, updated_at AS updatedAt, updated_by AS updatedBy FROM drafts WHERE owner_type = ? AND owner_id = ?',
      [ownerType, ownerId],
    );
    return row && { ...row, layer: JSON.parse(row.layer) as ThemeInput };
  }

  async saveDraft(ownerType: OwnerType, ownerId: string, layer: ThemeInput, userId: string | null): Promise<Draft> {
    const d = { layer, updatedAt: now(), updatedBy: userId };
    await this.run(
      `INSERT INTO drafts (owner_type, owner_id, layer, updated_at, updated_by) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT (owner_type, owner_id) DO UPDATE SET layer = excluded.layer, updated_at = excluded.updated_at, updated_by = excluded.updated_by`,
      [ownerType, ownerId, JSON.stringify(layer), d.updatedAt, userId],
    );
    return d;
  }

  // ── Versions ───────────────────────────────────────────────────────────────

  private static VERSION_SUMMARY_COLS = `v.version, v.hash, v.note, v.published_at AS publishedAt, u.name AS publishedBy`;

  listVersions(ownerType: OwnerType, ownerId: string): Promise<VersionSummary[]> {
    return this.all(
      `SELECT ${Repo.VERSION_SUMMARY_COLS} FROM versions v LEFT JOIN users u ON u.id = v.published_by
       WHERE v.owner_type = ? AND v.owner_id = ? ORDER BY v.version DESC`,
      [ownerType, ownerId],
    );
  }

  async getVersion(ownerType: OwnerType, ownerId: string, version?: number): Promise<Version | undefined> {
    const row = await this.one<VersionSummary & { layer: string; resolved: string }>(
      `SELECT ${Repo.VERSION_SUMMARY_COLS}, v.layer, v.resolved FROM versions v LEFT JOIN users u ON u.id = v.published_by
       WHERE v.owner_type = ? AND v.owner_id = ? ${version === undefined ? '' : 'AND v.version = ?'}
       ORDER BY v.version DESC LIMIT 1`,
      version === undefined ? [ownerType, ownerId] : [ownerType, ownerId, version],
    );
    return row && { ...row, layer: JSON.parse(row.layer), resolved: JSON.parse(row.resolved) };
  }

  /** Raw resolved JSON + hash of the latest client version, for the hot public endpoint. */
  getPublishedJson(clientId: string): Promise<{ resolved: string; hash: string } | undefined> {
    return this.one(
      `SELECT resolved, hash FROM versions WHERE owner_type = 'client' AND owner_id = ? ORDER BY version DESC LIMIT 1`,
      [clientId],
    );
  }

  async nextVersion(ownerType: OwnerType, ownerId: string): Promise<number> {
    const row = await this.one<{ next: number }>(
      'SELECT COALESCE(MAX(version), 0) + 1 AS next FROM versions WHERE owner_type = ? AND owner_id = ?',
      [ownerType, ownerId],
    );
    return Number(row?.next ?? 1);
  }

  insertVersion(
    ownerType: OwnerType,
    ownerId: string,
    v: { version: number; layer: ThemeInput; resolved: Theme; hash: string; note: string | null; publishedAt: string },
    userId: string | null,
  ): Promise<void> {
    return this.run(
      `INSERT INTO versions (owner_type, owner_id, version, layer, resolved, hash, note, published_at, published_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [ownerType, ownerId, v.version, JSON.stringify(v.layer), JSON.stringify(v.resolved), v.hash, v.note, v.publishedAt, userId],
    );
  }

  /** Clients of a tenant that have at least one published version. */
  async publishedClientIds(tenantId: string): Promise<string[]> {
    const rows = await this.all<{ id: string }>(
      `SELECT DISTINCT c.id FROM clients c JOIN versions v ON v.owner_type = 'client' AND v.owner_id = c.id
       WHERE c.tenant_id = ?`,
      [tenantId],
    );
    return rows.map((r) => r.id);
  }
}

/** libSQL rows are array-like with named accessors; convert to a plain object. */
function plain<T>(row: Row, columns: string[]): T {
  const out: Record<string, unknown> = {};
  columns.forEach((c, i) => {
    const v = row[i];
    out[c] = typeof v === 'bigint' ? Number(v) : v;
  });
  return out as T;
}

export function newPublishableKey(): string {
  return `pk_${randomBytes(18).toString('base64url')}`;
}
