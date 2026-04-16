---
sidebar_position: 1
---

# API overview

The API is a Hono app running on Node. The entrypoint is
`apps/api/src/index.ts`. The shape below is exactly what the source looks
like today.

## Server composition

```ts
// apps/api/src/index.ts (trimmed)
import { Sentry } from "./instrument.js";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";

const app = new Hono();

app.use("*", requestContext);
app.use("*", securityHeaders);
app.use("*", cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  allowHeaders: ["Content-Type", "Authorization", "x-client-id", "x-request-id"],
  exposeHeaders: ["x-request-id"],
}));
app.use("*", rateLimit);

app.get("/api/health", (c) => c.json({
  status: "ok",
  service: "content-studio-api",
  release: process.env.RELEASE_SHA ?? null,
}));

app.route("/api/labels",         labels);
app.route("/api/projects",       projects);
app.route("/api",                tickets);       // ticket + activity routes
app.route("/api",                comments);      // comment routes
app.route("/api",                assets);        // asset routes
app.route("/api/invites",        invites);
app.route("/api/webhooks/sentry", sentryWebhook);
```

**Why `./instrument.js` is imported first:** Sentry's SDK patches Node
internals (fetch, http, etc.) and must be loaded before any module that
uses them. Keep that import at the top of `index.ts`.

## Middleware pipeline

Every request passes through four global middleware in order:

1. **`requestContext`** — stamps a `requestId` (and a request-scoped pino
   logger) onto the Hono context and exposes it back in the `x-request-id`
   response header.
2. **`securityHeaders`** — sets the standard hardening headers.
3. **`cors`** — allowlists `FRONTEND_URL` (or `http://localhost:5173`).
   Request headers allowed: `Content-Type`, `Authorization`, `x-client-id`,
   `x-request-id`. `x-request-id` is also in `exposeHeaders` so the
   browser can read it off error responses.
4. **`rateLimit`** — the `hono-rate-limiter` middleware.

## Response shape

All routes return the shared `ApiResponse<T>` envelope defined in
`@content-studio/shared`:

```ts
interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}
```

Success bodies populate `data` and set `error: null`. Failures populate
`error` with a human-readable string and set `data: null`. The HTTP status
code carries the actual category (2xx/4xx/5xx).

## Error handling

`app.onError` in `apps/api/src/index.ts` is the last line of defense:

```ts
app.onError((err, c) => {
  Sentry.captureException(err);
  const log = c.get("logger") ?? logger;
  const requestId = c.get("requestId");
  log.error({ err, path, method }, "unhandled error");
  return c.json({ data: null, error: "internal error", requestId }, 500);
});
```

Two things worth noticing:

- **Every unhandled error goes to Sentry.** The demo flow in
  [LaunchDarkly](../integrations/launchdarkly.md) and
  [Sentry](../integrations/sentry.md) exploits exactly this seam.
- **The 500 body includes `requestId`.** Clients surface this in error
  UIs (see `InviteTeammateModal`) so a user-reported `ref:` maps to a
  specific request in logs and Sentry.

## Validation

Request bodies and params are validated with `zod`. Shared schemas live in
`apps/api/src/lib/schemas.ts` and are consumed via
`parseBody(c, schema)` / `parseParams(c, schema)` helpers from
`apps/api/src/lib/validate.ts`. On validation failure those helpers return
a structured 400 with `{ data: null, error: "<zod message>" }`.

## Client identification

Most mutating routes read `x-client-id` off the request header and persist
it on the row or the activity event (as `updated_by_client` or
`meta.source`). The web app sends a per-tab UUID (see
`apps/web/src/lib/clientId.ts`) so Realtime broadcasts from the
originating tab can be deduped on the client. The header is optional —
it is stored as `null` when absent.

## Not yet

The API **does not currently do authentication** — there is no
`Authorization` bearer check and no session middleware. The allowlist is
effectively "whoever the CORS origin lets in." Access is still protected
by the service-role key staying server-side and by Supabase Storage using
signed URLs, but any docs that claim authenticated endpoints are ahead of
the code. If auth lands, update the routes table in
[API routes](./routes.md).
