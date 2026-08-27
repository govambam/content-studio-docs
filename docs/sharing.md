---
sidebar_position: 1
slug: /sharing
---

# Sharing <span class="badge-new">NEW</span>

Content Studio lets you share your board with teammates and collaborators
through the Share Board button in the sidebar.

## Share Board button <span class="badge-new">NEW</span>

The sidebar footer includes a **Share Board** button that opens the sharing
documentation and help flow in a new browser tab. This provides users with
guidance on how to share their board and collaborate with others.

### How it works <span class="badge-new">NEW</span>

- Click the **Share Board** button in the sidebar footer.
- A new browser tab opens with the sharing documentation/help flow.
- The button is always visible in the sidebar (not gated by a feature flag).

## Analytics <span class="badge-new">NEW</span>

Clicking the Share Board button records the `board_shared` analytics event
with the following properties:

| Property | Value     | Description                              |
|----------|-----------|------------------------------------------|
| `source` | `sidebar` | Indicates the share was initiated from the sidebar button |

This event helps track user engagement with the sharing feature.
