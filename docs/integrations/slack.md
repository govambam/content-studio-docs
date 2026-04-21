---
sidebar_position: 3
---

# Slack ticket notifications <span class="badge-new">NEW</span>

Post a Block Kit message to a Slack channel whenever a ticket's status
changes to one of the configured statuses. The integration uses a
standard Slack **incoming webhook** — no OAuth app or bot token required.

## How it works <span class="badge-new">NEW</span>

1. An operator opens the **Slack Notifications** modal from the sidebar
   (visible only when the `slackTicketNotifications` LaunchDarkly flag is
   on — see [LaunchDarkly](./launchdarkly.md#the-slack-ticket-notifications-flag-)).
2. They paste an incoming webhook URL and select which status transitions
   should trigger a post (`In Review`, `Done`, or both).
3. When a ticket is updated via `PUT /api/tickets/:id` and the status
   field changed to an enabled status, the API fires a **fire-and-forget**
   POST to the stored webhook URL.
4. On success a `slack_notification_posted` activity event is written to
   the ticket's activity feed.

Errors in the Slack POST are logged server-side but **never** block the
HTTP response to the UI.

## Database <span class="badge-new">NEW</span>

The feature adds a `slack_integrations` table
(migration `20260420215203_slack_integrations.sql`):

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK, auto-generated |
| `singleton` | `boolean` | Always `true`; unique index enforces one row |
| `webhook_url` | `text` | Slack incoming webhook URL |
| `channel_name` | `text` | Display-only label (e.g. `#content`) |
| `enabled` | `boolean` | Master on/off switch |
| `enabled_statuses` | `content_status[]` | Which status transitions trigger a post |
| `created_at` | `timestamptz` | Auto-set |
| `updated_at` | `timestamptz` | Auto-updated via trigger |

The migration also adds `slack_notification_posted` to the
`activity_event_type` enum.

## API routes <span class="badge-new">NEW</span>

See [API routes → Slack integration](../api/routes.md#slack-integration--appsapisrcroutesslackintegrationsts-) for the full endpoint reference (`GET`, `PUT`, `DELETE` on `/api/slack-integration`).

## Feature flag <span class="badge-new">NEW</span>

The sidebar button and modal are gated behind the `slackTicketNotifications`
LaunchDarkly flag. See [LaunchDarkly → slack-ticket-notifications](./launchdarkly.md#the-slack-ticket-notifications-flag-).

## UI components <span class="badge-new">NEW</span>

| Component | File | Purpose |
|---|---|---|
| `SlackIntegrationButton` | `apps/web/src/components/SlackIntegrationButton.tsx` | Sidebar button; reads the LD flag and opens the modal |
| `SlackIntegrationModal` | `apps/web/src/components/SlackIntegrationModal.tsx` | Configuration form: webhook URL, channel name, status toggles, enable/disable, remove |
| `useSlackIntegration` | `apps/web/src/hooks/useSlackIntegration.ts` | React hook wrapping `GET`, `PUT`, `DELETE` calls to `/api/slack-integration` |

## Notifier service <span class="badge-new">NEW</span>

`apps/api/src/services/slackNotifier.ts` exports `notifyTicketStatusChange()`.

- Loads the singleton integration row.
- Returns early (with a typed reason) if unconfigured, disabled, or the
  new status is not in `enabled_statuses`.
- Builds a Block Kit payload with a header, ticket link, project name,
  and an "Open ticket" button.
- POSTs to the webhook; returns `{ posted: true, channel }` on success
  or `{ posted: false, reason }` on failure.
- The function never throws — errors are caught and returned in the
  result discriminator.
