---
sidebar_position: 3
---

# Slack ticket notifications <span class="badge-new">NEW</span>

Content Studio can post a rich Slack message whenever a ticket transitions
to a configured status (e.g. **In Review** or **Done**). The integration
uses a standard Slack
[incoming webhook](https://api.slack.com/messaging/webhooks) — no Slack
app install or OAuth flow is required.

## How it works <span class="badge-new">NEW</span>

1. An operator opens the **Slack Notifications** modal from the sidebar
   and pastes an incoming webhook URL.
2. They choose which status transitions should trigger a post (defaults
   to **In Review** and **Done**).
3. When any ticket's status is updated via `PUT /api/tickets/:id` and the
   new status is in the allowed list, the API fires a background call to
   `slackNotifier.ts`.
4. The notifier loads the singleton row from the `slack_integrations`
   table, builds a Slack Block Kit payload, and POSTs it to the stored
   webhook URL.
5. On success, a `slack_notification_posted` activity event is written to
   the ticket's activity feed.

The Slack POST is fire-and-forget — failures are logged but do not block
the ticket update response. There is no retry mechanism.

## UI <span class="badge-new">NEW</span>

The sidebar shows a **Slack Notifications** button, gated behind the
LaunchDarkly flag `slackTicketNotifications` (see
[LaunchDarkly](./launchdarkly.md#the-slackticketnotifications-flag)).
Clicking it opens the `SlackIntegrationModal`, which lets the operator:

- Enter or replace the webhook URL (write-only — the URL is never
  returned by the API).
- Set a display-only channel name (e.g. `#content`).
- Toggle which statuses trigger notifications (`In Review`, `Done`).
- Enable / disable the integration without deleting the config.
- Remove the integration entirely.

Components:

| Component | File |
|---|---|
| `SlackIntegrationButton` | `apps/web/src/components/SlackIntegrationButton.tsx` |
| `SlackIntegrationModal` | `apps/web/src/components/SlackIntegrationModal.tsx` |
| `useSlackIntegration` hook | `apps/web/src/hooks/useSlackIntegration.ts` |

## API routes <span class="badge-new">NEW</span>

See [API routes → Slack Integration](../api/routes.md#slack-integration--appsapisrcroutesslackintegrationsts)
for the full endpoint spec. In summary:

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/slack-integration` | Returns a redacted summary (no webhook URL) |
| `PUT` | `/api/slack-integration` | Upsert the singleton config |
| `DELETE` | `/api/slack-integration` | Remove the integration |

## Database <span class="badge-new">NEW</span>

Migration: `supabase/migrations/20260420215203_slack_integrations.sql`

Creates a `slack_integrations` table with a singleton constraint
(`singleton boolean NOT NULL DEFAULT true CHECK (singleton IS true)` +
unique index). Columns:

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK, auto-generated |
| `singleton` | `boolean` | Always `true`; enforces single-row |
| `webhook_url` | `text` | Slack incoming webhook URL (secret) |
| `channel_name` | `text` | Display-only label, default `''` |
| `enabled` | `boolean` | Master on/off switch |
| `enabled_statuses` | `content_status[]` | Statuses that trigger a post; default `{in_review, done}` |
| `created_at` | `timestamptz` | Auto |
| `updated_at` | `timestamptz` | Auto (trigger) |

RLS: only the `service_role` has access. The API never exposes the
`webhook_url` to authenticated clients.

The migration also extends the `activity_event_type` enum with
`slack_notification_posted`.

## Slack message format <span class="badge-new">NEW</span>

The notifier sends a Block Kit payload with:

- A **header** block: emoji + "Ticket moved to {status}" (`:white_check_mark:` for Done, `:eyes:` for In Review).
- A **section** with two fields: ticket title (deep-linked) and project name.
- An **actions** block with an "Open ticket" button linking to the ticket in the web app.

User-supplied text is escaped for Slack's mrkdwn format (`&`, `<`, `>` are
HTML-encoded).

## Env vars <span class="badge-new">NEW</span>

No new environment variables are required. The webhook URL is stored in
the database, not in `process.env`. The notifier reads `FRONTEND_URL`
(already documented on the [Env vars page](../getting-started/env-vars.md))
to build deep links in the Slack message.
