# API reference

## Conventions

The browser-facing base URL is `/api`; the gateway/proxy removes that prefix before Fastify sees the request. API examples below use `/api`.

All body-bearing `POST`, `PUT`, `PATCH`, and `DELETE` requests must use `Content-Type: application/json`. JSON request bodies are limited to `BODY_LIMIT_BYTES` (16,384 bytes by default). Browser authentication uses HttpOnly cookies; unsafe requests first obtain `GET /auth/csrf` and send its value in `X-CSRF-Token`. Public routes are rate-limited and closed-demo signup requires a valid invitation token.

Successful responses are JSON. Normal errors use:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request data is invalid.",
    "requestId": "request-id"
  }
}
```

Common HTTP outcomes are `400` invalid request or JSON, `401` absent/invalid/expired parent session, `403` cross-household access or missing consent, `404` missing route/session, `409` conflicting session/idempotency state, `413` oversized body, `415` non-JSON body, `429` rate limit, `500` unexpected failure, and `503` overload/readiness/AI unavailability.

## Public endpoints

| Method and path | Purpose | Response |
| --- | --- | --- |
| `GET /health` | Process liveness; does not probe dependencies. | `{ "status": "ok" }` |
| `GET /ready` | Readiness; checks Postgres and Redis. | `200 { "status": "ready" }` or `503 { "status": "not_ready" }` |
| `GET /auth/csrf` | Creates/returns the browser CSRF token. | `{ "token" }` |
| `POST /auth/signup` | Creates an invitation-bound unverified guardian account. | `202 { "accepted": true }` |
| `POST /auth/verify-email` | Marks a matching account verified and issues a session. | parent-session object |
| `POST /auth/login` | Checks a verified account password and issues a session. | parent-session object |
| `POST /auth/magic-link` | Creates a 15-minute magic token for a verified account. | `{ "accepted": true, "token" }` when applicable |
| `POST /auth/magic-link/consume` | Consumes a valid magic token and issues a session. | parent-session object |

### Parent-session object

```json
{
  "token": "parent_<opaque-token>",
  "expiresAt": "2026-01-01T12:00:00.000Z",
  "parent": { "id": "uuid", "displayName": "Parent name" },
  "household": { "id": "uuid", "name": "Household" }
}
```

The account endpoints validate request bodies. Signup requires a matching operator-issued invitation, a non-empty display name, an email-shaped address, and a password of at least 12 characters; login requires verified email. The service runs only in closed-demo mode and does not provide public enrollment or verified parental consent.

```json
// signup
{ "displayName": "A parent", "email": "parent@example.test", "password": "at-least-12-chars", "invitationToken": "operator-issued-token" }
// verify email
{ "parentId": "uuid", "token": "verification-token" }
// login
{ "email": "parent@example.test", "password": "at-least-12-chars" }
// request magic link
{ "email": "parent@example.test" }
// consume magic link
{ "token": "magic-token" }
```

## Protected endpoints

### Students

| Method and path | Request | Response |
| --- | --- | --- |
| `GET /students` | Guardian cookie session | `{ "students": [student] }` (up to 10 newest household profiles) |
| `POST /students` | Guardian cookie session, CSRF token, and create body | `201 { "student": student }` |

```json
{
  "name": "Ari",
  "grade": "4",
  "routineMorning": "after breakfast",
  "routineEvening": "after dinner",
  "demoTermsAcknowledged": true
}
```

`name` is 1–100 characters, `grade` is 1–32, each routine is nullable and at most 100, and the consent reference is 1–200. The service rejects false/missing consent and creates a granted `learning_companion` record transactionally with the student.

### Sessions

| Method and path | Request | Response |
| --- | --- | --- |
| `POST /session/start` | `{ "studentId": "uuid", "type": "morning" \| "evening" }` | `{ "sessionId", "sessionType", "openingPrompt" }` |
| `POST /session/turn` | turn body below | `{ "message", "terminal", "parentNotification"? }` |
| `POST /session/end` | `{ "sessionId": "uuid", "reason"?: "child_exit" }` | `{ "ok": true }` |

`studentId` must belong to the parent session's household and have granted consent. `type` defaults to `evening` if omitted. A turn request is:

```json
{
  "sessionId": "uuid",
  "input": "I learned why the moon changes shape.",
  "inputMode": "typed",
  "idempotencyKey": "uuid-or-other-stable-retry-key"
}
```

`input` is 1–4,000 characters; `inputMode`, when present, is `typed`, `voice`, or `tap`; the idempotency key is 1–128 characters. Retrying exactly the same turn uses the same key and returns its completed cached response. Reusing a key with different input yields `IDEMPOTENCY_MISMATCH`; a duplicate still being processed yields `TURN_IN_PROGRESS`.

For an ordinary evening turn, missing AI credentials or an encryption key yields `503 AI_UNAVAILABLE`. A safety match returns a terminal redirect with `parentNotification: true`; child text causing that match is not saved. An ended session yields `409 SESSION_ENDED`.

### Parent dashboard

`GET /parent/:studentId/dashboard` requires a guardian cookie session and a UUID path parameter. It verifies household access and returns an object with these top-level fields:

| Field | Meaning |
| --- | --- |
| `student` | `{ id, name, grade }` |
| `sessionCount` | Number of all sessions for the student. |
| `topics` | Topic label, next review, signal count, gap label, and non-grade trend. |
| `upcomingReviews` | Topics whose scheduled review is due. |
| `effortMoments` | Up to five recent persistence/returning messages. |
| `safety` | Up to five safety-event metadata records and parent action copy. |
| `conversationStarters` | Up to three suggested parent prompts. |
| `thisWeek` | Current implementation's routine note and `completedSessions: 0` placeholder. |
| `transparency` | Fixed text describing the intended parent view. |

The dashboard does not return session-turn ciphertext or plaintext. It can return `403 ACCESS_DENIED` when a UUID is valid but belongs to a different household.

### Parent experience controls

`PUT /parent/:studentId/experience` saves the authenticated parent's child-specific dashboard layout, guidance mode, goal configuration, and explicit transcript/advisor consent. `PUT /parent/experience/household` saves household-wide in-app daily and weekly digest preferences. Transcript-aware AI cannot be enabled unless encrypted transcript archive consent is already active. Both endpoints enforce household ownership and return the saved preferences.
