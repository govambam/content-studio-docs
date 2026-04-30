---
sidebar_position: 3
---

# PagerDuty <span class="badge-new">NEW</span>

Content Studio acts as a two-way relay between PagerDuty and the Macroscope
Agent. When a PagerDuty incident fires, the relay forwards a query to
Macroscope; when Macroscope replies, the relay posts the answer as a note
on the originating incident.

## Architecture <span class="badge-new">NEW</span>

```
PagerDuty V3 webhook
  → POST /api/webhooks/pagerduty        (pagerdutyWebhook.ts)
  → Macroscope Agent webhook trigger
  → POST /api/webhooks/pagerduty/findings (pagerdutyFindings.ts)
  → PagerDuty Notes API
```

The two halves are registered in `apps/api/src/index.ts`:

```ts
app.route("/api/webhooks/pagerduty/findings", pagerdutyFindings);
app.route("/api/webhooks/pagerduty",          pagerdutyWebhook);
```

## Static callback URL <span class="badge-new">NEW</span>

Macroscope's workspace allowlist for `webhookUrl` destinations uses strict
literal matching — no prefix matching, no wildcards. A callback URL with
the incident ID in the path (e.g. `/findings/Q3U6RQ7X6CQIHX`) would
require the operator to add an allowlist entry for every new incident.

To avoid this, the relay uses a single static callback URL:

```
https://<host>/api/webhooks/pagerduty/findings
```

The incident ID is encoded inside the query text as a structured tag
(`[INCIDENT_ID:<id>]`). Macroscope echoes the original query verbatim in
its reply body's `query` field, so the findings route extracts the ID with
a regex.

**Operator action:** add the static callback URL above as a single entry
in Macroscope → workspace settings → Allowed External URLs. That one entry
covers all current and future incidents.

## Env vars <span class="badge-new">NEW</span>

| Var | Purpose |
|---|---|
| `MACROSCOPE_WEBHOOK_URL_PAGERDUTY` | Macroscope webhook trigger URL (required). |
| `MACROSCOPE_WEBHOOK_SECRET_PAGERDUTY` | Shared secret for the Macroscope forward (required). |
| `PAGERDUTY_WEBHOOK_SECRET` | HMAC-SHA256 secret for verifying inbound PD signatures (optional; warn-and-accept if unset). |
| `PAGERDUTY_API_TOKEN` | PagerDuty API token for posting incident notes (required). |
| `PAGERDUTY_FROM_EMAIL` | `From` header email for the PD Notes API (defaults to `ivan@prasso.ai`). |
| `API_BASE_URL` | Override the base URL for the callback (optional; derived from the request if unset). |

See [Env vars reference](../getting-started/env-vars.md) for the full
table.

## PagerDuty subscription setup <span class="badge-new">NEW</span>

1. In PagerDuty, go to **Integrations → Generic Webhooks (v3)**.
2. Create a subscription pointing at
   `https://<your-host>/api/webhooks/pagerduty`.
3. Filter to `incident.triggered` events (the relay ignores all others).
4. Copy the signing secret into `PAGERDUTY_WEBHOOK_SECRET` if you want
   signature verification.

## Signature verification <span class="badge-new">NEW</span>

PagerDuty signs V3 webhook payloads with HMAC-SHA256. The signature is
sent in the `X-PagerDuty-Signature` header as one or more `v1=<hex>`
entries (comma-separated during secret rotation).

If `PAGERDUTY_WEBHOOK_SECRET` is set, the relay validates the signature
using timing-safe comparison and returns `401` on mismatch. If the var is
unset, the relay accepts all requests and logs a warning — this is
intentional for initial setup and demo environments.

## Relationship to the Sentry relay <span class="badge-new">NEW</span>

The PagerDuty relay follows the same pattern as the existing
[Sentry webhook relay](./sentry.md): receive an external event, build a
Macroscope Agent query, and forward it. The difference is the reply path —
the Sentry relay delivers to Slack via `responseDestination.slackChannelId`,
while the PagerDuty relay uses `responseDestination.webhookUrl` to receive
the answer and post it back to PagerDuty as an incident note.
