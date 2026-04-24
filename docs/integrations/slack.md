---
sidebar_position: 3
---

# Slack ticket notifications <span class="badge-new">NEW</span>

Content Studio can post a Block Kit message to a Slack channel whenever a
ticket's status changes to a configured value. This lets teams track
content progress without leaving Slack.

## How it works <span class="badge-new">NEW</span>

1. An operator configures a Slack Incoming Webhook URL, an optional
   channel name, and a list of statuses that should trigger posts (e.g.
   `in_review`, `done`) via the sidebar modal or the
   `PUT /api/slack-integration` endpoint.
2. When a ticket is updated through `PUT /api/tickets/:id` and its
   `status` field changes, `tickets.ts` fires a background (fire-and-forget)
   call to `slackNotifier.ts`.
3. `slackNotifier.ts` loads the singleton integration row, checks whether
   the integration is enabled and the new status is in the allowlist, then
   `POST`s a Block Kit payload to the webhook URL.
4. On success, a `slack_notification_posted` activity event is recorded
   against the ticket, visible in the ticket's activity feed.

If the Slack POST fails, the error is logged but **not** retried — there
is no retry mechanism today.

## UI setup <span class="badge-new">NEW</span>

The integration is configured through the **Slack Notifications** button
in the sidebar, which opens `SlackIntegrationModal`. This button is gated
by the `slackTicketNotifications` LaunchDarkly flag — when the flag is
off, the button does not render.

The modal allows the operator to:

- Enter a Slack Incoming Webhook URL
- Optionally set a channel name (display-only label)
- Choose which statuses trigger notifications (`in_review`, `done`)
- Enable or disable the integration without removing the configuration

## Slack message format <span class="badge-new">NEW</span>

Messages are posted as Slack Block Kit payloads containing:

- A **header** block with a status emoji (`:white_check_mark:` for done,
  `:eyes:` for in_review) and the text "Ticket moved to {status}"
- A **section** block with two fields: a deep-link to the ticket and the
  project name
- An **actions** block with a primary "Open ticket" button linking to the
  ticket in Content Studio

The deep-link URL is built from the `FRONTEND_URL` env var (defaults to
`http://localhost:5173`).

## Database <span class="badge-new">NEW</span>

The feature adds a `slack_integrations` table enforced as a singleton row
via a `CHECK (singleton IS TRUE)` constraint and a unique index on
`singleton`.

```sql
slack_integrations (
  id              uuid PRIMARY KEY,
  singleton       boolean NOT NULL DEFAULT true CHECK (singleton IS TRUE),
  webhook_url     text NOT NULL,
  channel_name    text NOT NULL DEFAULT '',
  enabled         boolean NOT NULL DEFAULT true,
  enabled_statuses content_status[] NOT NULL DEFAULT '{in_review,done}',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
)
```

A new `activity_event_type` enum value `slack_notification_posted` is also
added by the migration.

## Env vars <span class="badge-new">NEW</span>

| Var | Required? | Purpose |
|---|---|---|
| `FRONTEND_URL` | optional (defaults to `http://localhost:5173`) | Base URL used to build deep-links in Slack messages. Also used for CORS. |

See the full list on the [Env vars page](../getting-started/env-vars.md).

## Feature flag <span class="badge-new">NEW</span>

| Property | Value |
|---|---|
| LD key | `slack-ticket-notifications` |
| Key in code | `slackTicketNotifications` |
| Type | Boolean |
| Controls | Visibility of the sidebar Slack Notifications button |

See [LaunchDarkly](./launchdarkly.md#the-slack-ticket-notifications-flag)
for wiring details.
