# Render free demo deployment

This Blueprint deploys the whole browser experience and the API on one Render web-service URL. Keeping the frontend and API on the same origin is required because authentication and student access use secure cookies.

## Deploy

1. Push this repository to GitHub.
2. In Render, select **New > Blueprint** and choose the repository. Render discovers `render.yaml`.
3. At the secret prompts, provide:
   - `DEMO_TERMS_SHA256`: the SHA-256 hash of the reviewed closed-demo terms.
   - `ENCRYPTION_KEY`: a base64-encoded, 32-byte key. Keep this key safely backed up; encrypted learning turns cannot be recovered without it.
   - `OPENAI_API_KEY`, `SMTP_URL`, and `MAIL_FROM` for AI turns and invitation/safety emails.
   - `PUBLIC_APP_URL`: after the first deploy, set this to the service's `https://...onrender.com` URL (or your custom HTTPS domain) and redeploy.
4. Wait for the API health check at `/ready` to pass. The React app and Fastify API are served from the same URL. The Render build removes the development-only `/api` gateway prefix, so the browser calls the API directly on that origin.

Render runs migrations in the web-service start command because pre-deploy commands are not available on its free web plan. Drizzle migration runs are idempotent, so this is safe on a free-service restart.

## Free-plan boundaries

This configuration is for a closed demo only. Render's free web services sleep after inactivity, free PostgreSQL expires after 30 days, and free Key Value has no persistence. The retention process is not scheduled on Render's free tier, so run `npm run retention:run` manually with the production environment when required. Before a real pilot, move to a paid plan, configure backups, and schedule retention.
