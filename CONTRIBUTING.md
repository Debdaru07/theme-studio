# Branches, CI and deployments

## Branch model: trunk-based

`main` is production. All work happens on short-lived branches merged by pull request.

```text
feat/font-picker ─┐
fix/cors-put ─────┼─► PR ─► CI green + review ─► squash-merge to main ─► auto-deploy
chore/deps ───────┘
```

| Branch | Purpose | Deploys to |
| --- | --- | --- |
| `main` | Always releasable. Protected: no direct pushes. | Production: Render API, Cloudflare admin + docs |
| `feat/*`, `fix/*`, `chore/*`, `docs/*` | One change each, merged via PR, then deleted | Cloudflare preview URLs for admin/docs (per branch) |

Branch names use a type prefix; commit messages follow Conventional Commits (`feat(admin): …`, `fix(server): …`).

## CI (`.github/workflows/ci.yml`)

Runs on every PR and every push to `main`:

| Job | Checks |
| --- | --- |
| JS / TS | `npm ci`, `npm audit --audit-level=high`, typecheck, all workspace tests, fixtures regenerated with no diff, admin and docs builds |
| Flutter SDK | fixtures synced with no diff, `flutter analyze` and `flutter test` (package and example) |

## CD

| Piece | Trigger | Gate |
| --- | --- | --- |
| API (Render) | push to `main` | `autoDeployTrigger: checksPass` in `render.yaml`: deploys only after CI passes |
| Theme Studio + docs (Cloudflare Workers Builds) | push to any branch | `main` → production; other branches → preview versions (preview URL on the PR) |

The database (Turso) has no per-branch copy. Schema changes are additive migrations in `apps/server/src/db.ts`
(`MIGRATIONS` is append-only), so a deploy never needs a manual step.

## One-time GitHub settings (repo owner)

Settings → Branches → Add branch ruleset for `main`:
- Require a pull request before merging
- Require status checks to pass: **JS / TS (schema, API, SDKs, admin, docs)** and **Flutter SDK**
- Block force pushes

## UI, marketing and design work

Use the project skills in [`.claude/skills`](.claude/skills/README.md): `functional-ui` (accessibility,
responsive, states; `npm run audit:ui`), `marketing-page` (landing page and copy, with verified facts only) and
`design-taste` (design direction and critique rubric).

## Changing the token schema

1. Edit `packages/schema/src/tokens.ts` (and defaults). New fields must be optional in SDK parsers so cached themes keep loading.
2. `npm run fixtures`, then `cd sdks/flutter && dart tool/sync_fixtures.dart`.
3. Update every SDK that maps the new token, plus the admin editor. CI fails if fixtures are stale.
