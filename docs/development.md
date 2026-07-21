# Development and contribution guide

## Prerequisites

- Node.js compatible with the repository (Docker images use Node 22; CI currently uses Node 20).
- Docker Desktop/Compose for Postgres and Redis.
- An OpenAI-compatible key and endpoint only when exercising ordinary evening AI turns.
- A base64-encoded 32-byte encryption key only when exercising ordinary evening AI turns.

## Local setup

1. Copy `.env.example` to `.env`; never commit `.env`.
2. Start the development stack:

   ```powershell
   npm run docker:dev
   ```

3. In a second terminal, apply migrations if they have not already been applied:

   ```powershell
   npm run db:migrate
   ```

4. Open `http://localhost:5173`. Optional demo data: `npm run seed`.

`docker:dev` starts database and cache containers, an API watcher, and Vite. The development Compose override sends the containerized API to `OPENAI_DOCKER_BASE_URL`; a host-only API watcher can use `OPENAI_BASE_URL` instead.

## Everyday commands

| Command | Purpose |
| --- | --- |
| `npm run dev:server` | Run the API with Node watch mode. Dependencies must already be available. |
| `npm run dev:client` | Start Vite on port 5173; it proxies `/api` to port 3001 by default. |
| `npm run db:generate` | Generate a Drizzle migration after a schema change. Review generated SQL before committing. |
| `npm run db:migrate` | Apply committed Drizzle migrations. |
| `npm run db:studio` | Open Drizzle Studio against `DATABASE_URL`. |
| `npm run seed` | Idempotently create the local household and the `Ari` demo profile. |
| `npm run build` | Build the web app to `apps/web/dist`. |
| `npm run docker:up` | Build the production-style Compose stack. |

## Repository conventions

- `apps/api/src/modules` contains domain behavior and routes; `platform` contains shared infrastructure; repositories encapsulate database access.
- `apps/web/src/features` owns feature UI, hooks, and API adapters. Shared fetch logic remains under `shared/api`.
- Import aliases are `#api/*`, `#web/*`, and `#tests/*`; preserve module boundaries checked by architecture tests.
- Define HTTP body and response schemas alongside a feature's routes. Route handlers should delegate to a service rather than query the database.
- Add migrations rather than altering already-committed migration files. Keep documentation in sync when a public API, table, security property, or command changes.

## Making a safe change

1. Trace the relevant path in [System guide](system-guide.md) and [API reference](api.md).
2. Add or adjust a focused unit/component/architecture test.
3. Run `npm run check` locally. Before release, also run the production dependency audit, secret scan, and SBOM command described in [Testing and quality](testing-quality.md).
4. If the change involves child data, consent, AI prompts, or safety matching, review [Security, privacy, and safety](security-privacy-safety.md) before merging.
