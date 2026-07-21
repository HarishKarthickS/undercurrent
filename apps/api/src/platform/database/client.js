import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';

export function createDatabaseClient({ connectionString, max = 10 }) {
  const pool = new pg.Pool({ connectionString, max });
  return Object.freeze({ pool, db: drizzle({ client: pool }), close: () => pool.end() });
}
