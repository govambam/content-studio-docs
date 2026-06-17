---
sidebar_position: 3
---

# Markdown rendering & editing <span class="badge-new">NEW</span>

Content Studio supports GitHub Flavored Markdown (GFM) for ticket
descriptions and other rich-text fields. Rendering and editing are
handled by two components in `apps/web/src/components/`.

## Markdown renderer — `Markdown.tsx` <span class="badge-new">NEW</span>

The `Markdown` component renders a markdown string as styled HTML. It
uses [`react-markdown`](https://github.com/remarkjs/react-markdown) with
the [`remark-gfm`](https://github.com/remarkjs/remark-gfm) plugin for
GFM support.

### Supported GFM features

| Feature         | Syntax example                          |
|-----------------|-----------------------------------------|
| **Tables**      | `| A | B |` with header row             |
| **Task lists**  | `- [x] Done` / `- [ ] Todo`             |
| **Autolinks**   | `https://example.com` (no brackets)     |
| **Strikethrough** | `~~deleted~~`                         |
| **Code blocks** | Triple-backtick fenced blocks           |
| **Blockquotes** | `> quoted text`                         |
| **Headings**    | `# H1` through `###### H6`              |
| **Lists**       | `-` / `*` / `1.` items                  |
| **Links**       | `[text](url)`                           |

### Usage

```tsx
import { Markdown } from "@/components/Markdown";

<Markdown content={ticket.description} />
```

The component applies consistent styling to rendered elements via Tailwind
classes.

## Markdown editor — `MarkdownEditor.tsx` <span class="badge-new">NEW</span>

The `MarkdownEditor` component provides a two-tab editing experience:

| Tab        | Behavior                                              |
|------------|-------------------------------------------------------|
| **Write**  | Plain textarea for editing raw markdown               |
| **Preview**| Live-rendered preview using the `Markdown` component  |

### Autosave behavior

The editor does **not** have an explicit save button. Instead, it
autosaves:

1. **After a debounce** — a short delay after the user stops typing
2. **On blur** — when focus leaves the editor

This provides a seamless editing experience without requiring manual
saves.

### Keyboard shortcuts

| Shortcut           | Action                                    |
|--------------------|-------------------------------------------|
| **Esc**            | Cancel editing, revert to last saved value |
| **Cmd/Ctrl+Enter** | Immediately flush save (skip debounce)    |

### Usage

```tsx
import { MarkdownEditor } from "@/components/MarkdownEditor";

<MarkdownEditor
  value={description}
  onChange={(newValue) => updateTicket({ description: newValue })}
/>
```

### Implementation notes

- The `MarkdownEditor` is used by `TicketDetailView` for the ticket
  description field.
- Changes trigger `PUT /api/tickets/:id` which emits a
  `description_changed` activity event when the content actually changed.
- The `x-client-id` header is included in save requests to enable
  Realtime deduplication (see [Web overview](./overview.md#realtime-suppression)).

## Dependencies

These components rely on two npm packages added to `apps/web/package.json`:

| Package           | Purpose                                    |
|-------------------|--------------------------------------------|
| `react-markdown`  | Render markdown as React components        |
| `remark-gfm`      | Plugin for GitHub Flavored Markdown syntax |
