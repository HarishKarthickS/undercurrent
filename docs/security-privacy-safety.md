# Security, privacy, and safety

## Closed-demo boundary

The application supports only `DEPLOYMENT_MODE=closed_demo`. It rejects public mode at startup. Parent accounts require an operator-issued, one-use invitation; a checkbox records versioned closed-demo terms acknowledgement and is **not** verified parental consent. Do not describe this service as COPPA-ready, verified-parental-consent ready, or suitable for public child enrollment.

Child records can be exported by the household owner, withdrawn immediately (which blocks sessions and revokes student access), and deleted by the household owner. A daily retention command removes child-linked data after 30 days of inactivity; non-child operational audit handling must be configured separately by the VPS operator.

## Reflection archive

Ordinary evening turn content remains encrypted at rest. Completed non-safety sessions may create a concise child-readable recap and discovery marker. Household-authorized parents can retrieve the recap and decrypt original ordinary-session turns in the parent control center; a student device can retrieve only its own history. Safety-trigger content is excluded from recaps, transcripts, and archive views.

## Implemented controls

| Area | Current behavior |
| --- | --- |
| Transport boundary | Production guidance requires HTTPS. The repository itself does not terminate TLS; deploy a TLS-capable edge in front of Nginx. |
| Parent authorization | Protected routes require a `Bearer` token. The database holds only its SHA-256 hash and checks the 12-hour expiry. Household ownership is checked before student/session/dashboard access. |
| Passwords | Account passwords are hashed with Argon2id. Login requires email verification. |
| Stored conversation content | Ordinary evening child/companion turns are encrypted with AES-256-GCM using a base64-decoded 32-byte key and a random 12-byte IV per record. Ciphertext, IV, GCM tag, and key version are persisted. |
| Browser/API hardening | Helmet headers (without CSP), JSON-only body enforcement, a body-size limit, request IDs, Redis-backed IP rate limits, and Fastify pressure protection are enabled. |
| Error disclosure | Expected errors expose a code/message/request ID. Unexpected errors are logged server-side and return a generic `INTERNAL_ERROR`. Authorization/cookie response headers are redacted from Fastify logs. |
| AI boundary | A normal evening turn fails closed with `AI_UNAVAILABLE` if the AI client or encryption service is unavailable. It never returns a fabricated personalized reply. |

`ALLOWED_ORIGINS` is present in `.env.example` and Compose but is not consumed by the server; no CORS plugin is registered. Do not rely on that variable as a CORS control.

## Safety workflow

Safety screening is a synchronous, deterministic regular-expression check before encryption or any AI request. It recognizes narrow phrase patterns for `immediate_danger`, `unsafe_at_home`, and `medical_emergency`. On a match, the service:

1. creates a `safety_events` metadata record with category and IDs;
2. marks the session ended with reason `safety`;
3. calls the configured mailer with a parent alert; and
4. returns a terminal trusted-grown-up redirect to the child UI.

The triggering input is intentionally not written to `session_turns`. The parent dashboard contains event metadata and fixed action copy, not triggering text. Safety alerts use the parent email from the authenticated parent-session lookup; the local demo parent email is an `.invalid` address, so it cannot receive real mail.

## AI safeguards

The AI adapter calls the OpenAI-compatible Responses API with strict JSON schemas: two private assessments and one constrained response. The companion prompt tells the model to ask one short age-appropriate follow-up, praise process rather than ability, avoid grades/correctness, and not claim feelings, neediness, friendship, or therapeutic authority. A post-generation banned-term pattern provides a small additional check and substitutes a neutral fallback when it matches.

These controls reduce predictable failure modes but do not guarantee all model output is appropriate. Prompt changes, model changes, and safety-regex changes require human review and tests.

## Consent and privacy

The sole implemented consent workflow is a parent-provided boolean plus reference when creating a student. It creates a granted `learning_companion` record labeled `local-notice-v1`. Sessions are denied unless the student's matching record remains `granted`. No UI or endpoint exists to withdraw consent, export data, delete data, or alter a retention period.

The parent dashboard returns learning metadata and safety metadata but not encrypted transcripts. However, encryption is not access-control by itself: server code with the configured key can decrypt stored turns. Keep keys separate from the database, restrict access, and plan rotation before production.

## Implemented boundaries and limitations

- `AUTH_MODE`, `AUTH0_ISSUER`, `AUTH0_AUDIENCE`, and related claim variables are placeholders. Auth0 is not registered or consulted.
- Account email verification and magic-link endpoints return their raw token to the API caller. They do not send an account email and should not be exposed unchanged to an untrusted browser in production.
- Parent session records, magic tokens, verification hashes, and encrypted turns have no automatic cleanup.
- The service does not provide legal compliance certification. Email attestation is a product flow, not proof that every parental-consent requirement is satisfied.
- SMTP is optional; absent SMTP, Nodemailer creates JSON messages rather than delivery.

## Production security checklist

1. Put the gateway behind HTTPS and configure the real proxy behavior before enabling `TRUST_PROXY=true`.
2. Use managed, access-controlled secrets for `DATABASE_URL`, `OPENAI_API_KEY`, `ENCRYPTION_KEY`, and SMTP credentials; never include them in documentation, images, or source control.
3. Implement and review verified parent identity, email delivery, account recovery, CORS policy, consent withdrawal, deletion/export, retention, key rotation, monitoring, and incident response.
4. Validate model/provider contracts and guardrails with realistic adversarial and child-safety testing.
5. Obtain legal/privacy and safeguarding review appropriate to the launch jurisdiction and audience.
