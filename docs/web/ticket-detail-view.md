---
sidebar_position: 2
---

# Ticket detail view <span class="badge-new">NEW</span>

The ticket detail view provides a full-page interface for viewing and
editing a single ticket. It is rendered by
`apps/web/src/views/TicketDetailView.tsx` and routed at
`/projects/:projectId/tickets/:ticketId`.

## Features

### Breadcrumbs

A breadcrumb trail at the top of the page shows the navigation path:
**Home → Project Title → Ticket Title**. Each segment links back to its
respective view.

### Editable title

The ticket title is displayed as inline-editable text. Click to edit,
then blur or press Enter to save. Changes are persisted via
`PUT /api/tickets/:id` and emit a `title_changed` activity event when the
value differs from the previous.

### Editable description

The description uses the [MarkdownEditor](./markdown.md) component for
rich-text authoring with GitHub Flavored Markdown (GFM). The editor
autosaves after a short debounce and on blur. Changes emit a
`description_changed` activity event when the description actually
changed.

### Status dropdown

A dropdown allows changing the ticket status between `backlog`,
`in_progress`, `in_review`, and `done`. Selecting a new status calls
`PUT /api/tickets/:id` and emits a `status_changed` activity event with
`from` and `to` values in the event payload.

### Delete action

A delete button removes the ticket via `DELETE /api/tickets/:id`. This
cascades to assets, comments, and activity events. After deletion, the
user is navigated back to the project view.

### Metadata

The view displays read-only metadata including:

- **Created at** — timestamp when the ticket was created
- **Updated at** — timestamp of the last modification

### Placeholder sections

The view includes placeholder sections for **Assets** and **Activity**
that will be populated in future iterations.

## Data fetching — `useTicket` hook <span class="badge-new">NEW</span>

The `apps/web/src/hooks/useTicket.ts` hook encapsulates all ticket detail
data operations:

| Operation    | API call               | Description                          |
|--------------|------------------------|--------------------------------------|
| **fetch**    | `GET /tickets/:id`     | Load the ticket on mount             |
| **update**   | `PUT /tickets/:id`     | Persist title/description/status     |
| **delete**   | `DELETE /tickets/:id`  | Remove the ticket                    |

### Realtime updates

The hook subscribes to Supabase Realtime on the `tickets` table, filtered
to the current ticket's `id`. When an update arrives:

1. The payload's `updated_by_client` is compared to the local `CLIENT_ID`.
2. If they match, the update is ignored (self-originating).
3. Otherwise, the local state is replaced with the incoming row.

This enables collaborative editing where changes from other users appear
in real time without overwriting the current user's pending edits.

## Activity events

Edits made through the ticket detail view generate activity events that
appear in the ticket's activity feed:

| Event type            | Trigger                                   | Payload                   |
|-----------------------|-------------------------------------------|---------------------------|
| `title_changed`       | Title edited and differs from previous    | `{ from, to }`            |
| `description_changed` | Description edited and differs            | (no diff payload)         |
| `status_changed`      | Status dropdown selection changed         | `{ from, to }`            |

`sort_order` changes (from drag-and-drop reordering) are intentionally
**not** recorded to avoid flooding the activity feed.
