---
sidebar_position: 1
---

# Home board <span class="badge-new">NEW</span>

The Home board is the landing view of Content Studio. It shows every project
as a card, grouped into the four pipeline columns (`backlog`, `in_progress`,
`in_review`, `done`). Clicking a card body opens that project; the board also
supports filtering by label and — as of the multi-select release — operating
on several projects at once.

## Multi-select <span class="badge-new">NEW</span>

Each project card carries a checkbox in its top-left corner. The checkbox
fades in when you hover the card and stays visible while the card is
selected.

- **Toggle a card** — click its checkbox. This selects the project without
  navigating into it; clicking the card body still opens the project as
  before.
- **Selected styling** — selected cards render with a stronger outline and a
  tinted background so the current selection is easy to see at a glance.
- **Clear the selection** — press `Esc`, or click the `✕` button in the bulk
  actions bar.

Selected ids are pruned automatically when a project disappears (for example
after a bulk delete or a realtime removal), so the selection count never
counts projects that no longer exist.

## Bulk actions <span class="badge-new">NEW</span>

Whenever one or more cards are selected, a bulk actions bar appears across the
top of the board. It shows the number of selected projects and offers three
operations that apply to the entire selection.

### Change status <span class="badge-new">NEW</span>

Opens a dropdown of the pipeline columns. Choosing one moves every selected
project into that column.

### Apply label <span class="badge-new">NEW</span>

Opens a dropdown of the workspace's labels. Choosing one applies that label to
every selected project. If no labels exist yet, the dropdown shows a
"No labels yet" hint.

### Delete <span class="badge-new">NEW</span>

Removes every selected project after a confirmation prompt. Deleting a project
also removes all of its tickets, assets, comments, and activity. This action
cannot be undone.

## How it works <span class="badge-new">NEW</span>

Bulk actions are a client-side convenience — there is **no bulk API
endpoint**. The web app loops over the existing per-project mutations
(`updateProject` / `deleteProject`) and fans out one request per selected
project, the same way drag-reorder already issues per-project updates. As a
result, no API route, environment variable, feature flag, or schema migration
was added for this feature.
