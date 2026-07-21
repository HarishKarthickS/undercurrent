# Render free demo deployment

This Blueprint deploys the whole browser experience and the API on one Render web-service URL. Keeping the frontend and API on the same origin is required because authentication and student access use secure cookies.

## Public app URL before deploy

You do not need a successful deploy to know the URL. Render assigns it from the web service `name` in `render.yaml`:

`https://undercurrent-demo.onrender.com`

That value is already set as `PUBLIC_APP_URL` in the Blueprint. Change it only if:

- you rename the service in `render.yaml`,
- Render appends a suffix because `undercurrent-demo` is already taken (check the service URL in the Render dashboard after the service is created, even before the first healthy deploy), or
- you attach a custom HTTPS domain.

## Deploy

1. Push this repository to GitHub.
2. In Render, select **New > Blueprint** and choose the repository. Render discovers `render.yaml`.
3. At the secret prompts, provide:
   - `DEMO_TERMS_SHA256`: the SHA-256 hash of the reviewed closed-demo terms.
   - `ENCRYPTION_KEY`: a base64-encoded, 32-byte key. Keep this key safely backed up; encrypted learning turns cannot be recovered without it.
   - `OPENAI_API_KEY`: API key for your OpenAI-compatible provider.
   - `OPENAI_BASE_URL`: OpenAI-compatible base URL (for example `https://openrouter.ai/api/v1`, or leave empty for the default OpenAI endpoint).
   - `OPENAI_MODEL`: model id that matches that provider (for example `openrouter/free` or `gpt-4o-mini`).
   - `SMTP_URL` and `MAIL_FROM` for invitation/safety emails.
4. Confirm `PUBLIC_APP_URL` matches the service URL shown in Render (`https://undercurrent-demo.onrender.com` unless renamed or suffixed).
5. Wait for the API health check at `/ready` to pass. The React app and Fastify API are served from the same URL. The Render build removes the development-only `/api` gateway prefix, so the browser calls the API directly on that origin.

Render runs migrations in the web-service start command because pre-deploy commands are not available on its free web plan. Drizzle migration runs are idempotent, so this is safe on a free-service restart.

## Free-plan boundaries

This configuration is for a closed demo only. Render's free web services sleep after inactivity, free PostgreSQL expires after 30 days, and free Key Value has no persistence. The retention process is not scheduled on Render's free tier, so run `npm run retention:run` manually with the production environment when required. Before a real pilot, move to a paid plan, configure backups, and schedule retention.
