import { buildApp } from './app.ts';
import { config } from './config.ts';
import { openDb } from './db.ts';
import { MIN_ADMIN_PASSWORD_LENGTH, seedDemo, syncPlatformAdmin } from './demo.ts';

const db = await openDb({ url: config.databaseUrl, authToken: config.databaseAuthToken });
const app = await buildApp({ db, jwtSecret: config.jwtSecret, logger: true });

if (config.isDevSecret) app.log.warn('JWT_SECRET not set — using the development secret');
if (config.seedDemo) {
  const seeded = await seedDemo(db, { adminPassword: config.adminPassword ?? (config.production ? undefined : null) });
  if (seeded.created) app.log.info('Seeded demo data (see README for logins)');
}

const admin = await syncPlatformAdmin(db, { password: config.adminPassword, production: config.production });
if (admin === 'weak-password-locked') {
  app.log.warn(`ADMIN_PASSWORD is shorter than ${MIN_ADMIN_PASSWORD_LENGTH} characters; the platform admin is locked until it is changed`);
} else if (admin !== 'unchanged') {
  app.log.info(`Platform admin: ${admin}`);
}

await app.listen({ port: config.port, host: config.host });
