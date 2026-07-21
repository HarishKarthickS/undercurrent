# Undercurrent

Undercurrent is a parent-visible learning companion in which a child teaches a curious character. Child turns are safety-screened before AI processing, regular evening-learning turns are encrypted at rest, and the parent dashboard receives topic-level signals rather than a report-card score.

## Built with Codex and GPT-5.6

This project was created end to end with **Codex** and **GPT-5.6**: product shape, implementation, local Docker workflows, and browser-based user testing of the parent and child flows. The same agent loop was used to iterate on bugs found while exercising the UI in the browser, not only unit tests.

## Quick start

1. Copy `.env.example` to `.env` and set at least `DATABASE_URL` and `REDIS_URL`. Set `OPENAI_API_KEY`, `OPENAI_MODEL`, and a base64-encoded 32-byte `ENCRYPTION_KEY` to enable ordinary evening AI turns. For a host-side OpenAI-compatible proxy, set `OPENAI_BASE_URL`; Docker development uses `OPENAI_DOCKER_BASE_URL` because container loopback is not the host.
2. Start the development stack: `npm run docker:dev`.
3. Apply migrations: `npm run db:migrate`.
4. Open `http://localhost:5173`. Run `npm run seed` to create the complete local demo family.

### Local demo family

With the Docker development stack running, `npm run seed` runs inside the API container with development fixtures enabled. The direct command (`npm run seed:direct`) is available only with `NODE_ENV` set to a non-production value, `ENABLE_DEV_FIXTURES=true`, and a valid `ENCRYPTION_KEY`. Both refresh only the dedicated demo household, including encrypted ordinary Pip conversations; they do not modify other local households.

- Parent sign-in: `hkarthick439@gmail.com` / `UndercurrentDemo!2026`
- Student PIN: `2468`
- The command prints a fresh one-use invitation URL for Ari, Bryn, and Cora. Open an invitation URL in the browser, then use the PIN to enter that child's trail.

Each run replaces the previous demo-family data and invalidates its earlier invitation links. These credentials, links, and PIN are local development fixtures only and are never created in production.

Without an OpenAI key or encryption key, ordinary evening turns deliberately return `AI_UNAVAILABLE`; the service never invents a personalized learning response. Safety checks remain deterministic and run before the AI boundary.

## Documentation

The complete product, engineering, API, data, security, operations, and testing guides are in [docs/README.md](docs/README.md).

For a temporary Render-hosted closed demo, use the included [Render deployment guide](docs/render-deployment.md). Render's free plan has database expiry, sleeping, and no-persistence limitations, so it is not suitable for a production child service.

## Closed-demo boundary

This repository supports `DEPLOYMENT_MODE=closed_demo` only. Enrollment requires an operator-issued parent invitation and versioned demo-terms acknowledgement; it is not a public child service and does not implement verified parental consent. `ENABLE_DEV_FIXTURES` is rejected in production. Use the VPS overlay with `docker compose -f compose.yaml -f compose.vps.yaml up --build` only after configuring real SMTP, TLS domain, off-VPS encrypted backups, and an approved OpenAI data-use configuration.
