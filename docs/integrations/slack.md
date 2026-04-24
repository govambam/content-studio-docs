---
sidebar_position: 3
---

# Slack ticket notifications <span class="badge-new">NEW</span>

Content Studio can post a message to a Slack channel whenever a ticket's
status changes. The feature is gated behind a LaunchDarkly flag and
configured entirely from the sidebar UI.

## How it works <span class="badge-new">NEW</span>

1. An operator opens the **Slack Integration** modal from the sidebar
   (visible only when the `slackTicketNotifications` LaunchDarkly flag is
   on) and saves a Slack Incoming Webhook URL, a channel name, and the
   set of statuses that should trigger a notification (e.g. `in_review`,
   `done`).
2. When a ticket is moved to one of the enabled statuses via
   `PUT /api/tickets/:id`, the API fires a background call to the
   `notifyTicketStatusChange` function in
   `apps/api/src/services/slackNotifier.ts`.
3. `slackNotifier` loads the singleton row from the `slack_integrations`
   table, checks that the integration is enabled and that the new status
   is in the allowlist, then POSTs a Block Kit message to the configured
   webhook URL.
4. On success, the tickets route records a `slack_notification_posted`
   activity event on the ticket.

## Block Kit message <span class="badge-new">NEW</span>

The Slack message contains:

- A **header** block with a status emoji (`:white_check_mark:` for
  `done`, `:eyes:` for everything else) and the status label.
- A **section** with two fields: the ticket title (deep-linked to the
  ticket in Content Studio) and the project name.
- An **action** button labelled "Open ticket" linking to the ticket.

User-supplied text (ticket title, project name) is escaped for Slack
mrkdwn (`&`, `<`, `>` are HTML-entity-encoded, and pipe `|` is replaced
with the full-width variant to avoid breaking link syntax).

## Configuration endpoints <span class="badge-new">NEW</span>

See [API routes → Slack Integration](../api/routes.md#slack-integration--appsapisrcroutesslackintegrationsts)
for the full `GET`/`PUT`/`DELETE` spec on `/api/slack-integration`.

The webhook URL is treated as a bearer credential and is **write-only** —
the `GET` endpoint returns a `SlackIntegrationSummary` that omits it.

## LaunchDarkly flag <span class="badge-new">NEW</span>

The sidebar UI components (`SlackIntegrationButton` and
`SlackIntegrationModal`) are gated by the `slackTicketNotifications`
LaunchDarkly flag. When the flag is off, the button does not render.

See [LaunchDarkly](./launchdarkly.md) for the full flag reference.

## Error handling <span class="badge-new">NEW</span>

Slack POST failures are caught, logged via pino
(`slack_webhook_post_failed` or `slack_webhook_post_threw`), and
swallowed — they do **not** fail the ticket update request. There is no
retry mechanism; if the webhook POST fails, the notification is lost.

## Env vars <span class="badge-new">NEW</span>

| Var | Required? | Purpose |
|---|---|---|
| `FRONTEND_URL` | optional (defaults to `http://localhost:5173`) | Used by `slackNotifier.ts` to build the deep-link URL in the Slack message. Already documented — see [Env vars](../getting-started/env-vars.md). |

No additional env vars are required. The Slack webhook URL is stored in
the database, not in environment variables.
