---
sidebar_position: 3
---

# Macroscope Check Run Agents

Content Studio ships six custom Macroscope check run agents that run on
every PR alongside the built-in **Correctness** and **Approvability** agents.
These live under `.macroscope/check-run-agents/` in the
[content-studio](https://github.com/govambam/content-studio) repository.

## Bundled Agents

### Accessibility

| Property | Value |
|---|---|
| File | `.macroscope/check-run-agents/accessibility.md` |
| Disposition | Advisory / Neutral |
| Applies to | `apps/web/src/**` |

Validates accessibility best practices in the web app:

- Interactive elements (buttons, links, controls) are keyboard reachable.
- Images and icons have appropriate text alternatives.
- Form controls have associated labels.

### API Conventions <span class="badge-new">NEW</span>

| Property | Value |
|---|---|
| File | `.macroscope/check-run-agents/api-conventions.md` |
| Disposition | Advisory / Neutral |
| Applies to | `apps/api/src/**`, `apps/payments-api/src/**` |

Enforces Hono backend API response and validation conventions:

- Route handlers return responses using the `ApiResponse<T>` envelope with consistent status codes.
- Request bodies and params are validated at the edge using shared Zod schemas and helpers.
- Supabase operations follow project error handling patterns.

### Backend Code Quality <span class="badge-new">NEW</span>

| Property | Value |
|---|---|
| File | `.macroscope/check-run-agents/backend-code-quality.md` |
| Disposition | Advisory / Neutral |
| Applies to | `apps/api/src/**`, `apps/payments-api/src/**` |

Validates backend code quality and TypeScript discipline:

- Uses structured pino logging with request-scoped context (e.g., `requestId`).
- No secrets or PII appear in log payloads.
- Follows NodeNext ESM import discipline with explicit `.js` extensions.
- Uses type-only imports (`import type`) where appropriate.
- Leverages shared types from the types package.

### Frontend Conventions <span class="badge-new">NEW</span>

| Property | Value |
|---|---|
| File | `.macroscope/check-run-agents/frontend-conventions.md` |
| Disposition | Advisory / Neutral |
| Applies to | `apps/web/src/**` |

Reviews frontend code for project conventions:

- Network requests go through the API helper or hooks, not raw fetch.
- Uses the logger shim instead of `console.*` methods.
- Visual values use design tokens — no hardcoded colors, spacing, or font sizes.
- Customer-facing actions emit analytics events.

### Security & Webhooks <span class="badge-new">NEW</span>

| Property | Value |
|---|---|
| File | `.macroscope/check-run-agents/security-and-webhooks.md` |
| Disposition | Advisory / Neutral |
| Applies to | `apps/api/src/**`, `apps/payments-api/src/**` |

Audits security practices for webhooks and sensitive data handling:

- Inbound webhook handlers verify sender identity via signature verification.
- Secrets are read from environment variables, never hardcoded.
- No undocumented bypasses of security middleware.
- User-facing error messages do not leak internal details or stack traces.

### Testing

| Property | Value |
|---|---|
| File | `.macroscope/check-run-agents/testing.md` |
| Disposition | Advisory / Neutral |
| Applies to | `apps/api/src/**`, `apps/payments-api/src/**` |

Ensures adequate test coverage for backend routes:

- New or changed routes ship with both success and failure test cases.
- Bug fixes include a regression test that would have caught the bug.

## How Check Run Agents Work

When a PR is opened or updated, Macroscope runs each agent against the
changed files. Agents with a matching `Applies to` glob evaluate the diff
and post their findings as a GitHub check run.

Comments are advisory, not blocking. The check run itself will pass even if
agents leave suggestions. It's up to the PR author and reviewers to decide
which suggestions to accept.

## Adding or Modifying Agents

Agent definitions live in `.macroscope/check-run-agents/` as Markdown files.
To add a new agent, create a new `.md` file describing what to review and
how to comment. Changes take effect on the next PR.

See the [content-studio repository](https://github.com/govambam/content-studio)
for the full agent definition files.
