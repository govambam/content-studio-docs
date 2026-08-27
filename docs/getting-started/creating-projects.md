---
sidebar_position: 3
---

# Creating projects <span class="badge-new">NEW</span>

Content Studio provides two entry points for creating new projects, both
accessible from the home view.

## Standard new project flow <span class="badge-new">NEW</span>

The primary way to create a project is via the existing **New Project** button
on the home view. Clicking it opens the new-project modal where you can enter
project details before creating.

## From Template entry point <span class="badge-new">NEW</span>

The home view now includes a **+ From Template** button beside the standard new
project button. This entry point is implemented by the `TemplateProjectButton`
component in `apps/web/src/components/TemplateProjectButton.tsx` and wired into
`apps/web/src/views/HomeView.tsx`.

Clicking **+ From Template**:

1. Tracks the `new_project_modal_opened` analytics event with `{ source: "template" }`
2. Opens the same new-project modal as the standard flow

This allows users to create projects from a template-oriented entry point while
reusing the existing modal and project creation logic.

## When to use each entry point <span class="badge-new">NEW</span>

| Entry point | Use case |
|-------------|----------|
| **New Project** | General-purpose project creation |
| **+ From Template** | When starting from a template; tracked separately for analytics |

Both entry points lead to the same new-project modal — the difference is the
analytics tracking, which helps the team understand how users prefer to start
new projects.
