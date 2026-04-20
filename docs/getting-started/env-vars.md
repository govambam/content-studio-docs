---
sidebar_position: 2
---

# Env vars reference

Every environment variable Content Studio reads, grouped by the process that
reads it. If a var is documented here but missing from the code, please
open a PR against this repo — the code is the source of truth.

## API (`apps/api`)

The API does **not** currently have a centralized `env.ts`. Vars are read
directly from `process.env` at the call site. The list below is compiled by
grepping `apps/api/src/` for `process.env.*`.

| Var | Required? | Read from | Purpose |
|---|---|---|---|
| `SUPABASE_URL` | **yes** (boot throws without it) | `apps/api/src/db/supabase.ts` | Supabase project URL. Used with the service-role key for every API write. |
| `SUPABASE_SERVICE_ROLE_KEY` | **yes** (boot throws without it) | `apps/api/src/db/supabase.ts` | Service-role key. **Server-only** — never shipped to the browser. |
| `SENTRY_DSN` | **required in production** (boot throws); optional in dev | `apps/api/src/instrument.ts` | Sentry DSN for `@sentry/node`. Omit locally and the API logs `[sentry] SENTRY_DSN not set; error reporting disabled` and continues. |
| `NODE_ENV` | optional (defaults to `"development"`) | `apps/api/src/instrument.ts` | Drives the Sentry `environment` tag and the "require DSN in prod" check. |
| `FRONTEND_URL` | optional (defaults to `http://localhost:5173`) | `apps/api/src/index.ts`, `apps/api/src/services/slackNotifier.ts` | CORS `origin` allowlist; also used as the deep-link base URL in Slack notification messages. Set to the web app's public URL in prod. |
| `PORT` | optional (defaults to `3001`) | `apps/api/src/index.ts` | HTTP port the Hono server binds to. Railway injects this. |
| `RELEASE_SHA` | optional | `apps/api/src/index.ts`, `instrument.ts` | Commit SHA. Surfaced in `/api/health`, pino's base log block, and the Sentry `release` tag. `railway.toml` maps `RAILWAY_GIT_COMMIT_SHA` → `RELEASE_SHA` at deploy time. |
| `MACROSCOPE_WEBHOOK_URL` | **required for the Sentry webhook route** (throws on request) | `apps/api/src/routes/sentryWebhook.ts` | URL Macroscope exposes for remote-trigger ingestion. |
| `MACROSCOPE_WEBHOOK_SECRET` | **required for the Sentry webhook route** | `apps/api/src/routes/sentryWebhook.ts` | Shared secret sent as `X-Webhook-Secret` on the forward. |
| `MACROSCOPE_SLACK_CHANNEL_ID` | optional (defaults to `C0ASQPY3GE7`) | `apps/api/src/routes/sentryWebhook.ts` | Slack channel the Macroscope agent should post its reply into. |
| `SLACK_INVESTIGATING_WEBHOOK_URL` | optional | `apps/api/src/routes/sentryWebhook.ts` | If set, the API posts a ":mag: Macroscope is investigating …" message to this Slack Incoming Webhook before forwarding to Macroscope. Omit to skip the Slack preamble. |

### What `.env.example` ships

```dotenv
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
SENTRY_DSN=...
```

`SUPABASE_ANON_KEY` is listed there but the API itself does not read it — it
is copied into `apps/web/.env.local` as `VITE_SUPABASE_ANON_KEY` for the web
app's Realtime client.

## Web (`apps/web`, Vite)

Vite exposes any var prefixed with `VITE_` to client code via
`import.meta.env.*`. The typed surface lives in `apps/web/src/env.d.ts`:

```ts
interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_RELEASE_SHA?: string;
  readonly VITE_LD_CLIENT_ID?: string;
}
```

Runtime validation runs at module init in `apps/web/src/lib/env.ts`
(`validateEnv()`), which throws synchronously if the required vars are
missing so the build/boot fails loudly instead of silently losing Realtime.

| Var | Required? | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` | **yes** — `validateEnv()` throws if missing | Supabase project URL. Used by the browser Realtime client. |
| `VITE_SUPABASE_ANON_KEY` | **yes** — `validateEnv()` throws if missing | Supabase anon/public key. Safe to ship to the browser. |
| `VITE_API_URL` | optional (defaults to `"/api"`) | Base URL the web app calls for every mutation. In Railway this is set to the API service's public URL. |
| `VITE_RELEASE_SHA` | optional | Commit SHA. Passed to LaunchDarkly as the `application.version` and used in error reporting / version badges. |
| `VITE_LD_CLIENT_ID` | optional | LaunchDarkly client-side ID override. When unset, `apps/web/src/main.tsx` falls back to the hardcoded demo ID `69deb82234109a0a96db7e43`. |

:::note Vite bakes these at build time
`VITE_*` vars are inlined into the JS bundle when `vite build` runs. The
Dockerfile at `apps/web/Dockerfile` accepts them as `ARG`s and re-exports
them as `ENV` before `npm run build` so Railway build-arg values end up
baked into the static bundle. Changing a `VITE_*` var in Railway requires
a **rebuild**, not just a restart.
:::

## Worker (`apps/worker`)

The worker scaffold exists but is not yet running tasks at the time this
doc was generated. Env var surface: **TBD** — update this table once the
worker reads any `process.env.*`.
