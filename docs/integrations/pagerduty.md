---
sidebar_position: 3
---

# PagerDuty <span class="badge-new">NEW</span>

Content Studio integrates with PagerDuty to automatically investigate
triggered incidents. When PagerDuty fires an `incident.triggered` webhook
the API forwards an investigation prompt to Macroscope, which queries
PagerDuty MCP, GCP Cloud Logging, Sentry, and the codebase. The structured
findings are then written back to a custom field on the PagerDuty incident.

## Inbound webhook flow <span class="badge-new">NEW</span>

`apps/api/src/routes/pagerdutyWebhook.ts` handles
`POST /api/webhooks/pagerduty`.

1. PagerDuty sends a V3 webhook with event type `incident.triggered`.
2. If `PAGERDUTY_WEBHOOK_SECRET` is set, the handler verifies the
   HMAC-SHA256 signature. If verification fails, it returns `401`.
3. The handler builds an investigation prompt that instructs the Macroscope
   agent to use PagerDuty MCP, GCP Cloud Logging, Sentry, and the
   codebase, and to return a structured response:
   **ROOT CAUSE / EVIDENCE / FIX PROMPT**.
4. The prompt embeds an `[INCIDENT_ID:<id>]` tag so the findings callback
   can correlate the response to the original incident.
5. The payload is `POST`ed to `MACROSCOPE_WEBHOOK_URL_PAGERDUTY` with
   `X-Webhook-Secret: $MACROSCOPE_WEBHOOK_SECRET_PAGERDUTY` and a
   `responseDestination.webhookUrl` pointing back at
   `/api/webhooks/pagerduty/findings`.

## Outbound findings flow <span class="badge-new">NEW</span>

`apps/api/src/routes/pagerdutyFindings.ts` handles
`POST /api/webhooks/pagerduty/findings`.

1. Macroscope calls back with its investigation results.
2. The handler extracts the incident ID from the echoed `query` field via
   the `[INCIDENT_ID:<id>]` regex.
3. The reply text is pulled from one of several possible field names
   (`answer`, `response`, `message`, etc.).
4. The text is truncated to 2 000 characters (PagerDuty's paragraph custom
   field limit).
5. A `PUT` to the PagerDuty API at
   `/incidents/<id>/custom_fields/values` writes the findings into the
   custom field identified by `PAGERDUTY_INVESTIGATION_FIELD_ID`.

## Env vars <span class="badge-new">NEW</span>

| Var | Required? | Purpose |
|---|---|---|
| `MACROSCOPE_WEBHOOK_URL_PAGERDUTY` | **yes** | Macroscope webhook URL for PagerDuty-triggered investigations. |
| `MACROSCOPE_WEBHOOK_SECRET_PAGERDUTY` | **yes** | Shared secret sent as `X-Webhook-Secret` on the forward to Macroscope. |
| `PAGERDUTY_WEBHOOK_SECRET` | optional | HMAC secret for verifying inbound PagerDuty V3 webhook signatures. Omit to skip verification. |
| `PAGERDUTY_API_TOKEN` | **yes** | PagerDuty REST API token used to write findings back to incidents. |
| `PAGERDUTY_FROM_EMAIL` | optional (defaults to `ivan@prasso.ai`) | `From` header required by the PagerDuty API for `PUT` requests on incidents. |
| `PAGERDUTY_INVESTIGATION_FIELD_ID` | **yes** | ID of the PagerDuty custom field (paragraph type) where investigation findings are written. |

Full list on the [Env vars page](../getting-started/env-vars.md).
