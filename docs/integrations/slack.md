---
sidebar_position: 3
---

# Slack ticket notifications <span class="badge-new">NEW</span>

Content Studio can post a rich Block Kit message to a Slack channel
whenever a ticket moves to a configured status. The integration is
per-deployment (single-row config) and is gated behind the
`slackTicketNotifications` LaunchDarkly flag.

## How it works

1. An operator opens the **Slack Notifications** modal from the sidebar
   and saves an [incoming webhook URL](https://api.slack.com/messaging/webhooks),
   a display channel name, and the statuses that should trigger a post.
2. When a ticket's status changes (`PUT /api/tickets/:id`), the API
   checks the `slack_integrations` row. If the integration is enabled
   and the new status is in the allowlist, a background call to the
   `slackNotifier` service POSTs a Block Kit message to the webhook.
3. On success, a `slack_notification_posted` activity event is written
   to the ticket's activity feed.

The Slack POST is fire-and-forget — failures are logged but do not block
the ticket update response. There is no retry mechanism.

## Feature flag

The sidebar button and modal are gated by the `slackTicketNotifications`
LaunchDarkly flag. When the flag is off, `<SlackIntegrationButton>`
returns `null` and the UI shows no Slack entry point.

| Property | Value |
|---|---|
| LD key | `slack-ticket-notifications` |
| Key in code (camelCase) | `slackTicketNotifications` |
| Type | Boolean |
| Default when unresolved | `false` |
| Controls | Whether `<SlackIntegrationButton>` renders in the sidebar |

See [LaunchDarkly](./launchdarkly.md) for the SDK wiring.

## Database

The `slack_integrations` table is a singleton (one row per deployment),
enforced by a `singleton boolean NOT NULL DEFAULT true CHECK (singleton IS true)`
column with a unique index. Migration:
`supabase/migrations/20260420215203_slack_integrations.sql`.

Columns:

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK, auto-generated |
| `singleton` | `boolean` | Always `true`; unique index enforces one row |
| `webhook_url` | `text` | Slack incoming webhook URL. Write-only — the API never returns it to the client |
| `channel_name` | `text` | Display-only label (e.g. `#content`) |
| `enabled` | `boolean` | Master on/off toggle |
| `enabled_statuses` | `content_status[]` | Which status transitions trigger a post (default: `{in_review, done}`) |
| `created_at` | `timestamptz` | Auto-set |
| `updated_at` | `timestamptz` | Auto-updated via trigger |

RLS: no policies for `authenticated`; all access goes through the
service role via the API. The webhook URL is a bearer credential and
never leaves the server.

## API routes

See [API routes → Slack integration](../api/routes.md#slack-integration--appsapisrcroutesslackintegrationsts)
for the full endpoint spec.

## Web components

- `SlackIntegrationButton` — sidebar button, gated by the feature flag.
- `SlackIntegrationModal` — settings form (webhook URL, channel name,
  enabled toggle, status checkboxes).
- `useSlackIntegration` hook — fetches/saves/removes the integration
  config via the API.

## Activity feed

When a Slack post succeeds, the activity feed shows a
`slack_notification_posted` event with the channel name and new status
in its metadata.
