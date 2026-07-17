---
sidebar_position: 1
---

# Home board <span class="badge-new">NEW</span>

The **Home board** is the Kanban view of every project, grouped by
`ContentStatus` column. Alongside opening a single project, the board
supports **multi-select + bulk actions** so the content team can triage
many projects at once. Everything below is client-side in the web app —
there is no bulk API endpoint (see
[No bulk endpoint](#no-bulk-endpoint)).

## Selecting project cards — `apps/web/src/components/ProjectCard.tsx` <span class="badge-new">NEW</span>

Each project card carries a checkbox in its top-left corner:

- It is **hidden by default** and fades in when you hover the card, when
  the card is selected, or when a keyboard user tabs onto it (the
  `cs-select-checkbox` class in `apps/web/src/styles/global.css` controls
  the hover/focus visibility).
- Clicking the checkbox **toggles selection without navigating** into the
  project — the click is stopped from bubbling to the card body. Clicking
  anywhere else on the card still opens the project as before.
- Selected cards get a stronger border (`--rule-strong`) and a tinted
  background (`--bg-secondary`).

Selection is tracked in `HomeView` as a `Set<string>` of project ids.

## Bulk actions bar — `apps/web/src/components/BulkActionsBar.tsx` <span class="badge-new">NEW</span>

Whenever **one or more** cards are selected, a banner spans the top of the
board. It shows an `N selected` count and exposes three bulk operations
plus a clear (✕) button. Each operation loops over the existing per-project
mutations in `DataContext` and only clears the selection once **every**
project has updated successfully — if any mutation returns an `{ error }`,
the selection is kept so you can retry.

### Change status <span class="badge-new">NEW</span>

Opens a dropdown of the `CONTENT_STATUSES` columns and moves every selected
project into the chosen column (one `updateProject(id, { status })` call per
project).

### Apply label <span class="badge-new">NEW</span>

Opens a dropdown of the workspace's labels and applies the chosen label to
every selected project.

> **Behavioral note:** applying a label **replaces** all existing labels on
> each selected project with the single chosen label
> (`updateProject(id, { labelIds: [labelId] })`). It is not additive.

### Delete <span class="badge-new">NEW</span>

Deletes every selected project after a confirmation prompt. The confirm
warns that all tickets, assets, comments, and activity will be removed. On
confirm, one `deleteProject(id)` call is made per project.

## Clearing the selection <span class="badge-new">NEW</span>

The selection clears when you:

- press **`Esc`**,
- click the **✕** button in the bulk actions bar, or
- complete a bulk operation in which every project updated successfully.

The selection is also **pruned automatically** when the projects list
changes — ids that no longer exist (after a bulk delete or a Supabase
Realtime removal) are dropped so the `N selected` count never counts
ghosts.

## No bulk endpoint <span class="badge-new">NEW</span>

Bulk actions are implemented entirely in the web app. They fan out over the
existing per-project mutations (`updateProject` / `deleteProject`) with
`Promise.all`, the same way drag-reorder already issues multiple
`updateProject` calls. There is **no** new API route, schema, or migration
for this feature.

## Analytics events <span class="badge-new">NEW</span>

Each bulk operation fires a `track()` event
(`apps/web/src/lib/analytics.ts`):

| Event | Props | Fired when |
|-------|-------|------------|
| `projects_bulk_status_changed` | `count`, `to` | A bulk **Change status** runs |
| `projects_bulk_label_applied` | `count`, `label_id` | A bulk **Apply label** runs |
| `projects_bulk_deleted` | `count` | A bulk **Delete** is confirmed |
