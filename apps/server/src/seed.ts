import { config } from './config.ts';
import { openDb } from './db.ts';
import { DEMO_KEYS, DEMO_USERS, seedDemo } from './demo.ts';

const db = await openDb({ url: config.databaseUrl, authToken: config.databaseAuthToken });
const result = await seedDemo(db, { adminPassword: config.adminPassword ?? null });

if (!result.created) {
  console.log('Demo data already present in', config.databaseUrl);
} else {
  console.log('Seeded demo data into', config.databaseUrl);
  console.table(
    Object.entries(DEMO_USERS).map(([who, c]) => ({
      who,
      email: c.email,
      password: who === 'platform' && config.adminPassword ? '(ADMIN_PASSWORD)' : c.password,
    })),
  );
  console.table(Object.entries(DEMO_KEYS).map(([client, key]) => ({ client, key })));
}
db.close();
