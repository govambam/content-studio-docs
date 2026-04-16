---
sidebar_position: 1
slug: /intro
sidebar_class_name: doc-new
---

# Introduction

**Content Studio** is a Kanban-style content pipeline tool for Macroscope's
content team. Projects map to Macroscope features; tickets live in one of
four columns (`backlog`, `in_progress`, `in_review`, `done`) and can carry
markdown descriptions, comments, file assets, and a merged activity feed.

## High-level architecture

Content Studio is a monorepo (`npm` workspaces) with three runnable apps and
one shared package:

```
content-studio/
├── apps/
│   ├── web/        # React 19 + Vite SPA
│   ├── api/        # Hono API server (Node 22)
│   └── worker/     # Railway worker for async tasks
├── packages/
│   └── shared/     # Shared TypeScript types (ContentStatus, Project,
│                   # Ticket, Asset, Comment, ApiResponse<T>, …)
└── supabase/
    ├── migrations/ # SQL migrations
    └── seed.sql
```

### Services at runtime

| Piece       | What it does                                                  | Runtime           |
|-------------|---------------------------------------------------------------|-------------------|
| **web**     | React SPA served as static files. Talks to the API over HTTPS and to Supabase Realtime directly (for live Kanban updates). | Railway service, built from `apps/web/Dockerfile` |
| **api**     | Hono HTTP server on Node. Owns all writes to Postgres via the Supabase service-role key, issues signed upload/download URLs for the `assets` bucket, and exposes `/api/webhooks/sentry` to forward issues to Macroscope. | Railway service, built with Nixpacks from the repo root |
| **worker**  | Long-running Node process for async tasks (planned — the scaffold exists in `apps/worker/`). | Railway worker service |
| **Supabase** | Managed Postgres + Storage + Realtime + Auth. Schema is owned by SQL migrations in `supabase/migrations/`. | Supabase cloud |

### Request flow

```
Browser ──────────────► API (Hono)  ──────────────► Supabase
  │   fetch /api/*                     service-role
  │                                    writes + RPCs
  │
  └──────► Supabase Realtime (anon key, read-only)
```

The web app uses the Supabase **anon** key only for Realtime subscriptions.
Every mutating write goes through the API, which uses the **service-role**
key server-side. This keeps RLS off the hot path and centralizes activity
event writes on the server.

## Sidebar

The sidebar provides project navigation and quick-access actions in its
footer:

- **Invite Teammate** — opens the invite flow so you can add collaborators
  to your workspace.
- **Docs** — opens the Content Studio documentation site in a new browser
  tab. The button links to the hosted docs at
  `https://docs-production-40b1.up.railway.app/docs/intro`. It is always
  visible (not gated by a feature flag).

The `DocsButton` component lives in
`apps/web/src/components/DocsButton.tsx`.

### Observability

- **Sentry** (`@sentry/node` in the API) captures unhandled errors via
  `app.onError` in `apps/api/src/index.ts`. Every API response carries an
  `x-request-id` header which is echoed in error bodies as `requestId` so
  a user-facing error ref maps 1:1 to a Sentry event.
- **LaunchDarkly** (`launchdarkly-react-client-sdk` in the web app) gates
  demo-only UI behind the `demoErrorTriggerButton` flag.
- **pino** structured logs on the API, with a base block that includes
  `RELEASE_SHA` so logs can be correlated to deploys.

## What this site covers

- [Local dev setup](./getting-started/local-dev.md)
- [Every env var the app reads](./getting-started/env-vars.md)
- [API shape and conventions](./api/overview.md)
- [Every route in `apps/api/src/routes/`](./api/routes.md)
- [Sentry wiring](./integrations/sentry.md)
- [LaunchDarkly wiring](./integrations/launchdarkly.md)
- [Railway deployment (api via Nixpacks, web via Dockerfile)](./deployment/railway.md)

If anything on this site disagrees with the code in
[`govambam/content-studio`](https://github.com/govambam/content-studio), the
code wins — please open a PR against
[`content-studio-docs`](https://github.com/govambam/content-studio-docs).
