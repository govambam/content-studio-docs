---
sidebar_position: 3
---

# Slack notifications <span class="badge-new">NEW</span>

Content Studio can post a message to a Slack channel whenever a ticket
moves to a configured status (e.g. `in_review` or `done`). The message
uses Slack Block Kit and includes a deep-link button back to the ticket.

## How it works <span class="badge-new">NEW</span>

1. An operator opens the **Slack Notifications** modal from the sidebar
   (visible only when the `slackTicketNotifications` LaunchDarkly flag is
   on).
2. They paste a Slack **Incoming Webhook URL**, optionally set a channel
   display name, pick which statuses should trigger a notification, and
   enable the integration.
3. When any ticket's status is changed (via `PUT /api/tickets/:id`) to
   one of the enabled statuses, the API fires a **fire-and-forget** POST
   to the configured webhook with a Block Kit message.
4. On success a `slack_notification_posted` activity event is recorded on
   the ticket. On failure the error is logged but does **not** affect the
   HTTP response to the client.

## Configuration UI <span class="badge-new">NEW</span>

| Component | File |
|---|---|
| Sidebar button | `apps/web/src/components/SlackIntegrationButton.tsx` |
| Settings modal | `apps/web/src/components/SlackIntegrationModal.tsx` |
| Data hook | `apps/web/src/hooks/useSlackIntegration.ts` |

The modal lets you:

- Paste / update the Incoming Webhook URL (write-only — the saved URL is
  never displayed back).
- Set a channel display name for reference.
- Toggle the integration on or off.
- Choose which statuses trigger a notification (`in_review`, `done`).
- Remove the integration entirely.

## Backend service <span class="badge-new">NEW</span>

`apps/api/src/services/slackNotifier.ts` exports
`notifyTicketStatusChange()`, which builds a Block Kit payload containing
the ticket title, new status, project name, and a button linking to
`FRONTEND_URL` + the ticket path. The call is intentionally async and
non-blocking — errors are caught and logged via pino so they never
surface to the user.

## Database <span class="badge-new">NEW</span>

The `slack_integrations` table is a **singleton** (one row per workspace).
Migration: `supabase/migrations/20260420215203_slack_integrations.sql`.

## API routes <span class="badge-new">NEW</span>

See [API routes → Slack integration](../api/routes.md#slack-integration--appsapisrcroutesslackintegrationsts).

## Feature flag <span class="badge-new">NEW</span>

The sidebar entry point is gated behind the `slackTicketNotifications`
LaunchDarkly flag. See [LaunchDarkly → slack-ticket-notifications](./launchdarkly.md#the-slack-ticket-notifications-flag).

## Env vars <span class="badge-new">NEW</span>

| Var | Purpose |
|---|---|
| `FRONTEND_URL` | Base URL for the deep-link button in Slack messages. Defaults to `http://localhost:5173`. |

Full list on the [Env vars page](../getting-started/env-vars.md).
