import { buildApp } from './app.ts';
import { config } from './config.ts';
import { openDb } from './db.ts';
import { seedDemo } from './demo.ts';

const db = await openDb({ url: config.databaseUrl, authToken: config.databaseAuthToken });
const app = await buildApp({ db, jwtSecret: config.jwtSecret, logger: true });

if (config.isDevSecret) app.log.warn('JWT_SECRET not set — using the development secret');
if (config.seedDemo) {
  const seeded = await seedDemo(db, { adminPassword: config.adminPassword ?? (config.production ? undefined : null) });
  if (seeded.created) app.log.info('Seeded demo data (see README for logins)');
}

await app.listen({ port: config.port, host: config.host });
