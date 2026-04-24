---
sidebar_position: 3
---

# Slack ticket notifications <span class="badge-new">NEW</span>

Content Studio can post a rich message to a Slack channel whenever a
ticket's status changes to a selected status. The integration uses a
standard [Slack incoming webhook](https://api.slack.com/messaging/webhooks)
— no Slack app install is required.

## How it works

1. An operator configures a Slack incoming-webhook URL, a display channel
   name, and which statuses trigger a post (default: **In Review** and
   **Done**) via the **Slack Notifications** modal in the sidebar.
2. When a ticket is updated through `PUT /api/tickets/:id` and the new
   status is in the enabled list, the API fires an async
   (fire-and-forget) POST to the webhook.
3. The Slack message uses Block Kit and contains a header, ticket and
   project fields, and an **Open ticket** button that deep-links back
   into the app.
4. On success the API writes a `slack_notification_posted` activity event
   so the ticket's activity feed shows when a notification went out.

Failures are logged server-side but are **not** surfaced to the user or
included in the ticket-update response.

## UI setup <span class="badge-new">NEW</span>

The sidebar shows a **Slack Notifications** button when the
`slackTicketNotifications` LaunchDarkly flag is enabled (see
[LaunchDarkly](./launchdarkly.md#the-slack-ticket-notifications-flag)).
Clicking it opens the `SlackIntegrationModal` where you can configure:

| Field | Description |
|---|---|
| **Webhook URL** | The Slack incoming-webhook URL. Write-only — it is stored on the server and never displayed back. Must be re-entered on every save. |
| **Channel** | Display-only label (e.g. `#content`). Does not control where messages are posted — that is determined by the webhook itself. |
| **Notify on** | Checkboxes for **In Review** and **Done**. At least one must be selected. |
| **Integration enabled** | Master toggle. When off, no notifications are posted even if the webhook is configured. |

## API routes <span class="badge-new">NEW</span>

Full endpoint spec on the [API routes](../api/routes.md#slack-integration--appsapisrcroutesslackintegrationsts) page.

## Database <span class="badge-new">NEW</span>

Migration `20260420215203_slack_integrations.sql` creates:

- **`slack_integrations`** table — singleton (one row per deployment)
  enforced by a `CHECK (singleton IS TRUE)` constraint and a unique
  index. Columns: `webhook_url`, `channel_name`, `enabled`,
  `enabled_statuses` (`content_status[]`), timestamps.
- Row-level security is enabled. Only the **service role** has access;
  authenticated JWTs cannot read or write this table directly.
- The `activity_event_type` enum is extended with
  `slack_notification_posted`.

## Env vars it reads <span class="badge-new">NEW</span>

| Var | Purpose |
|---|---|
| `FRONTEND_URL` | Used by `slackNotifier.ts` to build deep-link URLs in the Slack message. Defaults to `http://localhost:5173`. |

Full list on the [Env vars page](../getting-started/env-vars.md).
