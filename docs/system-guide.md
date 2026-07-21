# System guide

## Frontend

`apps/web/src/app/App.jsx` selects the welcome/onboarding, child, and parent views. `useAppController` is the application-state coordinator: it restores an invited guardian session, creates/selects profiles, starts and ends sessions, and surfaces failures as notices.

| Feature | Responsibility | Extension point |
| --- | --- | --- |
| `identity` | Handles invitation-bound guardian signup, email verification, terms acknowledgement, and cookie sessions. | Keep public enrollment disabled. |
| `onboarding` | Captures profile fields and consent attestation; lists or creates profiles. | Keep consent fields aligned with the student API schema. |
| `child-session` | Renders turn UI, terminal state, voice helpers, and start/turn/end API calls. | Preserve per-turn idempotency-key generation and terminal-session handling. |
| `parent-dashboard` | Fetches and presents parent-visible topic, effort, and safety data. | Treat dashboard signals as descriptive, not grading UI. |
| `shared/api` | Builds `/api` URLs, adds bearer auth/JSON headers, parses errors, and creates idempotency keys. | Use `requestJson` for new JSON endpoints to maintain the common failure behavior. |

The client uses a 30-second abort timeout. Server-side normal requests may run longer; an AI-backed session turn can therefore still complete after the browser has shown a client timeout. Retrying must use the same idempotency key only when retrying the same input.

## Backend composition

`bootstrap/createServer.js` creates the Drizzle/Postgres client, repositories, domain services, AI client, encryption service, mailer, middleware, error handling, public routes, and protected route scope. `bootstrap/startServer.js` loads `.env` with `dotenv` and listens on all interfaces.

| Module | Responsibilities | Important rules |
| --- | --- | --- |
| `identity` | Local/demo sessions; account signup, email verification, password login, magic tokens; bearer-token validation. | Database stores SHA-256 token hashes; parent sessions last 12 hours; magic tokens last 15 minutes. |
| `students` | Household-scoped profile listing/creation and closed-demo terms enforcement. | Creation requires active terms acknowledgement; sessions require an active record. |
| `sessions` | Session lifecycle, authorization, idempotency, safety-first evening turns, encryption and learning persistence. | Do not move safety screening after the AI call or store triggering safety text. |
| `learning` | Assessment reconciliation, scaffold progression, review scheduling, and effort moments. | Signals are heuristic metadata, not grades. |
| `ai` | Calls the structured OpenAI Responses API for two assessments and one constrained reply. | The reply is filtered for a small banned-word list after model output. |
| `safety` | Deterministic regular-expression screening and redirect copy. | It must remain provider-independent and execute before AI processing. |
| `parent-dashboard` | Aggregates a household-authorized student's topics, signals, wins, and safety events. | Never expose encrypted turn text through this endpoint. |

## Platform layer

- `platform/http` installs security headers, Redis-backed rate limiting, load-pressure checks, request context, error formatting, JSON enforcement, and parent-route protection.
- `platform/database` contains schema definitions, migration runner, client, and repositories. Database code belongs in repositories.
- `platform/security/encryption` uses AES-256-GCM with a random 12-byte IV per stored turn and saves IV, tag, and key version with ciphertext.
- `platform/notifications/mailer` sends a safety-alert email through SMTP or writes it to Nodemailer's JSON transport when SMTP is absent.

## Feature data flow

For an evening check-in, the path is: `ChildSession` → `sessionApi.sendTurn` → shared HTTP client → `/session/turn` route → session service → safety check → encryption/AI/learning services → repositories → Postgres → response. The parent dashboard follows: dashboard component → `loadParentDashboard` → protected dashboard route → dashboard service → dashboard and learning repositories → Postgres → dashboard response.

Use [Architecture](architecture.md) for diagrams, [Data model](data-model.md) for persisted entities, and [API reference](api.md) for the wire contract.
