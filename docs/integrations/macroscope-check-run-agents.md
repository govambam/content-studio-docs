---
sidebar_position: 3
---

# Macroscope Check Run Agents <span class="badge-new">NEW</span>

Content Studio uses **Macroscope check run agents** to automatically review
pull requests against project-specific standards. These agents run as GitHub
check runs whenever a PR is opened or updated, leaving inline comments and
suggestions directly on the code.

## How it works <span class="badge-new">NEW</span>

Macroscope reads agent definition files from the `.macroscope/check-run-agents/`
directory in the repository root. Each `.md` file in that directory defines a
single agent with instructions describing what to review and how to comment.

When a pull request is opened or a new commit is pushed:

1. GitHub triggers Macroscope via a check run.
2. Macroscope loads all agent definitions from `.macroscope/check-run-agents/`.
3. Each agent reviews the PR diff according to its instructions.
4. Agents leave inline review comments on lines that need attention.
5. The check run reports success once all agents complete.

## Defined agents <span class="badge-new">NEW</span>

Content Studio defines five check run agents:

| Agent | File | What it reviews |
|-------|------|-----------------|
| **Accessibility** | `accessibility.md` | Ensures UI components follow accessibility best practices — proper ARIA attributes, keyboard navigation, color contrast considerations, and semantic HTML. |
| **API Conventions** | `api-conventions.md` | Validates that API routes follow project conventions — consistent response shapes using `ApiResponse<T>`, proper error handling, Zod schema usage, and RESTful patterns. |
| **Backend Logging** | `backend-logging.md` | Checks that server-side code uses structured pino logging correctly — appropriate log levels, inclusion of contextual fields like `requestId`, and no sensitive data in logs. |
| **Frontend House Style** | `frontend-house-style.md` | Reviews React components for house style — component file organization, hook usage patterns, Tailwind class ordering, and naming conventions. |
| **Webhook Security** | `webhook-security.md` | Audits webhook handlers for security practices — signature verification, replay protection, input validation, and proper secret handling. |

## Understanding agent comments <span class="badge-new">NEW</span>

Agent comments appear as **review comments** on pull requests, attached to
specific lines of code. Each comment includes:

- **What the agent noticed** — a description of the potential issue or
  improvement opportunity.
- **Why it matters** — context on the convention or best practice being
  referenced.
- **Suggested fix** (when applicable) — a concrete code suggestion the author
  can apply directly.

Comments are advisory, not blocking. The check run itself will pass even if
agents leave suggestions. It's up to the PR author and reviewers to decide
which suggestions to accept.

### Example comment

An accessibility agent comment might look like:

> **Accessibility**: This `<div onClick>` should be a `<button>` for keyboard
> accessibility. Interactive elements need to be focusable and respond to
> Enter/Space key presses.
>
> ```suggestion
> <button onClick={handleClick} className="...">
> ```

## Adding a new agent <span class="badge-new">NEW</span>

To add a new check run agent:

1. Create a new Markdown file in `.macroscope/check-run-agents/`:

   ```
   .macroscope/check-run-agents/your-agent-name.md
   ```

2. Write the agent's instructions in plain English. Describe:
   - What files or patterns the agent should focus on.
   - What conventions or standards to enforce.
   - How to phrase comments (tone, level of detail).
   - When to suggest fixes vs. just flag issues.

3. Commit and push. The agent activates on the next PR.

### Agent definition structure

Agent files are freeform Markdown. A typical structure:

```markdown
# Agent Name

## Scope
Describe which files this agent reviews (e.g., "all files in apps/api/src/routes/").

## Standards
List the conventions to enforce, with examples of correct and incorrect patterns.

## Comment style
Guidance on tone and format — be helpful, not pedantic.
```

Macroscope interprets the entire file as instructions for the agent. Be
specific about what matters and what doesn't — vague instructions lead to
noisy or unhelpful comments.

## Modifying an existing agent <span class="badge-new">NEW</span>

Edit the corresponding `.md` file in `.macroscope/check-run-agents/` and push.
Changes take effect on the next PR check run. Consider:

- **Testing changes**: Open a draft PR that intentionally includes code the
  modified agent should catch. Verify the comments are helpful.
- **Scope creep**: Keep agents focused. If an agent's instructions grow too
  broad, split it into multiple targeted agents.
- **False positives**: If an agent flags correct code, refine its instructions
  to be more precise about when to comment.

## Disabling an agent <span class="badge-new">NEW</span>

Delete or rename the agent's `.md` file (e.g., rename to `.md.disabled`).
Macroscope only loads files ending in `.md` from the check-run-agents
directory.

## Relationship to other Macroscope features <span class="badge-new">NEW</span>

Check run agents are separate from the Sentry webhook integration documented
in [Sentry → From Sentry to Macroscope](./sentry.md#from-sentry-to-macroscope).
That integration forwards runtime errors for investigation; check run agents
review code changes before they're merged.

Both features use Macroscope but serve different purposes:

| Feature | Trigger | Purpose |
|---------|---------|---------|
| Check run agents | PR opened/updated | Catch issues in code review |
| Sentry webhook | Runtime error | Investigate production issues |
