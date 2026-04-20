---
sidebar_position: 3
---

# Slack notifications <span class="badge-new">NEW</span>

Content Studio can post a message to a Slack channel whenever a ticket
moves to a configured status. The integration uses a standard
[Slack incoming webhook](https://api.slack.com/messaging/webhooks) — no
Slack app install or OAuth is required.

## How it works <span class="badge-new">NEW</span>

1. An operator opens the **Slack Integration** modal from the sidebar
   (visible only when the `slackTicketNotifications` LaunchDarkly flag is
   on — see [LaunchDarkly](./launchdarkly.md)).
2. They paste an incoming-webhook URL, enter a channel name, and choose
   which statuses trigger a notification (default: `in_review` and
   `done`).
3. The configuration is stored in the `slack_integrations` singleton table
   via [`PUT /api/slack-integration`](../api/routes.md#put-apislack-integration-).
4. When any ticket is updated and its status changes to one of the
   enabled statuses, `notifyTicketStatusChange`
   (`apps/api/src/services/slackNotifier.ts`) fires asynchronously
   (fire-and-forget).
5. The notifier loads the config from the database, builds a Block Kit
   payload with a header, ticket title, project name, and an "Open
   ticket" button linking back to the UI, then POSTs it to the webhook
   URL.
6. On success a `slack_notification_posted` activity event is recorded on
   the ticket.
7. On failure the error is logged via `pino` but the ticket PUT response
   is **not** affected.

## Configuration UI <span class="badge-new">NEW</span>

The `SlackIntegrationModal` component (`apps/web/src/components/SlackIntegrationModal.tsx`)
provides:

- **Webhook URL** — the Slack incoming-webhook URL (stored in the DB,
  never returned to the frontend).
- **Channel name** — a display label only; it does not control where
  Slack posts (that is determined by the webhook).
- **Enabled toggle** — master on/off switch.
- **Status checkboxes** — choose which statuses (`in_review`, `done`)
  trigger a notification.
- **Save** and **Remove** buttons with confirmation.

## Database <span class="badge-new">NEW</span>

Migration: `supabase/migrations/20260420215203_slack_integrations.sql`

| Column | Type | Default | Notes |
|---|---|---|---|
| `id` | `uuid` | `gen_random_uuid()` | PK |
| `singleton` | `boolean` | `true` | Unique constraint ensures one row |
| `webhook_url` | `text` | — | Required |
| `channel_name` | `text` | `''` | Display only |
| `enabled` | `boolean` | `true` | Master toggle |
| `enabled_statuses` | `content_status[]` | `{in_review,done}` | Array of statuses |
| `created_at` | `timestamptz` | `now()` | |
| `updated_at` | `timestamptz` | `now()` | Auto-bumped by trigger |

The migration also adds `slack_notification_posted` to the
`activity_event_type` enum.

## Env vars <span class="badge-new">NEW</span>

No new environment variables are needed. The webhook URL is stored in the
database, and the existing `FRONTEND_URL` variable (already documented on
the [Env vars page](../getting-started/env-vars.md)) is used to build
deep links in the Slack message.
