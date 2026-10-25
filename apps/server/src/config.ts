export function parseTrustProxy(value: string | undefined, production: boolean): number | false {
  const v = value?.trim().toLowerCase();
  if (!v) return production ? 1 : false;
  if (v === 'false' || v === '0') return false;
  if (/^\d+$/.test(v)) return Number(v);
  throw new Error(`TRUST_PROXY must be a number of proxy hops (e.g. 1) or false, got "${value}"`);
}

const DEV_SECRET = 'dev-only-secret-change-me-dev-only-secret';
const env = process.env;
const production = env.NODE_ENV === 'production';

export const config = {
  port: Number(env.PORT ?? 8787),
  /** Localhost by default; containers and hosts set HOST=0.0.0.0. */
  host: env.HOST ?? (production ? '0.0.0.0' : '127.0.0.1'),
  /** Local SQLite file in development; `libsql://…` (Turso) in production. */
  databaseUrl: env.TURSO_DATABASE_URL ?? env.DATABASE_URL ?? 'file:data/dts.db',
  databaseAuthToken: env.TURSO_AUTH_TOKEN,
  jwtSecret: env.JWT_SECRET ?? DEV_SECRET,
  isDevSecret: !env.JWT_SECRET,
  /**
   * Proxy hops in front of the API whose X-Forwarded-For entries are trusted, for the client IP behind the
   * live-connection limit. Default 1 in production (Render's proxy), off in development. `0` or `false` turns it off.
   */
  trustProxy: parseTrustProxy(env.TRUST_PROXY, production),
  /** Seeds the Northwind demo tenant. On by default in development, opt-in in production. */
  seedDemo: env.SEED_DEMO ? env.SEED_DEMO === 'true' : !production,
  /** Platform admin password for the demo seed. Without it, production seeds no platform admin. */
  adminPassword: env.ADMIN_PASSWORD?.trim() || undefined,
  production,
};

if (production && config.isDevSecret) {
  throw new Error('JWT_SECRET must be set in production');
}
