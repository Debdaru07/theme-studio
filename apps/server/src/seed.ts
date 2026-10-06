import { config } from './config.ts';
import { openDb } from './db.ts';
import { DEMO_KEYS, DEMO_USERS, seedDemo } from './demo.ts';

const result = seedDemo(openDb(config.dbPath));

if (!result.created) {
  console.log('Demo data already present in', config.dbPath);
} else {
  console.log('Seeded demo data into', config.dbPath);
  console.table(Object.entries(DEMO_USERS).map(([who, c]) => ({ who, ...c })));
  console.table(Object.entries(DEMO_KEYS).map(([client, key]) => ({ client, key })));
}
