---
sidebar_position: 3
---

# Slack ticket notifications <span class="badge-new">NEW</span>

When a ticket's status changes, the API can post a rich Block Kit message
to a Slack channel via an incoming webhook. The feature is gated behind
the `slackTicketNotifications` LaunchDarkly flag on the web side.

## How it works <span class="badge-new">NEW</span>

1. An operator enables the `slack-ticket-notifications` flag in
   LaunchDarkly. A **Slack Notifications** button appears in the sidebar.
2. The operator clicks it, pastes a Slack incoming-webhook URL, picks
   which statuses should trigger posts (`in_review` and/or `done`), and
   saves.
3. The config is stored in the `slack_integrations` singleton table. The
   webhook URL is write-only — the API never returns it to the client.
4. When any user updates a ticket's status via `PUT /api/tickets/:id`,
   the handler fires a background (fire-and-forget) call to
   `notifyTicketStatusChange()` in
   `apps/api/src/services/slackNotifier.ts`.
5. The notifier loads the integration row, checks if the new status is in
   the `enabled_statuses` allowlist, builds a Block Kit payload, and
   `POST`s it to the webhook URL.
6. On success, a `slack_notification_posted` activity event is written to
   the ticket's activity feed.

## Block Kit message <span class="badge-new">NEW</span>

The posted message contains:

- A **header** block with an emoji (`:white_check_mark:` for done,
  `:eyes:` for in_review) and the new status label.
- A **section** with two fields: ticket title (deeplinked) and project
  title.
- An **actions** block with an "Open ticket" button linking to the
  ticket in the web UI.

A plain-text `text` fallback is included for Slack clients that don't
render blocks (e.g. notifications).

User-supplied text is escaped for Slack mrkdwn (`&`, `<`, `>`) before
interpolation.

## Error handling <span class="badge-new">NEW</span>

- Webhook failures (non-2xx responses or network errors) are **logged
  but swallowed** — they never block or error the ticket update request.
- No retry mechanism exists. A failed post is lost.
- The `slack_notification_posted` activity event is only written when the
  Slack POST returns a 2xx.

## Database <span class="badge-new">NEW</span>

Migration: `supabase/migrations/20260420215203_slack_integrations.sql`

```sql
create table slack_integrations (
  id              uuid primary key default gen_random_uuid(),
  singleton       boolean not null default true check (singleton is true),
  webhook_url     text not null,
  channel_name    text not null default '',
  enabled         boolean not null default true,
  enabled_statuses content_status[] not null
                    default array['in_review','done']::content_status[],
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
```

The `singleton` column with a unique index and `CHECK (singleton IS TRUE)`
enforces a single-row table at the database level.

RLS: only the `service_role` has access. The `authenticated` role has no
policies — all access goes through the API.

The migration also extends the `activity_event_type` enum:

```sql
alter type activity_event_type add value if not exists 'slack_notification_posted';
```

## UI components <span class="badge-new">NEW</span>

| Component | File | Purpose |
|---|---|---|
| `SlackIntegrationButton` | `apps/web/src/components/SlackIntegrationButton.tsx` | Sidebar button gated by `slackTicketNotifications` flag |
| `SlackIntegrationModal` | `apps/web/src/components/SlackIntegrationModal.tsx` | Configuration form: webhook URL, channel name, status toggles, enable/disable |
| `useSlackIntegration` | `apps/web/src/hooks/useSlackIntegration.ts` | React hook wrapping GET/PUT/DELETE calls to `/api/slack-integration` |

## Related

- [API routes → Slack Integration](../api/routes.md#slack-integration--appsapisrcroutesslackintegrationsts-)
- [LaunchDarkly → `slack-ticket-notifications` flag](./launchdarkly.md#the-slack-ticket-notifications-flag-)
