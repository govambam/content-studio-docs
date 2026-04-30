---
sidebar_position: 3
---

# PagerDuty <span class="badge-new">NEW</span>

Content Studio's API receives PagerDuty V3 webhook events and relays
triggered incidents to the Macroscope agent for automated investigation.
This integration is API-side only — the web app has no PagerDuty-specific
UI.

## How it works <span class="badge-new">NEW</span>

1. PagerDuty sends an `incident.triggered` event to
   `POST /api/webhooks/pagerduty`.
2. The handler verifies the webhook signature (when
   `PAGERDUTY_WEBHOOK_SECRET` is configured) and extracts incident
   metadata: id, title, service name, urgency, and HTML link.
3. A smoke-test query is built from the incident details and forwarded to
   the Macroscope agent at `MACROSCOPE_WEBHOOK_URL_PAGERDUTY`.
4. Instead of posting results to Slack, Macroscope delivers its response
   to a callback URL:
   ```
   <API_BASE_URL>/api/webhooks/pagerduty/findings/<incidentId>
   ```

## Signature verification <span class="badge-new">NEW</span>

Inbound PagerDuty webhooks can be verified using HMAC-SHA256. The handler
reads the `X-PagerDuty-Signature` header, which contains one or more
`v1=<hex>` entries, and performs a timing-safe comparison against the
computed digest.

- If `PAGERDUTY_WEBHOOK_SECRET` is set → invalid signatures are rejected
  with a `401`.
- If `PAGERDUTY_WEBHOOK_SECRET` is **not** set → all requests are accepted
  (a warning is logged).

## Differences from the Sentry integration <span class="badge-new">NEW</span>

| | Sentry | PagerDuty |
|---|---|---|
| **Response destination** | Slack channel (`slackChannelId`) | Callback URL (`webhookUrl`) |
| **Webhook secret env var** | `MACROSCOPE_WEBHOOK_SECRET` | `MACROSCOPE_WEBHOOK_SECRET_PAGERDUTY` |
| **Agent endpoint env var** | `MACROSCOPE_WEBHOOK_URL` | `MACROSCOPE_WEBHOOK_URL_PAGERDUTY` |
| **Inbound signature** | Not verified | HMAC-SHA256 (optional) |

## Env vars it reads <span class="badge-new">NEW</span>

| Var | Required? | Purpose |
|---|---|---|
| `MACROSCOPE_WEBHOOK_URL_PAGERDUTY` | **yes** | Macroscope Agent webhook endpoint. |
| `MACROSCOPE_WEBHOOK_SECRET_PAGERDUTY` | **yes** | Shared secret for outbound auth. |
| `PAGERDUTY_WEBHOOK_SECRET` | no | HMAC secret for inbound signature verification. |
| `API_BASE_URL` | no | Override for callback URL base. Defaults to the inbound request's origin. |

See the full list in [Env vars reference](../getting-started/env-vars.md).
