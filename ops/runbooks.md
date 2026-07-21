# Closed-demo runbooks

## Safety event

1. Confirm the child received the trusted-grown-up redirect and the parent email was accepted by the SMTP provider.
2. If delivery failed, contact the enrolled owner through the approved out-of-band channel; do not copy triggering text into tickets or chat.
3. Record only the event ID, category, time, delivery result, and operator action.

## AI outage or cost alarm

1. Disable `OPENAI_API_KEY` or set the household quota to zero if unsafe or unexpected output is observed.
2. Keep the curated unavailable response enabled; do not retry failed child turns manually.
3. Preserve request IDs and provider status, not child text, for investigation.

## Restore and key incident

1. Stop public ingress, preserve the current encrypted backup, and rotate all exposed application secrets.
2. Restore the latest backup into an isolated database first; verify migrations and encrypted-turn decryption with the retained key material.
3. Do not reopen the demo until the restore and owner-notification decision are documented.
