---
sidebar_position: 2
---

# API routes

Every route registered in `apps/api/src/index.ts`, grouped by the file
that owns its handlers. Request/response shapes come from the `zod`
schemas in `apps/api/src/lib/schemas.ts` and the shared types in
`packages/shared/src/index.ts`.

**Auth:** none today — see the [API overview](./overview.md#not-yet).
**Envelope:** every response body is
`{ data: T | null, error: string | null }` (`ApiResponse<T>`).
**Client id header:** most mutating routes read the optional `x-client-id`
request header and attach it to activity events as `meta.source`.

---

## Health

### `GET /api/health`

Liveness check used by Railway (`railway.toml` sets `healthcheckPath =
"/api/health"`).

**Response 200:**
```json
{ "status": "ok", "service": "content-studio-api", "release": "<sha|null>" }
```

Note: this route does **not** use the `ApiResponse<T>` envelope — it's a
flat object by design so Railway's healthcheck parser stays dumb.

---

## Labels — `apps/api/src/routes/labels.ts`

All mounted at `/api/labels`.

### `GET /api/labels`
List all labels ordered by `name` ASC.
**Response:** `ApiResponse<Label[]>`.

### `POST /api/labels`
Create a label.
**Body** (`createLabelSchema`):
```ts
{ name: string /* non-empty, trimmed */, color: string /* non-empty */ }
```
**Response 201:** `ApiResponse<Label>`.

### `GET /api/labels/:id`
Fetch a label by UUID.
**Response:** `ApiResponse<Label>` (404 if not found).

### `GET /api/labels/:id/usage`
Count of projects that reference this label (used by the delete
confirmation dialog).
**Response:** `ApiResponse<{ project_count: number }>`.

### `PUT /api/labels/:id`
Update a label.
**Body** (`updateLabelSchema`): at least one of `name` or `color` must be
present.
**Response:** `ApiResponse<Label>`.

### `DELETE /api/labels/:id`
Delete a label. `project_labels` rows cascade; projects themselves stay.
**Response:** `ApiResponse<null>`.

---

## Projects — `apps/api/src/routes/projects.ts`

All mounted at `/api/projects`.

### `GET /api/projects`
List projects with joined `labels` and a per-status `ticket_counts` map.
**Response:** `ApiResponse<Project[]>` where each `Project` is:
```ts
{
  id: string;
  title: string;
  description: string;
  status: "backlog" | "in_progress" | "in_review" | "done";
  sort_order: number;
  created_at: string;
  updated_at: string;
  labels: Label[];
  ticket_counts: { backlog: number; in_progress: number;
                   in_review: number; done: number };
}
```

### `POST /api/projects`
Create a project. New projects land at the bottom of the `backlog`
column (`sort_order = max+1`).
**Body** (`createProjectSchema`):
```ts
{ title: string; description?: string; labelIds?: string[] /* UUIDs */ }
```
**Response 201:** `ApiResponse<Project>` (refetched with joins).

### `GET /api/projects/:id`
**Response:** `ApiResponse<Project>` (404 if missing).

### `PUT /api/projects/:id`
Update `title` / `description` / `status` / `sort_order` / `labelIds`.
At least one field is required.
Label replacement goes through the `replace_project_labels` Supabase RPC
so the delete + insert is atomic.
**Response:** `ApiResponse<Project>` (404 if missing).

### `DELETE /api/projects/:id`
Cascades tickets, assets, comments, activity events.
**Response:** `ApiResponse<null>` (404 if missing).

---

## Tickets — `apps/api/src/routes/tickets.ts`

Mounted at `/api` (the route prefix is part of each handler's path).

### `GET /api/projects/:projectId/tickets`
List tickets in a project, each annotated with `asset_count` and
`comment_count`.
**Response:** `ApiResponse<Ticket[]>`.

### `POST /api/projects/:projectId/tickets`
Create a ticket at the bottom of the project's `backlog` column.
**Body** (`createTicketSchema`):
```ts
{ title: string; description?: string }
```
**Response 201:** `ApiResponse<Ticket>`. Also writes a `ticket_created`
activity event (best-effort).

### `POST /api/projects/:projectId/tickets/reorder`
Atomic reorder for a single column. Replaces N-PUT drag-end behavior.
**Body** (`reorderTicketsSchema`):
```ts
{
  status: "backlog" | "in_progress" | "in_review" | "done";
  ticketIds: string[];  // UUIDs, no duplicates, max 500
}
```
**Response:** `ApiResponse<null>`. Backed by the `reorder_tickets`
Supabase RPC.

### `GET /api/tickets/:id`
**Response:** `ApiResponse<Ticket>` (single-ticket shape does **not**
include `asset_count` / `comment_count`).

### `PUT /api/tickets/:id`
Update `title` / `description` / `status` / `sort_order`. Emits
`title_changed` / `description_changed` / `status_changed` activity
events for whichever fields actually changed. `sort_order` changes are
intentionally **not** recorded (drag-and-drop would flood the feed).
**Response:** `ApiResponse<Ticket>`.

### `GET /api/tickets/:ticketId/activity`
Merged, reverse-chronological feed of activity events + comments for a
ticket.
**Response:** `ApiResponse<ActivityFeedItem[]>` where:
```ts
type ActivityFeedItem =
  | ({ kind: "event"   } & ActivityEvent)
  | ({ kind: "comment" } & Comment);
```

### `DELETE /api/tickets/:id`
Cascades assets, comments, activity events.
**Response:** `ApiResponse<null>`.

---

## Comments — `apps/api/src/routes/comments.ts`

Mounted at `/api`.

### `GET /api/tickets/:ticketId/comments`
Oldest-first list.
**Response:** `ApiResponse<Comment[]>`.

### `POST /api/tickets/:ticketId/comments`
Create a comment. 404s if the parent ticket doesn't exist (checked before
the insert to avoid a cryptic FK error). Also writes a `comment_added`
activity event.
**Body** (`commentBodySchema`):
```ts
{ body: string /* non-empty, trimmed */ }
```
**Response 201:** `ApiResponse<Comment>`.

### `PUT /api/comments/:id`
Edit body. No activity event emitted.
**Response:** `ApiResponse<Comment>`.

### `DELETE /api/comments/:id`
No activity event emitted.
**Response:** `ApiResponse<null>`.

---

## Assets — `apps/api/src/routes/assets.ts`

Mounted at `/api`. Bucket is `assets`. Max size per upload: 50 MB.

### `GET /api/tickets/:ticketId/assets`
**Response:** `ApiResponse<Asset[]>`.

### `POST /api/tickets/:ticketId/assets`
Two-step upload, step 1. Inserts the row, patches it with the final
`storage_path`, then returns a short-lived **signed upload URL**. The
client PUTs bytes directly to Supabase Storage.

**Body** (`createAssetSchema`):
```ts
{
  filename: string;           // non-empty, trimmed
  mime_type?: string;         // hint only; server re-resolves via
                              // lib/mimeTypes.ts and rejects outside the allowlist
  size_bytes: number;         // integer >= 0, <= 50 MB
}
```

**Response 201:**
```ts
ApiResponse<{
  asset: Asset;                              // row with final storage_path
  upload: { signedUrl: string; token: string; path: string };
}>
```

### `POST /api/assets/:id/confirm`
Step 2. Client calls this after the PUT succeeds. Writes the
`asset_uploaded` activity event — this is deliberately **not** emitted on
step 1 so the feed doesn't show uploads that never completed. Idempotent
via a pre-check on `activity_events.meta->>'asset_id'`.
**Response:** `ApiResponse<null>`.

### `GET /api/assets/:id/download`
Short-TTL signed download URL (300 s).
**Response:** `ApiResponse<{ url: string }>`.

### `DELETE /api/assets/:id`
Removes the storage object (best-effort; a failure is logged but the row
still deletes) then the row, then writes an `asset_deleted` activity
event.
**Response:** `ApiResponse<null>`.

---

## Slack integration — `apps/api/src/routes/slackIntegrations.ts` <span class="badge-new">NEW</span>

All mounted at `/api/slack-integration`. Manages a singleton row in the
`slack_integrations` table that stores the Slack Incoming Webhook
configuration used to post ticket-status notifications.

### `GET /api/slack-integration` <span class="badge-new">NEW</span>

Returns a redacted summary of the current integration. The webhook URL is
**write-only** — it is never returned to the client.

**Response:** `ApiResponse<SlackIntegrationSummary>` (returns `null` data
with no error if no row exists).

### `PUT /api/slack-integration` <span class="badge-new">NEW</span>

Upsert the integration configuration.

**Body:**
```ts
{
  webhook_url: string;        // Slack Incoming Webhook URL
  channel_name?: string;      // display-only label shown in the UI
  enabled: boolean;           // master on/off toggle
  enabled_statuses: string[]; // e.g. ["in_review", "done"]
}
```

**Response:** `ApiResponse<SlackIntegrationSummary>`.

### `DELETE /api/slack-integration` <span class="badge-new">NEW</span>

Remove the integration row entirely.

**Response:** `ApiResponse<null>`.

---

## Invites — `apps/api/src/routes/invites.ts`

Mounted at `/api/invites`. Demo-only; surfaces in the UI only when the
LaunchDarkly `demoErrorTriggerButton` flag is on.

### `POST /api/invites`
**Body:**
```ts
{ email: string }   // required; trimmed
```
**Responses:**
- `200 { data: { sent: true, email }, error: null }` — success stub
  (doesn't actually send email yet).
- `400 { data: null, error: "email is required" }` — missing/empty
  email.
- `409 { data: null, error: "that email is already in this workspace" }`
  — email matches a `WORKSPACE_MEMBERS` entry.

:::caution Known demo bug
`WORKSPACE_MEMBERS[1]` has `profile: null` (an SSO-provisioned row that
is supposed to be backfilled by a sync worker). `isAlreadyMember` calls
`m.profile.email.toLowerCase()` across all members, which **throws**
when it hits the null profile. The throw lands in `app.onError`, which
calls `Sentry.captureException` and returns a `500` with a `requestId`.
This is the intentional trigger used in the Sentry + Macroscope demo
flow — see [Sentry](../integrations/sentry.md).
:::

---

## Sentry webhook — `apps/api/src/routes/sentryWebhook.ts`

### `POST /api/webhooks/sentry`

Receiver for Sentry issue webhooks. Accepts both the legacy Webhooks
plugin payload shape (top-level `message`, `url`, `event`) and the modern
Internal Integration / Sentry App shape (nested under `data.issue` /
`data.event`).

**Behavior:**
1. If `SLACK_INVESTIGATING_WEBHOOK_URL` is set, post a "Macroscope is
   investigating …" message to Slack.
2. Build an agent query referencing the Sentry short-id, title, affected
   transaction, and Sentry issue URL.
3. `POST` to `MACROSCOPE_WEBHOOK_URL` with
   `X-Webhook-Secret: $MACROSCOPE_WEBHOOK_SECRET` and a body of:
   ```json
   {
     "query": "<agent prompt>",
     "responseDestination": { "slackChannelId": "C0ASQPY3GE7" },
     "timezone": "America/Chicago"
   }
   ```
4. Throws synchronously if `MACROSCOPE_WEBHOOK_URL` or
   `MACROSCOPE_WEBHOOK_SECRET` is unset.

**Responses:**
- `200 { data: { workflowId: string | null }, error: null }` — Macroscope
  accepted the forward.
- `502 { data: null, error: "upstream forward failed" }` — Macroscope
  returned a non-2xx.
