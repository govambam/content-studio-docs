---
sidebar_position: 3
---

# Macroscope check run agents <span class="badge-new">NEW</span>

Content Studio configures [Macroscope check run agents](https://macroscope.dev/docs/check-run-agents)
to run automated code reviews on pull requests. These agents live in
`.macroscope/check-run-agents/` and instruct Macroscope what to look for
when reviewing changes.

:::note
This integration adds **PR-review tooling configuration only**. It does not
add runtime API routes, environment variables, feature flags, or any
user-facing app behavior.
:::

## Configuration files <span class="badge-new">NEW</span>

The check run agent config files live at:

```
.macroscope/check-run-agents/
├── api-conventions.md
└── design-system.md
```

Each `.md` file defines a separate check run agent. Macroscope reads these
files and applies them to relevant PRs automatically.

## API conventions agent <span class="badge-new">NEW</span>

**File:** `.macroscope/check-run-agents/api-conventions.md`

This agent reviews API-related changes to ensure consistency across:

- **Hono route handlers** in `apps/api/src/routes/` — validates that handlers
  follow the project's conventions for request parsing, error handling, and
  response formatting.
- **Web callers** in `apps/web/` that invoke API endpoints — ensures the
  frontend correctly consumes API responses.

### The `{ data, error }` envelope <span class="badge-new">NEW</span>

All API responses in Content Studio use a consistent envelope:

```ts
// Success
{ data: T, error: null }

// Error
{ data: null, error: string }
```

The API conventions agent flags PRs that:

- Return raw data instead of wrapping in the envelope
- Omit `error` on success responses or `data` on error responses
- Handle API responses on the web side without accounting for the envelope
  structure

## Design system agent <span class="badge-new">NEW</span>

**File:** `.macroscope/check-run-agents/design-system.md`

This agent reviews web UI changes against the design system documented in
`docs/DESIGN-SYSTEM.md` in the Content Studio repository.

### What it checks <span class="badge-new">NEW</span>

When a PR modifies files under `apps/web/`, the design system agent verifies:

- **Component usage** — Are changes using the approved UI primitives and
  patterns from the design system?
- **Styling conventions** — Do new styles follow spacing, color, and
  typography tokens defined in the design system?
- **Accessibility** — Are interactive elements meeting the baseline a11y
  requirements documented in the design system?

The agent references `docs/DESIGN-SYSTEM.md` as its source of truth for
what constitutes conformant UI code.

## How check run agents work <span class="badge-new">NEW</span>

When a pull request is opened or updated in `govambam/content-studio`:

1. Macroscope detects the PR and reads `.macroscope/check-run-agents/*.md`.
2. Each agent file is evaluated against the changed files in the PR.
3. Macroscope posts review comments directly on the PR if it finds issues.
4. The check run status (pass/fail) appears in the PR's status checks.

This happens automatically — no manual trigger required.
