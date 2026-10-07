# Publishing the SDKs

| Package | Registry | Source | Tag to release |
| --- | --- | --- | --- |
| `@debdaru07/schema` | npm | `packages/schema` | `schema-v<version>` |
| `@debdaru07/web` | npm | `sdks/web` | `web-v<version>` |
| `@debdaru07/react` | npm | `sdks/react` | `react-v<version>` |
| `@debdaru07/react-native` | npm | `sdks/react-native` | `react-native-v<version>` |
| `theme_studio` | pub.dev | `sdks/flutter` | `flutter-v<version>` |

Each package has its own version. Pushing a tag runs `.github/workflows/release.yml`, which checks the tag, runs the
package's tests, builds it and publishes it. **No registry token is stored in GitHub**: npm and pub.dev trust that one
workflow through GitHub's OIDC identity (trusted publishing), and npm records provenance (which commit and workflow
built each version).

> Versions are effectively permanent. pub.dev versions can't be deleted (only retracted within 7 days or the
> package discontinued); npm allows unpublishing only within 72 hours. Dry-run first.

## One-time setup

### 1. License (done)

The SDKs and schema are MIT (a `LICENSE` in each package folder, copied into the published package); the
platform is AGPL-3.0 (root `LICENSE`). See the README. Keep `@debdaru07/schema` MIT: the SDKs depend on it at
runtime, so a copyleft schema would reach every app that uses them.

### 2. Accounts

- Two-factor authentication on GitHub, npm (`npm profile enable-2fa auth-and-writes`) and the Google account used for
  pub.dev.

### 3. GitHub repository settings

- **Settings → Environments → New environment `release`**
  - Required reviewers: you. Every publish waits for your approval in the Actions tab.
  - Deployment branches and tags: *Selected* → add tag patterns `schema-v*`, `web-v*`, `react-v*`,
    `react-native-v*`, `flutter-v*`.
- **Settings → Rules → Rulesets**
  - Branch ruleset for `main`: require a pull request and the CI checks; block force pushes and deletion.
  - Tag ruleset for `*-v*`: restrict creation, update and deletion to you (bypass list), so nobody else can trigger a
    release.
- **Settings → Actions → General**: workflow permissions *Read repository contents*; require approval for workflows
  from outside collaborators.
- **Settings → Code security**: enable secret scanning with push protection, and Dependabot alerts.

### 4. First release (by hand)

Both registries only let you set up trusted publishing for a package that already exists, so publish `0.1.0` once
from your machine. npm packages go in dependency order:

```sh
npm login                                   # account debdaru07, with 2FA
for p in schema web react react-native; do node scripts/pack.mjs $p; done
npm publish packages/schema/dist --access public
npm publish sdks/web/dist --access public
npm publish sdks/react/dist --access public
npm publish sdks/react-native/dist --access public
```

```sh
cd sdks/flutter
flutter pub publish --dry-run               # must report no errors
flutter pub publish                         # signs in with Google
```

On Windows, the Flutter SDK path contains a space (`C:\Flutter SDK`), which breaks a native build hook. Use the short
path: `C:\FLUTTE~1\bin\flutter.bat pub publish`.

### 5. Turn on trusted publishing

**npm**, for each of the four packages: npmjs.com → package → *Settings* → *Trusted publisher* → *GitHub Actions*:

| Field | Value |
| --- | --- |
| Organization or user | `Debdaru07` |
| Repository | `theme-studio` |
| Workflow filename | `release.yml` |
| Environment name | `release` |

Then, on the same page, set *Publishing access* to **Require two-factor authentication and disallow tokens**, so
nothing but that workflow (or you with 2FA) can publish.

**pub.dev**: pub.dev → `theme_studio` → *Admin* → *Automated publishing* → *Enable publishing from GitHub Actions*:

| Field | Value |
| --- | --- |
| Repository | `Debdaru07/theme-studio` |
| Tag pattern | `flutter-v{{version}}` |
| Require GitHub Actions environment | on, `release` |

## Releasing a new version

1. Bump `version` in the package's `package.json` (or `pubspec.yaml`) and add a CHANGELOG entry. If you bump
   `schema`, release it before `web`; if you bump `web`, before `react` and `react-native` (published packages pin
   `^<current version>` of their workspace dependencies).
2. Merge to `main` and let CI pass. CI also builds every npm package (`scripts/pack.mjs`), so packaging problems
   show up in the pull request.
3. Tag the merge commit and push the tag:

   ```sh
   git tag web-v0.2.0 && git push origin web-v0.2.0
   ```

4. Approve the `release` environment in the Actions tab. The workflow refuses tags whose commit isn't on `main` or
   whose version doesn't match the package (`scripts/release-check.mjs`).

## Checking a package locally

```sh
node scripts/pack.mjs react && (cd sdks/react/dist && npm pack --dry-run)   # files that would ship
(cd sdks/flutter && flutter pub publish --dry-run)
```

The npm packages are built by `scripts/pack.mjs` into `<package>/dist` (git-ignored): compiled JS and `.d.ts` from
`src/`, plus CSS, fixtures, README and LICENSE, with a generated `package.json`. Source `package.json` files keep
pointing at TypeScript so the monorepo needs no build step during development.
