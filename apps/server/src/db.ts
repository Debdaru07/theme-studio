import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

export type Db = DatabaseSync;

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

export function openDb(path: string): Db {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec('PRAGMA foreign_keys = ON;');
  if (path !== ':memory:') db.exec('PRAGMA journal_mode = WAL;');
  migrate(db);
  return db;
}

function migrate(db: Db) {
  const { user_version: current } = db.prepare('PRAGMA user_version').get() as { user_version: number };
  for (let i = current; i < MIGRATIONS.length; i++) {
    tx(db, () => {
      db.exec(MIGRATIONS[i]!);
      db.exec(`PRAGMA user_version = ${i + 1}`);
    });
  }
}

export function tx<T>(db: Db, fn: () => T): T {
  db.exec('BEGIN');
  try {
    const out = fn();
    db.exec('COMMIT');
    return out;
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}
