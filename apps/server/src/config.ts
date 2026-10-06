import { join } from 'node:path';

const DEV_SECRET = 'dev-only-secret-change-me-dev-only-secret';

export const config = {
  port: Number(process.env.PORT ?? 8787),
  /** Localhost by default; containers set HOST=0.0.0.0. */
  host: process.env.HOST ?? '127.0.0.1',
  dbPath: process.env.DTS_DB ?? join(process.cwd(), 'data', 'dts.db'),
  jwtSecret: process.env.JWT_SECRET ?? DEV_SECRET,
  isDevSecret: !process.env.JWT_SECRET,
  production: process.env.NODE_ENV === 'production',
};

if (config.production && config.isDevSecret) {
  throw new Error('JWT_SECRET must be set in production');
}
