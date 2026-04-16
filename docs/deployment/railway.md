---
sidebar_position: 1
---

# Railway

Content Studio deploys as **two Railway services** from the same monorepo:

| Service | Builder | Source |
|---|---|---|
| **api** | Nixpacks (Railway default) | Repo root (`railway.toml` at the top of the tree) |
| **web** | Docker | `apps/web/Dockerfile` |

Both services redeploy on push to `main` in
[`govambam/content-studio`](https://github.com/govambam/content-studio).

## api — Nixpacks

`railway.toml` at the repo root:

```toml
[build]
builder = "NIXPACKS"

[deploy]
healthcheckPath = "/api/health"
healthcheckTimeout = 30
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10

[deploy.variables]
RELEASE_SHA = "${{RAILWAY_GIT_COMMIT_SHA}}"
```

What this gives you:

- **Nixpacks** auto-detects the Node workspace and runs
  `npm install` followed by the root `npm run build`. At runtime the
  service runs `npm start`, which is wired to
  `npm run start -w apps/api` → `node dist/index.js`.
- **Healthcheck at `/api/health`.** The handler in
  `apps/api/src/index.ts` returns `{ status: "ok", … }` — Railway will
  withhold traffic until it comes back 200.
- **Automatic restarts.** On-failure with up to 10 retries.
- **`RELEASE_SHA` injected from Railway's commit SHA.** This feeds
  `/api/health.release`, pino's base log block, and the Sentry `release`
  tag without any CI wiring.

### Required env vars on the api service

Set these in the Railway dashboard (see
[Env vars reference](../getting-started/env-vars.md) for the full
story):

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SENTRY_DSN` (required when `NODE_ENV=production`)
- `NODE_ENV=production`
- `FRONTEND_URL=https://<your-web-service>.up.railway.app`
- `MACROSCOPE_WEBHOOK_URL`
- `MACROSCOPE_WEBHOOK_SECRET`

Optional:

- `MACROSCOPE_SLACK_CHANNEL_ID` (defaults to `C0ASQPY3GE7`)
- `SLACK_INVESTIGATING_WEBHOOK_URL`

`PORT` is injected by Railway — don't set it manually.

## web — Dockerfile

`apps/web/Dockerfile`:

```dockerfile
FROM node:22-slim AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/web/package.json ./apps/web/

RUN npm ci

COPY packages/shared/ ./packages/shared/
COPY apps/web/ ./apps/web/
COPY tsconfig.json ./

# Vite bakes VITE_* env vars at build time — pass them as build args
ARG VITE_API_URL
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_LD_CLIENT_ID
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_LD_CLIENT_ID=$VITE_LD_CLIENT_ID

RUN npm run build -w packages/shared && npm run build -w apps/web

FROM node:22-slim
WORKDIR /app
RUN npm install -g serve@14
COPY --from=builder /app/apps/web/dist/ ./dist/

CMD ["serve", "-s", "dist", "-l", "3000"]
```

Two-stage build: compile with Vite, then serve the static `dist/` with
`serve` on port 3000.

### The `RAILWAY_DOCKERFILE_PATH` gotcha

By default Railway looks for a `Dockerfile` at the **build context root**.
Because this Dockerfile lives at `apps/web/Dockerfile` but references
files from the whole monorepo (`packages/shared/`, root `package.json`,
root `tsconfig.json`), you need **both**:

1. **Root directory / build context** → `/` (the repo root), **not**
   `/apps/web`. If you point the build context at `apps/web` the
   `COPY packages/shared/...` line fails with "file not found."
2. **`RAILWAY_DOCKERFILE_PATH`** service variable set to
   `apps/web/Dockerfile` so Railway knows where to find the Dockerfile
   inside that root context.

Forgetting #2 produces "no Dockerfile found" errors even though the file
is clearly in the repo. Forgetting #1 produces copy failures deep inside
the build.

### Build-time VITE_* args

Because Vite inlines `VITE_*` at build time, these must be supplied as
**build arguments** in Railway (Service → Settings → Build → Build
Arguments), not just runtime environment variables:

- `VITE_API_URL` — e.g. `https://<api-service>.up.railway.app/api`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_LD_CLIENT_ID` (optional)

`VITE_RELEASE_SHA` is read by `apps/web/src/main.tsx` but is **not**
currently passed through as a build arg — set it as a build arg if you
want version-tagged LD contexts in the web bundle.

Changing any `VITE_*` value requires a **redeploy** (rebuild). Just
restarting the service will not pick up the new value because it's
baked into the JS bundle.

### Runtime

- Port: `3000` (the `serve -s dist -l 3000` command).
- No healthcheck is configured in `railway.toml` for the web service —
  Railway's TCP check on port `3000` is sufficient for static serving.

## Promotion & rollbacks

There is no staging environment checked into this repo. Deploys go
straight to production on `main`. Rollback happens via Railway's
"Redeploy" button on a previous successful deploy.
