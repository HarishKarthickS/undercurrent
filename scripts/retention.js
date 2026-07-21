import { loadConfig } from '#api/config/env.js';
import { createDatabaseClient } from '#api/platform/database/client.js';
import { createRepositories } from '#api/platform/database/repositories/index.js';

const config = loadConfig();
if (config.deploymentMode !== 'closed_demo') throw new Error('Retention is available only in closed_demo mode.');
const database = createDatabaseClient({ connectionString: config.databaseUrl });
try {
  const count = await createRepositories(database.db).purgeDueStudents();
  console.log(`Purged ${count} closed-demo child record set(s).`);
} finally {
  await database.close();
}
