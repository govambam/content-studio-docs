---
sidebar_position: 3
---

# Slack ticket notifications <span class="badge-new">NEW</span>

Content Studio can post a Slack message whenever a ticket moves to a
configured status. Messages are sent as Block Kit payloads to a Slack
Incoming Webhook that you provide.

## How it works <span class="badge-new">NEW</span>

1. A user updates a ticket's status via `PUT /api/tickets/:id`.
2. If the new status is in the integration's `enabled_statuses` list and the
   integration is enabled, the API fires an asynchronous call to
   `notifyTicketStatusChange()` in `apps/api/src/services/slackNotifier.ts`.
3. The notifier posts a Block Kit message to the stored webhook URL.
4. On success, a `slack_notification_posted` activity event is written to the
   ticket's activity feed.

The Slack post is fire-and-forget — it does **not** block the `PUT` response.
If the webhook call fails, the failure is logged but the ticket update still
succeeds.

## Database <span class="badge-new">NEW</span>

The integration configuration lives in the `slack_integrations` table, which
uses a singleton pattern enforced by a `CHECK (singleton IS TRUE)` constraint
and a unique index. There is at most one row.

Migration: `supabase/migrations/20260420215203_slack_integrations.sql`.

### Columns

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK, default `gen_random_uuid()` |
| `webhook_url` | text | Slack Incoming Webhook URL. Never exposed to the browser — API responses return `SlackIntegrationSummary` instead. |
| `channel_name` | text | Display name of the target channel (e.g. `#content-updates`). |
| `enabled` | boolean | Master on/off switch. |
| `enabled_statuses` | text[] | Array of `ContentStatus` values (`in_review`, `done`, etc.) that trigger a notification. |
| `singleton` | boolean | Always `true`; enforces one-row-max. |
| `created_at` / `updated_at` | timestamptz | Auto-managed. |

### RLS

- **Authenticated** users have write-only access (insert/update/delete but
  not select) — the webhook URL is sensitive.
- **`service_role`** has full access — the API reads the row server-side to
  decide whether to post.

## UI <span class="badge-new">NEW</span>

A **Slack** button in the sidebar opens the Slack integration modal. The
button is gated behind the LaunchDarkly `slackTicketNotifications` flag —
see [LaunchDarkly](./launchdarkly.md#the-slack-ticket-notifications-flag).

The modal (`apps/web/src/components/SlackIntegrationModal.tsx`) lets you:

- Enter or update the webhook URL (write-only — a configured URL shows a
  placeholder instead of the stored value).
- Set the channel name.
- Toggle which statuses trigger a notification (currently `in_review` and
  `done`).
- Enable or disable the integration.
- Remove the integration entirely (with confirmation).

The hook `apps/web/src/hooks/useSlackIntegration.ts` wraps the three API
endpoints and exposes `summary`, `save`, `remove`, and `refresh`.

## Activity feed <span class="badge-new">NEW</span>

When a Slack notification is successfully posted, a `slack_notification_posted`
activity event is recorded on the ticket. The `ActivityFeed` component
(`apps/web/src/components/ActivityFeed.tsx`) renders this event showing:

- The Slack channel the message was sent to.
- The status that triggered the notification.

## API routes <span class="badge-new">NEW</span>

See the [API routes reference](../api/routes.md#slack-integration--appsapisrcroutesslackintegrationsts) for
`GET /api/slack-integration`, `PUT /api/slack-integration`, and
`DELETE /api/slack-integration`.

## Shared types <span class="badge-new">NEW</span>

Defined in `packages/shared/src/index.ts`:

```ts
interface SlackIntegration {
  id: string;
  webhook_url: string;
  channel_name: string;
  enabled: boolean;
  enabled_statuses: ContentStatus[];
  created_at: string;
  updated_at: string;
}

interface SlackIntegrationSummary {
  configured: boolean;
  channel_name: string;
  enabled: boolean;
  enabled_statuses: ContentStatus[];
  updated_at: string | null;
}
```

`SlackIntegrationSummary` is what the API returns to the browser — it omits
`webhook_url` so the secret never leaves the server.
