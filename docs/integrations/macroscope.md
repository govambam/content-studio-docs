---
sidebar_position: 3
---

# Macroscope PR Review <span class="badge-new">NEW</span>

Macroscope reviews pull requests against Content Studio automatically. The
configuration lives in the `.macroscope/` directory at the repository root.

## Configuration Files <span class="badge-new">NEW</span>

| Path | Purpose |
|------|---------|
| `.macroscope/check-run-agents/*.md` | Convention-checking agents that post inline findings on PRs |
| `.macroscope/approvability.md` | Policy that decides when Macroscope may auto-approve |

## Check Run Agents <span class="badge-new">NEW</span>

Check run agents review every PR and post inline comments when code violates
team conventions. Each agent is a Markdown file under
`.macroscope/check-run-agents/` with YAML frontmatter that scopes which files
it sees.

### Design System & Frontend Conventions <span class="badge-new">NEW</span>

**File:** `.macroscope/check-run-agents/design-system.md`

Scans `apps/web/src/**` (excluding `apps/web/src/styles/**` and test files).
Flags three categories of violations:

| Severity | Rule |
|----------|------|
| 🔴 Must fix | **Colors, spacing, and font families must use design tokens.** Hardcoded hex/rgb colors, raw pixel values on the 4/8/16/24/48 spacing scale, or literal font stacks should be replaced with the custom properties defined in `apps/web/src/styles/tokens.css`. The agent verifies the token exists before flagging. |
| 🔴 Must fix | **Network calls go through the `api` helper.** Direct `fetch()` or `XMLHttpRequest` inside components, views, or contexts belongs in `apps/web/src/lib/api.ts` or a hook under `apps/web/src/hooks/`. |
| 🟡 Should fix | **Application code logs through the logger shim.** `console.log` / `warn` / `error` / `debug` calls in `apps/web/src/` should use `apps/web/src/lib/logger.ts` instead. |

**What it ignores:** `font-size`, `font-weight`, `border-radius`, `z-index`,
percentages, flex ratios, values that don't match the token scale, existing
code not touched by the PR, and `fetch` inside the `api.ts` helper itself.

### Feature Flags & Analytics <span class="badge-new">NEW</span>

**File:** `.macroscope/check-run-agents/feature-flags-analytics.md`

Scans `apps/web/src/**` (excluding test files). Applies judgment-based rules
about safe-rollout and instrumentation:

| Severity | Rule |
|----------|------|
| 🔴 Must fix | **High-risk customer-facing changes ship behind a feature flag.** New surfaces on create/edit/delete paths, board or ticket changes, billing surfaces, or third-party integrations should be gated by either `useFlags()` / `useLDClient()` from `launchdarkly-react-client-sdk` or `useFlag(key, false)` from `apps/web/src/lib/flags.ts`. |
| 🟡 Should fix | **Customer-facing actions emit an analytics event.** Mutations like ticket create, edit, delete, or invite sent should call `track()` from `apps/web/src/lib/analytics.ts` with a `snake_case` event name. |

**Guardrails before flagging:**

1. Is it actually customer-facing? Internal helpers don't need flags.
2. Is the component inside an already-gated parent? It inherits the gate.
3. Is it modifying an existing surface, not introducing a new one?
4. When in doubt, don't flag — false positives erode trust.

## Approvability Policy <span class="badge-new">NEW</span>

**File:** `.macroscope/approvability.md`

The approvability policy decides which PRs Macroscope may approve without
human sign-off. It is deliberately conservative — a missed auto-approval
costs one review cycle, a wrong one costs trust.

### When Macroscope May Auto-Approve <span class="badge-new">NEW</span>

A PR is eligible when the **entire diff** falls into one of these categories
and touches nothing on the escalation list:

| Category | Examples |
|----------|----------|
| **Documentation only** | `docs/**`, `*.md`, `README`, `CONTRIBUTING`, code comments |
| **Tests only** | New or tightened tests that add coverage without changing behavior (must cover success + failure paths per `CONTRIBUTING.md` §12) |
| **Design-token cleanups** | Replacing hardcoded colors/spacing/fonts with tokens from `apps/web/src/styles/tokens.css`, with no layout or behavior change |
| **Mechanical renames and pure refactors** | No behavior change, no public API change, no change to the `{ data, error }` response envelope |
| **Dependency bumps** | Same major version, no lockfile surprises, no new runtime dependencies |
| **Code behind a disabled flag** | Feature flagged off by default |

### Escalation Triggers — Always Requires Human Review <span class="badge-new">NEW</span>

Certain paths and change types always require a human reviewer, regardless of
how small the diff:

| Trigger | Reason |
|---------|--------|
| `supabase/migrations/**` | Database migrations are one-way doors |
| `apps/payments-api/**` | Billing and charge-flow code is high-stakes |
| `apps/api/src/routes/pagerdutyWebhook.ts` | Inbound webhooks — signature verification is security-critical |
| `apps/api/src/routes/sentryWebhook.ts` | Same: inbound webhooks |
| `apps/api/src/routes/invites.ts` | Auth and invite paths |
| `.github/workflows/**` | CI/CD changes need human eyes |
| `.macroscope/**` | Changes to the review system itself |
| New/changed API routes | A response-shape change is a contract change |
| Auth, secrets, or env vars | Includes `.env.example` changes |
| Middleware changes | `rateLimit`, `securityHeaders`, `requestContext` |

### Convention Findings Block Approval <span class="badge-new">NEW</span>

Even if a PR is otherwise eligible for auto-approval:

- **🔴 Must fix findings block approval.** The PR is not ready to merge
  unattended.
- **🟡 Should fix and 🟢 Nit findings do not block** — they're noted in the
  verdict but eligibility is decided by the rest of the policy.

### How Verdicts Are Written <span class="badge-new">NEW</span>

Macroscope names the specific policy rule that drove its decision:

> ✅ Approved: test-only PR adding success and failure coverage, no behavior
> change.

> ❌ Not approved: PR adds a migration under `supabase/migrations/`, which this
> policy escalates to a human.

When a PR is not approved, the verdict states what would need to change for it
to become eligible — for example, splitting out the migration into its own PR.

## Env Vars <span class="badge-new">NEW</span>

No environment variables are needed for the `.macroscope/` configuration —
it's read directly from the repository.

For the Macroscope webhook endpoint that forwards Sentry errors, see
[Sentry](./sentry.md#from-sentry-to-macroscope).
