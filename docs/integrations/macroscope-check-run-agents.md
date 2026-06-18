---
sidebar_position: 3
---

# Macroscope Check Run Agents <span class="badge-new">NEW</span>

Check run agents are AI-powered reviewers that post inline review comments on
pull requests. They are **advisory only** — comments are posted as neutral
observations and cannot block merges.

## Directory Convention <span class="badge-new">NEW</span>

Agent definitions live in `.macroscope/check-run-agents/` as Markdown files:

```
.macroscope/
└── check-run-agents/
    ├── backend-conventions.md
    ├── security-webhooks-secrets-pii.md
    └── safe-rollout-telemetry.md
```

Each `.md` file defines one agent. The filename becomes the agent identifier.

## Frontmatter Fields <span class="badge-new">NEW</span>

Agent behavior is configured via YAML frontmatter at the top of each file:

```yaml
---
title: Backend Conventions
model: claude-sonnet
reasoning: false
effort: low
input: diff
include:
  - "apps/api/**"
  - "apps/payments-api/**"
exclude:
  - "**/*.test.ts"
  - "**/__mocks__/**"
---
```

| Field | Required | Description |
|-------|----------|-------------|
| `title` | Yes | Display name shown in the GitHub check run and review comments |
| `model` | No | Model to use (`claude-sonnet`, `claude-haiku`, etc.). Defaults to `claude-sonnet` |
| `reasoning` | No | Enable extended thinking for complex analysis. Defaults to `false` |
| `effort` | No | Processing effort (`low`, `medium`, `high`). Defaults to `low` |
| `input` | No | What the agent receives: `diff` (changed lines only) or `files` (full file contents). Defaults to `diff` |
| `include` | No | Glob patterns for paths the agent should review. If omitted, reviews all changed files |
| `exclude` | No | Glob patterns for paths to skip. Applied after `include` |

The Markdown body after frontmatter contains the agent's system prompt —
instructions describing what to look for and how to comment.

## Advisory Behavior <span class="badge-new">NEW</span>

Check run agents are strictly non-blocking:

- Comments are posted as **neutral** review comments, not as
  "request changes" reviews
- The GitHub check run completes with a **neutral** status, not success or
  failure
- PRs can always be merged regardless of agent feedback
- Comments appear inline on the diff at the relevant line

This makes agents useful for catching issues early without creating CI
bottlenecks or false-positive merge blocks.

## Activation <span class="badge-new">NEW</span>

Agents activate **after merging to the default branch**. Adding a new agent
file to `.macroscope/check-run-agents/` on a feature branch won't trigger
reviews until that branch merges to `main`.

Once merged, the agent runs on all subsequent PRs where changed files match
the agent's `include`/`exclude` patterns.

## Bundled Agents <span class="badge-new">NEW</span>

Content Studio ships three check run agents as of PR #103.

### Backend Conventions <span class="badge-new">NEW</span>

Reviews backend code in `apps/api` and `apps/payments-api` for adherence to
project conventions.

| Property | Value |
|----------|-------|
| File | `.macroscope/check-run-agents/backend-conventions.md` |
| Scope | `apps/api/**`, `apps/payments-api/**` |
| Focus | Hono route patterns, Zod validation, error handling, import ordering |

### Security — Webhooks, Secrets & PII <span class="badge-new">NEW</span>

Scans backend webhook handlers and related code for security concerns.

| Property | Value |
|----------|-------|
| File | `.macroscope/check-run-agents/security-webhooks-secrets-pii.md` |
| Scope | Backend webhook routes and security-sensitive paths |
| Focus | Secret handling, PII exposure in logs, webhook signature validation, auth checks |

### Safe Rollout & Telemetry <span class="badge-new">NEW</span>

Reviews feature flag usage, analytics instrumentation, and list-bound iteration
in `apps/web` and `apps/api`.

| Property | Value |
|----------|-------|
| File | `.macroscope/check-run-agents/safe-rollout-telemetry.md` |
| Scope | `apps/web/**`, `apps/api/**` |
| Focus | LaunchDarkly flag hygiene, analytics event naming, unbounded list iteration, gradual rollout patterns |
