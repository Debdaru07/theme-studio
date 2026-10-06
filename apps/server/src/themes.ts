import { createHash } from 'node:crypto';
import {
  ThemeValidationError,
  resolveTheme,
  validateLayer,
  type Layer,
  type ResolvedTheme,
  type Theme,
  type ThemeInput,
} from '@dts/schema';
import { tx, type Db } from './db.ts';
import { HttpError, notFound } from './errors.ts';
import type { Client, OwnerType, Repo, Tenant, User, VersionSummary } from './repo.ts';

export function themeHash(theme: Theme): string {
  const { meta: _meta, ...tokens } = theme;
  return createHash('sha256').update(JSON.stringify(tokens)).digest('hex').slice(0, 16);
}

export interface PublishResult {
  version: VersionSummary;
}

export interface TenantPublishResult extends PublishResult {
  rebased: { clientId: string; version: number }[];
  skipped: { clientId: string; reason: string }[];
}

/**
 * Theme lifecycle. Layering is always: platform defaults → tenant base (latest *published*) → client layer.
 * Client layers use the `client` policy whoever edits them; tenant-level tokens belong in the base theme.
 */
export class ThemeService {
  constructor(
    private readonly db: Db,
    private readonly repo: Repo,
  ) {}

  // ── Lookups ────────────────────────────────────────────────────────────────

  tenant(id: string): Tenant {
    return this.repo.getTenant(id) ?? throwErr(notFound('Tenant'));
  }

  client(id: string): Client {
    return this.repo.getClient(id) ?? throwErr(notFound('Client'));
  }

  /** The tenant's latest published base layer (empty if never published). */
  baseLayer(tenantId: string): ThemeInput {
    return this.repo.getVersion('tenant', tenantId)?.layer ?? {};
  }

  // ── Preview / validation ───────────────────────────────────────────────────

  previewTenant(layer: ThemeInput): ResolvedTheme {
    assertLayer(layer, 'tenant');
    return resolveTheme([layer]);
  }

  previewClient(client: Client, layer: ThemeInput): ResolvedTheme {
    assertLayer(layer, 'client');
    return resolveTheme([this.baseLayer(client.tenantId), layer]);
  }

  // ── Drafts ─────────────────────────────────────────────────────────────────

  saveDraft(ownerType: OwnerType, ownerId: string, layer: ThemeInput, user: User) {
    const resolved =
      ownerType === 'tenant' ? this.previewTenant(layer) : this.previewClient(this.client(ownerId), layer);
    const draft = this.repo.saveDraft(ownerType, ownerId, layer, user.id);
    return { draft, contrast: resolved.contrast };
  }

  // ── Publishing ─────────────────────────────────────────────────────────────

  publishClient(client: Client, user: User | null, note: string | null): PublishResult {
    const layer = this.repo.getDraft('client', client.id)?.layer ?? {};
    const resolved = this.previewClient(client, layer);
    if (!resolved.contrast.publishable) {
      throw new HttpError(422, 'Theme fails required contrast checks', { contrast: resolved.contrast });
    }
    return tx(this.db, () => ({ version: this.insertClientVersion(client, layer, user, note) }));
  }

  publishTenant(tenant: Tenant, user: User | null, note: string | null): TenantPublishResult {
    const layer = this.repo.getDraft('tenant', tenant.id)?.layer ?? {};
    this.previewTenant(layer);

    return tx(this.db, () => {
      const version = this.repo.nextVersion('tenant', tenant.id);
      const publishedAt = new Date().toISOString();
      const { theme } = resolveTheme([layer]);
      const hash = themeHash(theme);
      const resolved = { ...theme, meta: { tenant: tenant.slug, client: null, version, publishedAt, hash } };
      this.repo.insertVersion('tenant', tenant.id, { version, layer, resolved, hash, note, publishedAt }, user?.id ?? null);

      // Every published client inherits the new base: re-resolve their current layer on top of it.
      const rebased: TenantPublishResult['rebased'] = [];
      const skipped: TenantPublishResult['skipped'] = [];
      for (const clientId of this.repo.publishedClientIds(tenant.id)) {
        const client = this.client(clientId);
        const current = this.repo.getVersion('client', clientId)!;
        try {
          const { contrast } = resolveTheme([layer, current.layer]);
          if (!contrast.publishable) throw new Error('fails required contrast checks on the new base');
          const v = this.insertClientVersion(client, current.layer, user, `Rebased on base theme v${version}`);
          rebased.push({ clientId, version: v.version });
        } catch (e) {
          skipped.push({ clientId, reason: (e as Error).message });
        }
      }
      return { version: this.repo.listVersions('tenant', tenant.id)[0]!, rebased, skipped };
    });
  }

  /** Copies an old client version into the draft and publishes it as a new version. */
  rollbackClient(client: Client, toVersion: number, user: User): PublishResult {
    const old = this.repo.getVersion('client', client.id, toVersion) ?? throwErr(notFound(`Version ${toVersion}`));
    this.repo.saveDraft('client', client.id, old.layer, user.id);
    return this.publishClient(client, user, `Rollback to v${toVersion}`);
  }

  private insertClientVersion(client: Client, layer: ThemeInput, user: User | null, note: string | null): VersionSummary {
    const tenant = this.tenant(client.tenantId);
    const version = this.repo.nextVersion('client', client.id);
    const publishedAt = new Date().toISOString();
    const { theme } = resolveTheme([this.baseLayer(client.tenantId), layer]);
    const hash = themeHash(theme);
    const resolved = { ...theme, meta: { tenant: tenant.slug, client: client.slug, version, publishedAt, hash } };
    this.repo.insertVersion('client', client.id, { version, layer, resolved, hash, note, publishedAt }, user?.id ?? null);
    return this.repo.listVersions('client', client.id)[0]!;
  }
}

function assertLayer(layer: ThemeInput, policy: Layer) {
  const issues = validateLayer(layer, policy);
  if (issues.length) throw new ThemeValidationError(issues);
}

function throwErr(e: Error): never {
  throw e;
}
