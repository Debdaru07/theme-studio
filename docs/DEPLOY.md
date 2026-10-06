# Deploying for free

| Piece | Host | Free tier notes |
| --- | --- | --- |
| Theme API (`apps/server`) | [Render](https://render.com) web service | Sleeps after 15 min idle; the next request takes ~30–60 s. SDKs serve their cached theme meanwhile, so end-user apps are unaffected. |
| Database | [Turso](https://turso.tech) (libSQL) | 5 GB, 100 databases. Same SQLite schema as local development. |
| Theme Studio (`apps/admin`) | [Cloudflare Pages](https://pages.cloudflare.com) | Static site, unmetered bandwidth. |
| Docs site (`apps/site`) | Cloudflare Pages | Static site. |

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

## 3. Theme Studio (Cloudflare Pages)

1. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git** → pick the repo.
2. Build settings:
   - Framework preset: none
   - Build command: `npm ci && npm run build -w @dts/admin`
   - Build output directory: `apps/admin/dist`
3. Environment variables (Production):
   - `NODE_VERSION` = `24`
   - `VITE_API_URL` = your Render URL, e.g. `https://theme-studio-api.onrender.com`
   - `VITE_DEMO_LOGINS` = `true` to show one-click demo accounts on the sign-in page (portfolio demo).
4. Deploy. `apps/admin/public/_redirects` makes client-side routes work on refresh.

## 4. Docs site (Cloudflare Pages)

A second Pages project from the same repo:

- Build command: `npm ci && npm run build -w @dts/site`
- Build output directory: `apps/site/dist`
- Variables: `NODE_VERSION=24`, `PUBLIC_API_URL`, `PUBLIC_ADMIN_URL` (the Theme Studio URL), `PUBLIC_REPO_URL`.

## Things to know about a public demo

- With `VITE_DEMO_LOGINS=true`, anyone can sign in as the demo agency or client and publish changes to the demo
  themes. That is the point of a demo, but expect edits. Re-seed by deleting the `northwind` tenant rows in Turso
  and restarting the service.
- The platform admin is never offered as a demo button in production builds. Keep `ADMIN_PASSWORD` private.
- CORS is open (bearer tokens, no cookies), so SDKs and the admin can call the API from any origin.
