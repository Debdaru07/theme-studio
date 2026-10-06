import { buildApp } from './app.ts';
import { config } from './config.ts';
import { openDb } from './db.ts';
import { seedDemo } from './demo.ts';

const db = openDb(config.dbPath);
const app = await buildApp({ db, jwtSecret: config.jwtSecret, logger: true });

if (config.isDevSecret) app.log.warn('JWT_SECRET not set — using the development secret');
if (!config.production && seedDemo(db).created) app.log.info('Seeded demo data (see `npm run seed` for logins)');

await app.listen({ port: config.port, host: config.host });
