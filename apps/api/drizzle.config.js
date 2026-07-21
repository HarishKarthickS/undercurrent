import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './apps/api/src/platform/database/schema/index.js',
  out: './apps/api/drizzle',
  dbCredentials: { url: process.env.DATABASE_URL ?? 'postgresql://undercurrent:undercurrent@localhost:5432/undercurrent' }
});
