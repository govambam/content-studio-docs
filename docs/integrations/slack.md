---
sidebar_position: 3
---

# Slack ticket notifications <span class="badge-new">NEW</span>

Content Studio can post a notification to a Slack channel whenever a ticket's status changes to one of the enabled statuses. Notifications are delivered via a Slack Incoming Webhook and are fired asynchronously (fire-and-forget) from the ticket PUT handler — errors are logged but never block the HTTP response.

## How it works <span class="badge-new">NEW</span>

1. An operator configures the integration through the **Slack Notifications** modal in the sidebar (gated behind the `slackTicketNotifications` LaunchDarkly flag).
2. The modal accepts: a Slack Incoming Webhook URL, a channel label (display only), and toggles for which statuses trigger a post (`in_review` and `done` are available).
3. Configuration is persisted in the `slack_integrations` singleton table via the `/api/slack-integration` CRUD routes.
4. When a ticket's status is updated (PUT `/api/tickets/:id`) and the new status matches an enabled status, `notifyTicketStatusChange` in `apps/api/src/services/slackNotifier.ts` posts a Block Kit message to the configured webhook. The message includes the ticket title and a deep link built from the `FRONTEND_URL` env var.
5. On success, a `slack_notification_posted` activity event is recorded and appears in the ticket's activity feed.

## Configuration <span class="badge-new">NEW</span>

| Setting | Description |
|---|---|
| Webhook URL | Slack Incoming Webhook URL (stored; redacted in GET responses) |
| Channel | Display label for the target channel (not used for routing) |
| Enabled statuses | Which status transitions trigger a post (`in_review`, `done`) |

## LaunchDarkly gate <span class="badge-new">NEW</span>

| Property | Value |
|---|---|
| LD key | `slack-ticket-notifications` |
| Key in code (camelCase) | `slackTicketNotifications` |
| Type | Boolean |
| Default when unresolved | `false` |
| Controls | Whether the "Slack Notifications" button renders in the sidebar |

## Relevant API routes <span class="badge-new">NEW</span>

See [API routes → Slack Integration](../api/routes.md#slack-integration--appsapisrcroutesslackintegrationsts) for the full endpoint spec.

- `GET /api/slack-integration`
- `PUT /api/slack-integration`
- `DELETE /api/slack-integration`

## Env vars <span class="badge-new">NEW</span>

`FRONTEND_URL` is used as the deep-link base URL in Slack messages (defaults to `http://localhost:5173`).

See the full [Env vars page](../getting-started/env-vars.md).
