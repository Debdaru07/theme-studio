import { createHash } from 'node:crypto';
import {
  ThemeValidationError,
  resolveTheme,
  validateLayer,
  validateLayerChange,
  type Layer,
  type ResolvedTheme,
  type Theme,
  type ThemeInput,
} from '@dts/schema';
import { HttpError, notFound } from './errors.ts';
import type { Client, OwnerType, Repo, Role, Tenant, User, VersionSummary } from './repo.ts';

export function themeHash(theme: Theme): string {
  const { meta: _meta, ...tokens } = theme;
  return createHash('sha256').update(JSON.stringify(tokens)).digest('hex').slice(0, 16);
}

/** The policy level an editor acts at, whichever layer they edit. */
export const EDITOR_LAYER: Record<Role, Layer> = {
  platform_admin: 'platform',
  tenant_admin: 'tenant',
  client_editor: 'client',
};

export interface PublishResult {
  version: VersionSummary;
}

export interface TenantPublishResult extends PublishResult {
  rebased: { clientId: string; version: number }[];
  skipped: { clientId: string; reason: string }[];
}

/**
 * Theme lifecycle. Layering is always: platform defaults → tenant base (latest *published*) → client layer.
 *
 * Permissions are enforced on save, per changed token, at the editor's role: an agency admin may set
 * agency-level tokens on one client's theme, and that client's editors keep them but cannot change them.
 */
export class ThemeService {
  constructor(private readonly repo: Repo) {}

  // ── Lookups ────────────────────────────────────────────────────────────────

  async tenant(id: string, repo = this.repo): Promise<Tenant> {
    return (await repo.getTenant(id)) ?? throwErr(notFound('Tenant'));
  }

  async client(id: string, repo = this.repo): Promise<Client> {
    return (await repo.getClient(id)) ?? throwErr(notFound('Client'));
  }

  /** The tenant's latest published base layer (empty if never published). */
  async baseLayer(tenantId: string, repo = this.repo): Promise<ThemeInput> {
    return (await repo.getVersion('tenant', tenantId))?.layer ?? {};
  }

  // ── Preview / validation ───────────────────────────────────────────────────

  previewTenant(layer: ThemeInput): ResolvedTheme {
    assertKnown(layer);
    return resolveTheme([layer]);
  }

  async previewClient(client: Client, layer: ThemeInput, repo = this.repo): Promise<ResolvedTheme> {
    assertKnown(layer);
    return resolveTheme([await this.baseLayer(client.tenantId, repo), layer]);
  }

  // ── Drafts ─────────────────────────────────────────────────────────────────

  async saveDraft(ownerType: OwnerType, ownerId: string, layer: ThemeInput, user: User) {
    const current =
      (await this.repo.getDraft(ownerType, ownerId))?.layer ?? (await this.repo.getVersion(ownerType, ownerId))?.layer ?? {};
    const issues = validateLayerChange(current, layer, EDITOR_LAYER[user.role]);
    if (issues.length) throw new ThemeValidationError(issues);

    const resolved =
      ownerType === 'tenant' ? this.previewTenant(layer) : await this.previewClient(await this.client(ownerId), layer);
    const draft = await this.repo.saveDraft(ownerType, ownerId, layer, user.id);
    return { draft, contrast: resolved.contrast };
  }

  // ── Publishing ─────────────────────────────────────────────────────────────

  async publishClient(client: Client, user: User | null, note: string | null): Promise<PublishResult> {
    const layer = (await this.repo.getDraft('client', client.id))?.layer ?? {};
    const resolved = await this.previewClient(client, layer);
    if (!resolved.contrast.publishable) {
      throw new HttpError(422, 'Theme fails required contrast checks', { contrast: resolved.contrast });
    }
    return this.repo.withTx(async (repo) => ({ version: await this.insertClientVersion(repo, client, layer, user, note) }));
  }

  async publishTenant(tenant: Tenant, user: User | null, note: string | null): Promise<TenantPublishResult> {
    const layer = (await this.repo.getDraft('tenant', tenant.id))?.layer ?? {};
    const { theme } = this.previewTenant(layer);

    return this.repo.withTx(async (repo) => {
      const version = await repo.nextVersion('tenant', tenant.id);
      const publishedAt = new Date().toISOString();
      const hash = themeHash(theme);
      const resolved = { ...theme, meta: { tenant: tenant.slug, client: null, version, publishedAt, hash } };
      await repo.insertVersion('tenant', tenant.id, { version, layer, resolved, hash, note, publishedAt }, user?.id ?? null);

      // Every published client inherits the new base: re-resolve their current layer on top of it.
      const rebased: TenantPublishResult['rebased'] = [];
      const skipped: TenantPublishResult['skipped'] = [];
      for (const clientId of await repo.publishedClientIds(tenant.id)) {
        const client = await this.client(clientId, repo);
        const current = (await repo.getVersion('client', clientId))!;
        try {
          const { contrast } = resolveTheme([layer, current.layer]);
          if (!contrast.publishable) throw new Error('fails required contrast checks on the new base');
          const v = await this.insertClientVersion(repo, client, current.layer, user, `Rebased on base theme v${version}`);
          rebased.push({ clientId, version: v.version });
        } catch (e) {
          skipped.push({ clientId, reason: (e as Error).message });
        }
      }
      return { version: (await repo.listVersions('tenant', tenant.id))[0]!, rebased, skipped };
    });
  }

  /** Copies an old client version into the draft and publishes it as a new version. */
  async rollbackClient(client: Client, toVersion: number, user: User): Promise<PublishResult> {
    const old = (await this.repo.getVersion('client', client.id, toVersion)) ?? throwErr(notFound(`Version ${toVersion}`));
    await this.repo.saveDraft('client', client.id, old.layer, user.id);
    return this.publishClient(client, user, `Rollback to v${toVersion}`);
  }

  private async insertClientVersion(
    repo: Repo,
    client: Client,
    layer: ThemeInput,
    user: User | null,
    note: string | null,
  ): Promise<VersionSummary> {
    const tenant = await this.tenant(client.tenantId, repo);
    const version = await repo.nextVersion('client', client.id);
    const publishedAt = new Date().toISOString();
    const { theme } = resolveTheme([await this.baseLayer(client.tenantId, repo), layer]);
    const hash = themeHash(theme);
    const resolved = { ...theme, meta: { tenant: tenant.slug, client: client.slug, version, publishedAt, hash } };
    await repo.insertVersion('client', client.id, { version, layer, resolved, hash, note, publishedAt }, user?.id ?? null);
    return (await repo.listVersions('client', client.id))[0]!;
  }
}

/** Publish/preview only check that tokens exist; who may set them is checked when the draft is saved. */
function assertKnown(layer: ThemeInput) {
  const issues = validateLayer(layer);
  if (issues.length) throw new ThemeValidationError(issues);
}

function throwErr(e: Error): never {
  throw e;
}
