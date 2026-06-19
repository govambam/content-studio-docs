---
sidebar_position: 3
---

# Macroscope Check Run Agents

Content Studio ships seven custom Macroscope check run agents that run on
every PR alongside the built-in **Correctness** and **Approvability** agents.
These live under `.macroscope/check-run-agents/` in the
[content-studio](https://github.com/govambam/content-studio) repository.

## Bundled Agents

### Backend Conventions

| Property | Value |
|---|---|
| File | `.macroscope/check-run-agents/backend-conventions.md` |
| Disposition | Advisory / Neutral |
| Applies to | `apps/api/src/**`, `apps/payments-api/src/**` |

Checks that backend code follows Content Studio conventions:

- Service functions return `{ data, error }` result objects rather than
  throwing.
- Route handlers validate input with Zod and use the shared `parseBody` /
  `parseParams` helpers.
- New routes are registered in the appropriate router file.

### Security — Webhooks, Secrets & PII

| Property | Value |
|---|---|
| File | `.macroscope/check-run-agents/security.md` |
| Disposition | Advisory / Neutral |
| Applies to | `apps/api/src/**`, `apps/payments-api/src/**` |

Focuses on secure handling of inbound webhooks and sensitive data:

- Webhook endpoints verify sender identity (signatures, shared secrets).
- Secrets are read from environment variables, never hardcoded.
- Logs and error messages do not leak PII or credentials.

### Safe Rollout & Telemetry

| Property | Value |
|---|---|
| File | `.macroscope/check-run-agents/safe-rollout.md` |
| Disposition | Advisory / Neutral |
| Applies to | `apps/api/src/**`, `apps/payments-api/src/**`, `apps/web/src/**` |

Ensures changes are observable and safely deployable:

- New features are gated behind LaunchDarkly flags where appropriate.
- Critical paths emit telemetry (logs, metrics, or traces).
- Database migrations are backward-compatible with the previous release.

### Backend Safety <span class="badge-new">NEW</span>

| Property | Value |
|---|---|
| File | `.macroscope/check-run-agents/backend-safety.md` |
| Disposition | Advisory / Neutral |
| Applies to | `apps/api/src/**`, `apps/payments-api/src/**` |

Validates backend code for input safety and secure logging:

- Input is validated at the edge before processing.
- Structured logging is used without secrets or PII in log payloads.
- Inbound webhook handlers verify sender identity.

### Observability & Data Bounds <span class="badge-new">NEW</span>

| Property | Value |
|---|---|
| File | `.macroscope/check-run-agents/observability.md` |
| Disposition | Advisory / Neutral |
| Applies to | `apps/api/src/**`, `apps/payments-api/src/**`, `apps/web/src/**` |

Checks for proper observability and bounded data operations:

- List endpoints are bounded (pagination, limits) to prevent unbounded
  queries.
- Customer-facing web mutations include analytics tracking.

### Testing <span class="badge-new">NEW</span>

| Property | Value |
|---|---|
| File | `.macroscope/check-run-agents/testing.md` |
| Disposition | Advisory / Neutral |
| Applies to | `apps/api/src/**`, `apps/payments-api/src/**` |

Ensures adequate test coverage for backend routes:

- New or changed routes ship with both success and failure test cases.
- Bug fixes include a regression test that would have caught the bug.

### Accessibility <span class="badge-new">NEW</span>

| Property | Value |
|---|---|
| File | `.macroscope/check-run-agents/accessibility.md` |
| Disposition | Advisory / Neutral |
| Applies to | `apps/web/src/**` |

Validates accessibility best practices in the web app:

- Interactive elements (buttons, links, controls) are keyboard reachable.
- Images and icons have appropriate text alternatives.
- Form controls have associated labels.

## How Check Run Agents Work

When a PR is opened or updated, Macroscope runs each agent against the
changed files. Agents with a matching `applies to` glob evaluate the diff
and post their findings as a GitHub check run.

- **Advisory / Neutral** agents provide recommendations but do not block
  merge. They surface as informational checks.
- **Required** agents (if configured) can block merge until their
  conditions are satisfied.

All Content Studio agents are advisory — they guide reviewers but don't
gate mergeability.

## Adding or Modifying Agents

To add a new agent:

1. Create a Markdown file in `.macroscope/check-run-agents/` following the
   existing format.
2. Define the agent's title, disposition, file globs, and evaluation
   criteria.
3. Commit to the default branch — agents take effect on subsequent PRs.

See the [Macroscope documentation](https://docs.macroscope.io/check-run-agents)
for the full agent configuration schema.
