---
sidebar_position: 1
---

# Local development

Content Studio is an `npm` workspaces monorepo. You run the web and API
dev servers in two terminals; Supabase is remote (no local stack required).

## Prerequisites

- **Node 20 or newer** — `package.json` declares `"engines": { "node": ">=20" }`
  and the Dockerfile builds against `node:22-slim`.
- **npm 10+** (bundled with modern Node).
- A Supabase project with the migrations in `supabase/migrations/` applied
  and the `assets` storage bucket created.
- A `.env` at the repo root (copy from `.env.example`).

## 1. Clone and install

```bash
git clone https://github.com/govambam/content-studio.git
cd content-studio
npm install
```

`npm install` installs dependencies for every workspace
(`apps/api`, `apps/web`, `apps/worker`, `packages/shared`) because they all
share the root lockfile.

## 2. Configure env vars

Copy the template and fill in the values:

```bash
cp .env.example .env
```

Minimum you need for `npm run dev:api` to boot:

```dotenv
SUPABASE_URL=https://<ref>.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
# SENTRY_DSN is optional locally — omitting it prints a warning; in
# production the API throws at boot if SENTRY_DSN is missing.
```

The web app reads `VITE_*` vars. Create `apps/web/.env.local`:

```dotenv
VITE_API_URL=http://localhost:3001/api
VITE_SUPABASE_URL=https://<ref>.supabase.co
VITE_SUPABASE_ANON_KEY=...
# VITE_LD_CLIENT_ID is optional — the app falls back to the hardcoded
# Macroscope demo client-side ID in apps/web/src/main.tsx if unset.
```

See the full reference on the [Env vars page](./env-vars.md).

## 3. Run the dev servers

```bash
# terminal 1 — API on http://localhost:3001
npm run dev:api

# terminal 2 — Web on http://localhost:5173
npm run dev:web
```

The root `package.json` script wiring:

```json
{
  "scripts": {
    "dev:web": "npm run dev -w apps/web",
    "dev:api": "npm run dev -w apps/api",
    "build":   "npm run build --workspaces --if-present",
    "start":   "npm run start -w apps/api",
    "typecheck": "tsc --build"
  }
}
```

`dev:api` runs `tsx watch src/index.ts`; `dev:web` runs `vite`.

## 4. Health-check

With the API up:

```bash
curl http://localhost:3001/api/health
# {"status":"ok","service":"content-studio-api","release":null}
```

`release` is `null` locally because `RELEASE_SHA` is only injected by
Railway at deploy time (see `railway.toml`).

## 5. Typecheck and build

```bash
npm run typecheck        # tsc --build across all workspaces
npm run build            # build every workspace that has a build script
```

`apps/web` builds with `tsc -b && vite build`; `apps/api` builds with
`tsc -b` and emits `dist/index.js` (the prod entrypoint).

## Troubleshooting

- **"Missing required env vars: VITE_SUPABASE_URL, …"** — thrown
  synchronously at module init from `apps/web/src/lib/env.ts`. The web
  app refuses to boot without Supabase vars because Realtime would
  silently stop working otherwise.
- **"Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"** — thrown from
  `apps/api/src/db/supabase.ts` at API boot. Same idea, but for the
  server.
- **"SENTRY_DSN is required in production"** — only thrown when
  `NODE_ENV=production`. Locally the API prints
  `[sentry] SENTRY_DSN not set; error reporting disabled` and keeps
  going.
