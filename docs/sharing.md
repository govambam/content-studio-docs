---
sidebar_position: 2
slug: /sharing
---

# Sharing Guide <span class="badge-new">NEW</span>

This page describes how to share your Content Studio projects and
collaborate with teammates.

## Accessing the Sharing Guide <span class="badge-new">NEW</span>

The Content Studio app sidebar footer includes a **Sharing Guide** link
alongside **Docs** and **Invite Teammate**. Clicking it opens this
documentation page in a new browser tab.

The `SharingGuideButton` component lives in
`apps/web/src/components/SharingGuideButton.tsx` and is mounted in
`apps/web/src/components/Sidebar.tsx`.

## Sidebar footer links <span class="badge-new">NEW</span>

| Link | Description |
|------|-------------|
| **Sharing Guide** | Opens the sharing documentation (this page) in a new tab. |
| **Docs** | Opens the Content Studio documentation site in a new tab. |
| **Invite Teammate** | Opens the invite flow to add collaborators to your workspace. |

## Sharing workflows <span class="badge-new">NEW</span>

Content Studio supports the following sharing patterns:

- **Workspace collaboration** — use **Invite Teammate** to add people to
  your workspace. Invited members can view and edit all projects in the
  workspace.
- **Project visibility** — all projects in a workspace are visible to
  workspace members. Use the Kanban board to organize work across
  `backlog`, `in_progress`, `in_review`, and `done` columns.
- **Real-time updates** — changes made by any workspace member appear
  instantly via Supabase Realtime. No refresh required.
