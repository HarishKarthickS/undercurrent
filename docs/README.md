# Undercurrent documentation

Undercurrent is a parent-visible learning companion. A child explains an idea to a curious companion; the system turns that explanation into gentle follow-up prompts and topic-level signals for a parent.

## Start here

| If you are… | Read… |
| --- | --- |
| Understanding the product or its boundaries | [Product overview](product-overview.md) |
| Joining the engineering team | [Development guide](development.md) and [System guide](system-guide.md) |
| Calling or changing the HTTP API | [API reference](api.md) |
| Changing persistence | [Data model](data-model.md) |
| Reviewing privacy or safeguarding | [Security, privacy, and safety](security-privacy-safety.md) |
| Running a deployment | [Operations guide](operations.md) |
| Running checks or adding tests | [Testing and quality](testing-quality.md) |

## Documentation map

- [Architecture](architecture.md) explains the deployed components and the important request flows.
- [System guide](system-guide.md) maps the frontend and backend modules to their responsibilities and extension points.
- [Development guide](development.md) covers setup, workflows, migrations, seed data, and repository conventions.
- [API reference](api.md) is the contract for every implemented endpoint.

## Glossary

| Term | Meaning |
| --- | --- |
| Household | The tenant boundary that owns parent accounts and child profiles. |
| Parent session | A short-lived, HttpOnly cookie-backed session associated with one invited guardian and household. |
| Student | A child profile. A granted `learning_companion` consent record is required before sessions can start. |
| Session | A morning or evening check-in for one student. |
| Turn | One child input and, for a normal evening turn, one companion response. |
| Topic signal | A private, heuristic assessment of a child explanation used for parent-facing trends; it is not a grade. |
| Safety event | Metadata recorded when deterministic text matching detects an urgent safety phrase. Triggering text is not persisted. |
| Outbox event | A durable event-table record reserved for asynchronous processing. No worker consumes it in the current implementation. |

## Current implementation boundaries

The web application supports invitation-bound guardian signup, email verification, password login, and cookie-plus-CSRF authentication. It operates in closed-demo mode only: public enrollment is disabled, the terms checkbox is not verified parental consent, and the service must not be described as production-ready for public child use.
