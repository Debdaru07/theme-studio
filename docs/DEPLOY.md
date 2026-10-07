# Deploying for free

| Piece | Host | Free tier notes |
| --- | --- | --- |
| Theme API (`apps/server`) | [Render](https://render.com) web service | Sleeps after 15 min idle; the next request takes ~30–60 s. SDKs serve their cached theme meanwhile, so end-user apps are unaffected. |
| Database | [Turso](https://turso.tech) (libSQL) | 5 GB, 100 databases. Same SQLite schema as local development. |
| Theme Studio (`apps/admin`) | [Cloudflare Workers](https://workers.cloudflare.com) static assets | Static files are free and unmetered. |
| Docs site (`apps/site`) | Cloudflare Workers static assets | Static site. |

Free tiers change; check each provider's pricing page before relying on them.

## 1. Database (Turso)

1. Sign up at turso.tech and create a database, e.g. `theme-studio`.
2. Copy its **URL** (`libsql://theme-studio-<you>.turso.io`) and create a **database token**.
   Tables are created automatically on the API's first start.

## 2. API (Render)

1. Render → **New → Blueprint** → connect the GitHub repo. Render reads [`render.yaml`](../render.yaml).
2. Fill in the secret values it asks for:
   - `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`: from step 1.
   - `ADMIN_PASSWORD`: password for `admin@dts.local` (platform admin). Leave empty to create no platform admin.
   - `JWT_SECRET` is generated for you. `SEED_DEMO=true` seeds the Northwind demo (agency + Acme/Globex clients).
3. Deploy, then check `https://<service>.onrender.com/health` → `{"ok":true}` and
   `curl -H "X-Theme-Key: pk_demo_acme" https://<service>.onrender.com/v1/theme`.

## 3. Theme Studio (Cloudflare Workers, static assets)

Do this after step 2 so you know the API URL. `VITE_API_URL` is baked in at build time; if it changes,
update the variable and retry the build.

1. Cloudflare dashboard → **Workers & Pages → Create → Import a repository** → pick the repo.
2. Fill in:
   - Project name: `theme-studio` (must match `name` in `apps/admin/wrangler.jsonc`)
   - Build command: `npm ci && npm run build -w @dts/admin`
   - Deploy command: `npx wrangler deploy --config apps/admin/wrangler.jsonc`
   - Preview command: `npx wrangler versions upload --config apps/admin/wrangler.jsonc`
3. **Advanced settings → Build variables:**
   - `NODE_VERSION` = `24`
   - `VITE_API_URL` = your Render URL, e.g. `https://theme-studio-api.onrender.com`
   - `VITE_DEMO_LOGINS` = `true` to show one-click demo accounts on the sign-in page (portfolio demo).
4. Deploy. The site is served at `https://theme-studio.<your-subdomain>.workers.dev`. The wrangler config
   serves `index.html` for app routes, so refreshing `/clients/…/theme` works.

## 4. Docs site (Cloudflare Workers, static assets)

A second project from the same repo:

- Project name: `theme-studio-docs`
- Build command: `npm ci && npm run build -w @dts/site`
- Deploy command: `npx wrangler deploy --config apps/site/wrangler.jsonc`
- Preview command: `npx wrangler versions upload --config apps/site/wrangler.jsonc`
- Build variables: `NODE_VERSION=24`, `PUBLIC_API_URL`, `PUBLIC_ADMIN_URL` (the Theme Studio URL), `PUBLIC_REPO_URL`,
  `PUBLIC_SITE_URL` (this docs site's own URL; used for canonical links, the sitemap and social cards).

Don't add a `_redirects` SPA rule: Workers rejects `/* /index.html 200` as an infinite loop; the
`single-page-application` setting in the wrangler config already handles app routes.

## Things to know about a public demo

- With `VITE_DEMO_LOGINS=true`, anyone can sign in as the demo agency or client and publish changes to the demo
  themes. That is the point of a demo, but expect edits. Re-seed by deleting the `northwind` tenant rows in Turso
  and restarting the service.
- The platform admin is never offered as a demo button in production builds. Keep `ADMIN_PASSWORD` private.
- CORS is open (bearer tokens, no cookies), so SDKs and the admin can call the API from any origin.
