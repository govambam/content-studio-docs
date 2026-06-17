---
sidebar_position: 3
---

# Macroscope Check Run Agents <span class="badge-new">NEW</span>

Macroscope check run agents are AI-powered reviewers that automatically annotate
PRs with feedback on code conventions. They run as GitHub check runs and leave
inline annotations on changed files.

## How It Works <span class="badge-new">NEW</span>

Agent definitions live in `.macroscope/check-run-agents/` as markdown files.
Each file defines:

- **Globs** — which files the agent cares about (e.g., `apps/api/src/**`)
- **Rules** — what the agent checks for
- **Conclusion** — whether violations block merges or are advisory

When you merge a PR that adds or modifies an agent file, Macroscope activates
that agent for all **future** PRs targeting the default branch. The agent then
runs automatically on new PRs, reading the diff and leaving annotations where
it finds issues.

## Advisory vs. Blocking <span class="badge-new">NEW</span>

Both bundled agents are configured as **advisory** (neutral conclusion). They
annotate PRs with suggestions but do not block merges. To make an agent
blocking, change its conclusion from `neutral` to `failure` — but this is not
recommended until the codebase fully complies with the agent's rules.

## Bundled Agents <span class="badge-new">NEW</span>

Content Studio ships two check run agents.

### `api-conventions.md` <span class="badge-new">NEW</span>

| Property | Value |
|---|---|
| Path | `.macroscope/check-run-agents/api-conventions.md` |
| Globs | `apps/api/src/**`, `apps/web/src/**` |
| Conclusion | `neutral` (advisory) |

This agent enforces the API response envelope convention:

- **Route handlers** must return `{ data, error }` — never a raw object or
  array.
- **Callers** (web app code that fetches from the API) must check the `error`
  field before using `data`.

Example violation the agent flags:

```ts
// ❌ Missing error envelope
return c.json({ users });

// ✅ Correct
return c.json({ data: { users }, error: null });
```

### `design-system.md` <span class="badge-new">NEW</span>

| Property | Value |
|---|---|
| Path | `.macroscope/check-run-agents/design-system.md` |
| Globs | `apps/web/**` |
| Conclusion | `neutral` (advisory) |

This agent enforces Content Studio's design-system rules:

| Rule | Details |
|---|---|
| No shadows / blur / backdrop-filter | Avoid `box-shadow`, `filter: blur()`, and `backdrop-filter`. |
| No rounded structural elements | Don't apply `border-radius` to cards, panels, or modals — only buttons, inputs, and avatars are exceptions. |
| Use CSS custom property tokens | Use `var(--color-*)` tokens instead of hardcoded hex/rgb/hsl values. |
| No CSS-in-JS | Don't use styled-components, Emotion, or similar runtime CSS libraries. |

Example violation the agent flags:

```tsx
// ❌ Hardcoded color
<div style={{ background: "#1a1a1a" }}>

// ✅ Token
<div style={{ background: "var(--color-surface)" }}>
```

## Adding a New Agent <span class="badge-new">NEW</span>

1. Create a markdown file in `.macroscope/check-run-agents/`.
2. Define the globs, rules, and conclusion in the file's content.
3. Open a PR and merge it to the default branch.
4. The agent activates and runs on all subsequent PRs.

See existing agent files for the expected format.
