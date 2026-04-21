---
sidebar_position: 3
---

# Slack ticket notifications <span class="badge-new">NEW</span>

Content Studio can post a rich Block Kit message to a Slack channel
whenever a ticket moves to a selected status. The integration uses a
standard Slack [incoming webhook](https://api.slack.com/messaging/webhooks)
— no bot user or OAuth app required.

## How it works <span class="badge-new">NEW</span>

1. An operator opens the **Slack Notifications** modal from the sidebar
   and pastes an incoming webhook URL.
2. They choose which status transitions trigger a post (`In Review`,
   `Done`, or both).
3. When a ticket is updated via `PUT /api/tickets/:id` and the new
   status matches an enabled status, the API fires a `POST` to the
   stored webhook with a Block Kit payload.
4. The call is fire-and-forget — a failed webhook never blocks or
   errors the ticket update response.
5. On success, a `slack_notification_posted` activity event is recorded
   on the ticket so it appears in the activity feed.

## Feature flag <span class="badge-new">NEW</span>

The sidebar button that opens the configuration modal is gated behind
the `slackTicketNotifications` LaunchDarkly flag. When the flag is off
(or unresolved), the button does not render. See
[LaunchDarkly](./launchdarkly.md) for wiring details.

## Configuration modal <span class="badge-new">NEW</span>

The `SlackIntegrationModal` component lets operators:

- **Set the webhook URL** — write-only; the API never returns it in GET
  responses. To update other fields after initial setup the user must
  re-enter the URL.
- **Set a channel name** — display-only label shown in the UI (e.g.
  `#content`). Does not affect where messages are posted; the webhook
  controls that.
- **Toggle enabled statuses** — `in_review` and `done` are the only
  toggleable options.
- **Enable / disable** the integration without removing the
  configuration.
- **Remove** the integration entirely (deletes the database row).

## Database <span class="badge-new">NEW</span>

The integration config lives in a singleton `slack_integrations` table
(one row per deployment, enforced by a `CHECK` constraint and unique
index on the `singleton` column).

| Column | Type | Default | Notes |
|---|---|---|---|
| `id` | `uuid` | `gen_random_uuid()` | PK |
| `singleton` | `boolean` | `true` | Always `true`; unique index enforces one row |
| `webhook_url` | `text` | — | Required; never returned to the frontend |
| `channel_name` | `text` | `''` | Display-only label |
| `enabled` | `boolean` | `true` | Master on/off switch |
| `enabled_statuses` | `content_status[]` | `{in_review,done}` | Which transitions trigger a post |
| `created_at` | `timestamptz` | `now()` | — |
| `updated_at` | `timestamptz` | `now()` | Auto-updated by trigger |

## API routes <span class="badge-new">NEW</span>

See [API routes → Slack integration](../api/routes.md#slack-integration--appsapisrcroutesslackintegrationsts)
for the full endpoint reference.

## Notification payload <span class="badge-new">NEW</span>

The posted message includes:

- A header with an emoji (✅ for `done`, 👀 for `in_review`) and the
  new status label.
- A section with the ticket title (linked to the frontend) and the
  project name.
- An **Open ticket** button linking back to the ticket in Content
  Studio.

User-supplied text is escaped for Slack mrkdwn (`&`, `<`, `>` are
HTML-encoded; `|` is replaced with a fullwidth equivalent in link
labels).
