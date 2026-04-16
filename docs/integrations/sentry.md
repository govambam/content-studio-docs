---
sidebar_position: 1
---

# Sentry

Content Studio uses `@sentry/node` on the API side. There is **no** Sentry
SDK on the web side today — browser errors don't surface in Sentry. If
that changes, add a section here.

## Initialization

`apps/api/src/instrument.ts`:

```ts
import * as Sentry from "@sentry/node";

const dsn = process.env.SENTRY_DSN;
const environment = process.env.NODE_ENV || "development";

if (!dsn) {
  if (environment === "production") {
    // Fail closed in production — we don't want a silently un-instrumented API.
    throw new Error("SENTRY_DSN is required in production");
  }
  console.warn("[sentry] SENTRY_DSN not set; error reporting disabled");
} else {
  Sentry.init({
    dsn,
    environment,
    tracesSampleRate: 0.1,
    release: process.env.RELEASE_SHA || undefined,
  });
}

export { Sentry };
```

Two non-obvious choices:

- **It's imported first.** The very first line of `apps/api/src/index.ts`
  is `import { Sentry } from "./instrument.js";`. The Sentry SDK monkey-patches
  Node internals (fetch, http, …) and must run before any module that uses
  them, so this import has to come before anything else — including other
  `./routes/*` imports.
- **Production fails closed.** If `NODE_ENV=production` and `SENTRY_DSN`
  is unset, the API refuses to boot. Locally it prints a warning and
  continues.

## What gets captured

Errors are captured in exactly one place: the global error handler in
`apps/api/src/index.ts`.

```ts
app.onError((err, c) => {
  Sentry.captureException(err);
  // … log + return 500 with requestId
});
```

Consequences:

- Any unhandled throw in any route handler becomes a Sentry event.
- Zod validation failures that return a 400 through the `parseBody` /
  `parseParams` helpers are **not** captured — they aren't thrown.
- Explicit `c.json({ error: "…" }, 5xx)` responses aren't captured either
  — only actual throws.

The Sentry event is tagged with:

- `environment` — from `NODE_ENV`.
- `release` — from `RELEASE_SHA`, which Railway maps from
  `RAILWAY_GIT_COMMIT_SHA` via `railway.toml`. This means a Sentry issue
  links 1:1 to a Git SHA in `govambam/content-studio`.

Traces are sampled at `tracesSampleRate: 0.1` (10%).

## The "trigger error" demo

There is no dedicated `/api/trigger-error` endpoint. The demo flow reuses
a real endpoint that intentionally has a known bug, gated behind a
LaunchDarkly flag:

1. User toggles the LaunchDarkly `demoErrorTriggerButton` flag on.
2. Web app renders the **Invite Teammate** button in the sidebar
   (`apps/web/src/components/InviteTeammateButton.tsx`).
3. User clicks it, enters an email, submits → `POST /api/invites`.
4. The handler calls `isAlreadyMember(email)`
   (`apps/api/src/lib/workspaceMembers.ts`), which iterates a hardcoded
   `WORKSPACE_MEMBERS` list. One of those members has
   `profile: null` (an SSO-provisioned row awaiting profile backfill);
   the iteration calls `m.profile.email.toLowerCase()` and throws
   `TypeError: Cannot read properties of null`.
5. `app.onError` catches it, `Sentry.captureException(err)` fires.
6. The response is `500 { data: null, error: "internal error", requestId }`.
7. The `InviteTeammateModal` surfaces a friendly message plus the
   `ref: <requestId>` so the user's screenshot maps to a specific
   Sentry event.

## From Sentry to Macroscope

Sentry is configured to POST new issues to
`POST /api/webhooks/sentry`. That handler lives in
`apps/api/src/routes/sentryWebhook.ts` and:

1. Optionally posts a Slack "Macroscope is investigating …" preamble
   (gated on `SLACK_INVESTIGATING_WEBHOOK_URL` being set).
2. Forwards a structured agent query to `MACROSCOPE_WEBHOOK_URL` with
   `X-Webhook-Secret: $MACROSCOPE_WEBHOOK_SECRET`.

See [API routes → Sentry webhook](../api/routes.md#sentry-webhook--appsapisrcroutessentrywebhookts)
for the exact forwarded payload.

## Env vars it reads

- `SENTRY_DSN` — Sentry project DSN. Required in production, optional
  locally.
- `NODE_ENV` — picks the Sentry environment tag.
- `RELEASE_SHA` — set as Sentry's `release`.

Full list on the [Env vars page](../getting-started/env-vars.md).
