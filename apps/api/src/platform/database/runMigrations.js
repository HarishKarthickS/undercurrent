import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { loadConfig } from '#api/config/env.js';
import { createDatabaseClient } from '#api/platform/database/client.js';

const database = createDatabaseClient({ connectionString: loadConfig().databaseUrl });
const migrationFolder = resolve(dirname(fileURLToPath(import.meta.url)), '../../../drizzle');
try {
  await migrate(database.db, { migrationsFolder: migrationFolder });
} finally {
  await database.close();
}
