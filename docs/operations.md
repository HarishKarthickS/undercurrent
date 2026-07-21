# Operations guide

## Compose services

| Service | Role | Exposure |
| --- | --- | --- |
| `postgres` | PostgreSQL 17 data store with named volume `postgres-data`. | Internal network only. |
| `redis` | Redis 7 rate-limit store with append-only data volume. | Internal network only. |
| `migrate` | One-shot API image that runs `npm run db:migrate`. | Internal network only; exits after completion. |
| `api` | Node/Fastify service on port 3001. | Internal network only in production Compose. |
| `gateway` | Nginx static-web and `/api` reverse-proxy service. | Host port `${WEB_PORT:-8080}`. |
| `web` | Vite dev server supplied only by `compose.dev.yaml`. | Host port 5173. |

`docker compose up --build` uses the production-style build. `docker compose -f compose.yaml -f compose.dev.yaml up --build` adds watched API/Vite development services and hides the gateway behind its `production` profile.

## Environment reference

Values listed below come from `.env.example`. “Sensitive” means the value should come from secret storage or contain no real production value in source control.

| Variable | Default/example | Required by running API | Sensitive | Notes |
| --- | --- | --- | --- | --- |
| `NODE_ENV` | `development` | No | No | Must be `development`, `test`, or `production`. |
| `PORT` | `3001` | No | No | API listen port. |
| `DATABASE_URL` | local Postgres URL | Yes | Yes | Required by config; use managed credentials in production. |
| `REDIS_URL` | `redis://localhost:6379` | No | Yes | Rate-limit and health-check backend. |
| `TRUST_PROXY` | `false` | No | No | Set only behind a correctly configured trusted proxy. Listed twice in the example; the later value is also `false`. |
| `BODY_LIMIT_BYTES` | `16384` | No | No | JSON request maximum. |
| `REQUEST_TIMEOUT_MS` | `90000` | No | No | API request timeout; config fallback is 30000 when unset. |
| `KEEP_ALIVE_TIMEOUT_MS` | `72000` | No | No | API keep-alive timeout. |
| `CONNECTION_TIMEOUT_MS` | `90000` | No | No | Connection timeout; config fallback is 10000 when unset. |
| `ALLOWED_ORIGINS` | Vite localhost | No | No | Placeholder; currently unused because no CORS plugin is registered. |
| `OPENAI_API_KEY` | empty | Evening AI turns | Yes | Without it, normal evening turns return `AI_UNAVAILABLE`. |
| `OPENAI_BASE_URL` | empty | No | Potentially | Host-side OpenAI-compatible base URL. |
| `OPENAI_DOCKER_BASE_URL` | host Docker proxy URL | No | Potentially | Used by the development Compose API override. |
| `OPENAI_MODEL` | `gpt-5.6-luna` | No | No | Config fallback is `gpt-5.6`; set explicitly to avoid drift. |
| `AI_REQUEST_TIMEOUT_MS` | `8000` | No | No | Per-provider request timeout; no provider retries. |
| `ENCRYPTION_KEY` | empty | Evening AI turns | Yes | Base64-encoded exactly 32-byte key; startup fails if malformed when set. |
| `ENCRYPTION_KEY_VERSION` | `v1` | No | No | Stored beside every encrypted turn. |
| `SMTP_URL` | empty | No | Yes | SMTP transport connection string. Empty selects JSON transport. |
| `MAIL_FROM` | example address | No | No | Sender for safety alert emails. |
| `PUBLIC_APP_URL` | Vite localhost | No | No | Included in safety-alert email text. |
| `RATE_LIMIT_WINDOW_MS` | `60000` | No | No | Passed to Fastify rate limit; config fallback is `'1 minute'`. |
| `RATE_LIMIT_MAX_REQUESTS` | `100` | No | No | Global IP rate-limit maximum. |
| `AUTH_RATE_LIMIT_MAX_REQUESTS` | `10` | No | No | Invitation, signup, login, reset, and student PIN endpoint override. |
| `MAX_EVENT_LOOP_DELAY_MS` | `1000` | No | No | Under-pressure threshold. |
| `HEALTH_CHECK_INTERVAL_MS` | `5000` | No | No | Under-pressure dependency probe interval. |
| `MAX_CONCURRENT_REQUESTS` | `50` | No | No | Placeholder; not consumed by current code. |
| `BETA_MODE` | `local` | No | No | Placeholder; not consumed by current code. |
| `AUTH_MODE` | `local` | No | No | Placeholder; not consumed by current code. |
| `AUTH0_ISSUER` | empty | No | Potentially | Placeholder; Auth0 is not implemented. |
| `AUTH0_AUDIENCE` | empty | No | Potentially | Placeholder; Auth0 is not implemented. |
| `AUTH0_HOUSEHOLD_CLAIM` | Undercurrent claim URI | No | No | Placeholder; Auth0 is not implemented. |
| `AUTH0_ROLES_CLAIM` | Undercurrent claim URI | No | No | Placeholder; Auth0 is not implemented. |
| `POSTGRES_PASSWORD` | `undercurrent` | Compose only | Yes | Used by Compose to construct internal database URLs. |
| `WEB_PORT` | `8080` | Compose only | No | Host port for the production gateway. |
| `VITE_API_PROXY_TARGET` | `http://localhost:3001` | Vite only | No | Vite development proxy target. |
| `VITE_API_BASE_URL` | `/api` | Browser build only | No | Browser-side API prefix. |

## Health, readiness, and troubleshooting

- Probe `GET /health` for process liveness and `GET /ready` for Postgres/Redis readiness. A ready failure returns `503` and `not_ready`.
- API pressure protection also probes Postgres and Redis; inspect API logs and the two service health checks if requests return `SERVICE_UNAVAILABLE`.
- `AI_UNAVAILABLE` means the normal evening path lacks a usable AI client/encryption service or an upstream AI call failed. Verify key presence, base URL reachability, model access, and key length without logging secret values.
- `PARENT_AUTH_REQUIRED` means the bearer header is missing, invalid, or its session expired. Local sessions expire after 12 hours.
- `CONSENT_REQUIRED` means the student lacks a granted `learning_companion` record.
- `RATE_LIMITED` can be shared by users behind one source IP because the limiter key is `request.ip`.

## Backup, recovery, and releases

Back up the PostgreSQL named volume/database using your managed database provider or an authenticated `pg_dump` process; test restore separately. Redis does not hold durable business records. Preserve the encryption key material required to decrypt historical turns, but store it separately from database backups and control access rigorously.

For a release: review migrations, take a verified backup, build images, run the quality gate, deploy dependencies, run migrations exactly once, start the API, then expose the gateway after `/ready` is healthy. Roll back application images only when their schema compatibility is known; use a forward migration for unsafe schema reversals. Establish external logs, uptime checks, database/cache metrics, alerting, and an incident process before public launch.
