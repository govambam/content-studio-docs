---
sidebar_position: 3
---

# Slack notifications <span class="badge-new">NEW</span>

Content Studio can post to a Slack channel when a ticket transitions to a
configured status. The integration uses Slack Incoming Webhooks. The feature
is gated behind the `slackTicketNotifications` LaunchDarkly flag.

## How it works <span class="badge-new">NEW</span>

1. A user configures an Incoming Webhook URL, optional channel display name,
   and which statuses trigger a notification (default: `in_review` and `done`)
   via the Settings modal in the sidebar.
2. The configuration is stored in a singleton `slack_integrations` table.
3. When a ticket's status is updated via `PUT /api/tickets/:id` and the new
   status is in `enabled_statuses`, the API fires a Block Kit message to the
   configured webhook URL.
4. On success, a `slack_notification_posted` activity event is written and
   appears in the ticket's activity feed.
5. The notification is fire-and-forget — a slow or failed Slack call never
   blocks the ticket update response.

## Database <span class="badge-new">NEW</span>

The `slack_integrations` table uses a singleton pattern enforced by a unique
index. Columns:

| Column | Description |
|--------|-------------|
| `webhook_url` | The Slack Incoming Webhook URL |
| `channel_name` | Optional display name for the channel |
| `enabled` | Global toggle for the integration |
| `enabled_statuses` | Array of statuses that trigger notifications |
| `created_at` | Timestamp when the row was created |
| `updated_at` | Timestamp when the row was last updated |

A new `slack_notification_posted` value was added to the `activity_event_type`
enum.

Migration file: `supabase/migrations/20260420215203_slack_integrations.sql`.

## Security <span class="badge-new">NEW</span>

The webhook URL is write-only. `GET /api/slack-integration` returns a
`SlackIntegrationSummary` with the webhook URL redacted so the credential
never reaches the browser. `PUT` accepts the full URL for upsert. `DELETE`
clears the row.

## Frontend <span class="badge-new">NEW</span>

Three new frontend pieces power the integration:

### `SlackIntegrationButton`

`apps/web/src/components/SlackIntegrationButton.tsx`

Renders in the sidebar only when the `slackTicketNotifications` LaunchDarkly
flag is truthy. Clicking opens the modal.

### `SlackIntegrationModal`

`apps/web/src/components/SlackIntegrationModal.tsx`

Form with webhook URL field, optional channel name, global enabled toggle,
per-status toggles for `in_review` and `done`. Save is disabled when
first-time setup has no webhook or no statuses selected.

### `useSlackIntegration` hook

`apps/web/src/hooks/useSlackIntegration.ts`

Provides `summary`, `save`, `remove`, `refresh`, `loading`, and `error`.

## Activity feed <span class="badge-new">NEW</span>

The `ActivityFeed` component now renders a "Posted to Slack" entry for
`slack_notification_posted` events, showing the channel and status.
