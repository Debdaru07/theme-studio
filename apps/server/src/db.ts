import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createClient, type Client, type InStatement, type Transaction } from '@libsql/client';

/**
 * libSQL: a local SQLite file in development (`file:data/dts.db`) and Turso in production
 * (`libsql://…` + auth token). Same SQL and driver in both.
 */
export type Db = Client;
export type Executor = Pick<Client | Transaction, 'execute'>;

const MIGRATIONS: string[] = [
  `
  CREATE TABLE tenants (
    id          TEXT PRIMARY KEY,
    slug        TEXT NOT NULL UNIQUE,
    name        TEXT NOT NULL,
    created_at  TEXT NOT NULL
  );

  CREATE TABLE clients (
    id               TEXT PRIMARY KEY,
    tenant_id        TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    slug             TEXT NOT NULL,
    name             TEXT NOT NULL,
    publishable_key  TEXT NOT NULL UNIQUE,
    created_at       TEXT NOT NULL,
    UNIQUE (tenant_id, slug)
  );

  CREATE TABLE users (
    id             TEXT PRIMARY KEY,
    email          TEXT NOT NULL UNIQUE COLLATE NOCASE,
    name           TEXT NOT NULL,
    password_hash  TEXT NOT NULL,
    role           TEXT NOT NULL CHECK (role IN ('platform_admin', 'tenant_admin', 'client_editor')),
    tenant_id      TEXT REFERENCES tenants(id) ON DELETE CASCADE,
    client_id      TEXT REFERENCES clients(id) ON DELETE CASCADE,
    created_at     TEXT NOT NULL
  );

  -- One editable draft per tenant base theme / client theme.
  CREATE TABLE drafts (
    owner_type  TEXT NOT NULL CHECK (owner_type IN ('tenant', 'client')),
    owner_id    TEXT NOT NULL,
    layer       TEXT NOT NULL,
    updated_at  TEXT NOT NULL,
    updated_by  TEXT REFERENCES users(id) ON DELETE SET NULL,
    PRIMARY KEY (owner_type, owner_id)
  );

  -- Immutable published versions. Client versions store the resolved theme served to SDKs.
  CREATE TABLE versions (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_type    TEXT NOT NULL CHECK (owner_type IN ('tenant', 'client')),
    owner_id      TEXT NOT NULL,
    version       INTEGER NOT NULL,
    layer         TEXT NOT NULL,
    resolved      TEXT NOT NULL,
    hash          TEXT NOT NULL,
    note          TEXT,
    published_at  TEXT NOT NULL,
    published_by  TEXT REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE (owner_type, owner_id, version)
  );
  `,
];

export interface DbOptions {
  url: string;
  authToken?: string;
}

export async function openDb({ url, authToken }: DbOptions): Promise<Db> {
  if (url.startsWith('file:') && !url.includes(':memory:')) {
    mkdirSync(dirname(resolve(url.slice('file:'.length))), { recursive: true });
  }
  const db = createClient({ url, authToken });
  if (url.startsWith('file:')) await db.execute('PRAGMA foreign_keys = ON');
  await migrate(db);
  return db;
}

async function migrate(db: Db) {
  await db.execute('CREATE TABLE IF NOT EXISTS _migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL)');
  const { rows } = await db.execute('SELECT COALESCE(MAX(version), 0) AS v FROM _migrations');
  let current = Number(rows[0]?.v ?? 0);

  // Databases created by the earlier node:sqlite server tracked migrations in PRAGMA user_version, not in
  // _migrations. Their tables already exist, so record migration 1 as applied instead of re-running it.
  if (current === 0) {
    const legacy = await db.execute("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'tenants'");
    if (legacy.rows.length) {
      await db.execute({ sql: 'INSERT INTO _migrations (version, applied_at) VALUES (1, ?)', args: [new Date().toISOString()] });
      current = 1;
    }
  }
  for (let i = current; i < MIGRATIONS.length; i++) {
    const statements: InStatement[] = splitSql(MIGRATIONS[i]!);
    statements.push({ sql: 'INSERT INTO _migrations (version, applied_at) VALUES (?, ?)', args: [i + 1, new Date().toISOString()] });
    await db.batch(statements, 'write');
  }
}

/** Splits a migration into statements (our migrations contain no semicolons inside literals). */
function splitSql(sql: string): string[] {
  return sql
    .replace(/--[^\n]*/g, '')
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Runs `fn` inside a write transaction, committing on success and rolling back on error. */
export async function tx<T>(db: Db, fn: (t: Transaction) => Promise<T>): Promise<T> {
  const t = await db.transaction('write');
  try {
    const out = await fn(t);
    await t.commit();
    return out;
  } catch (e) {
    await t.rollback();
    throw e;
  } finally {
    t.close();
  }
}
