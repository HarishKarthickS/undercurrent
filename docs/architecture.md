# Architecture

## Component topology

```mermaid
flowchart LR
  Browser[React web application] -->|/api via Vite proxy or Nginx| API[Fastify API]
  API --> PG[(PostgreSQL via Drizzle)]
  API --> Redis[(Redis)]
  API --> AI[OpenAI-compatible Responses API]
  API --> SMTP[SMTP transport]
  Gateway[Nginx gateway] -->|serves static web build| Browser
  Gateway -->|/api/; strips prefix| API
```

The browser calls `/api/*`. Vite rewrites `/api` away in local development; Nginx does the same in the production Compose topology. Fastify therefore registers routes such as `/students`, not `/api/students`.

## Authenticated request flow

```mermaid
sequenceDiagram
  participant W as Web app
  participant A as Fastify
  participant R as Redis
  participant P as PostgreSQL
  W->>A: Request with Bearer parent token
  A->>R: Consume IP rate-limit budget
  A->>P: SHA-256 token lookup and expiry check
  P-->>A: Parent and household session
  A->>A: Attach request.parentSession
  A->>P: Enforce household ownership / consent
  A-->>W: JSON response or structured error
```

Only health, readiness, and identity routes are public. Student, session, and dashboard routes are registered inside the parent-auth plugin.

## Evening learning turn

```mermaid
flowchart TD
  Input[Child input] --> Safe{Deterministic safety match?}
  Safe -->|Yes| Event[Store safety metadata]
  Event --> End[End session and send parent alert]
  End --> Redirect[Return trusted-grown-up redirect]
  Safe -->|No| Ready{AI client and encryption key configured?}
  Ready -->|No| Unavailable[503 AI_UNAVAILABLE]
  Ready -->|Yes| Encrypt[Encrypt child turn with AES-256-GCM]
  Encrypt --> Assess[Run two private structured assessments]
  Assess --> Learn[Reconcile signal, schedule review, choose scaffold]
  Learn --> Compose[Generate constrained companion reply]
  Compose --> Persist[Encrypt reply; persist topic, score, progress, optional win]
  Persist --> Reply[Return reply]
```

Idempotency is enforced before this flow. A `(sessionId, idempotencyKey)` pair can replay a completed response only when its input hash matches; an unfinished or mismatched duplicate receives `409`.

## Deployment topology

```mermaid
flowchart TB
  subgraph Compose internal network
    PG[postgres:17-alpine]
    Redis[redis:7-alpine]
    Migrate[One-shot migration container]
    API[API container :3001]
    Nginx[Unprivileged Nginx :8080]
    Migrate --> PG
    API --> PG
    API --> Redis
    Nginx --> API
  end
  Internet --> Nginx
```

The production Compose file waits for Postgres and Redis health checks, runs migrations once, then starts the API. The development overlay enables watch-mode API and Vite services and disables the production gateway unless its profile is selected.

## Cross-cutting behavior

- `registerMiddleware` installs request IDs, Helmet, Redis-backed rate limiting, pressure checks, and JSON body-content enforcement.
- `createServer` owns composition: it creates infrastructure clients, services, and route registration in one place.
- Repositories are the only API-module layer that issues Drizzle queries. Modules receive a frozen aggregate of repository functions.
- Error payloads use `{ "error": { "code", "message", "requestId" } }`; the request ID is absent only where the underlying framework error response is returned directly.
