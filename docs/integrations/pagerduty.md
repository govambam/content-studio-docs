---
sidebar_position: 3
---

# PagerDuty <span class="badge-new">NEW</span>

Content Studio relays PagerDuty incidents to Macroscope Agent for
automated investigation and posts findings back as incident notes. Two
routes handle the round-trip: an inbound webhook that receives PagerDuty
V3 events, and an outbound callback that Macroscope calls when its
analysis is ready.

## Inbound flow — PagerDuty → Macroscope <span class="badge-new">NEW</span>

`apps/api/src/routes/pagerdutyWebhook.ts`

1. PagerDuty sends a V3 webhook to `POST /api/webhooks/pagerduty`.
2. If `PAGERDUTY_WEBHOOK_SECRET` is set, the route verifies the
   HMAC-SHA256 signature on the request. In development mode the check
   is skipped when the secret is absent.
3. The route extracts the `incident.triggered` event, builds an agent
   query referencing the incident title and service, and forwards it to
   `MACROSCOPE_WEBHOOK_URL_PAGERDUTY` with
   `X-Webhook-Secret: $MACROSCOPE_WEBHOOK_SECRET_PAGERDUTY`.
4. The forwarded payload includes a `responseDestination` callback URL
   pointing to the findings route so Macroscope can post results back.

## Outbound flow — Macroscope → PagerDuty <span class="badge-new">NEW</span>

`apps/api/src/routes/pagerdutyFindings.ts`

1. Macroscope Agent calls
   `POST /api/webhooks/pagerduty/findings/:incidentId` with its
   analysis.
2. The route posts the findings as a note on the PagerDuty incident
   using the PagerDuty REST API (`POST /incidents/{id}/notes`).
3. Requires `PAGERDUTY_API_TOKEN` and `PAGERDUTY_FROM_EMAIL` for the
   API call.

## Env vars <span class="badge-new">NEW</span>

| Var | Required? | Purpose |
|---|---|---|
| `MACROSCOPE_WEBHOOK_URL_PAGERDUTY` | **yes** | Macroscope Agent webhook URL for PagerDuty-sourced incidents. |
| `MACROSCOPE_WEBHOOK_SECRET_PAGERDUTY` | **yes** | Shared secret sent as `X-Webhook-Secret` on the forward to Macroscope. |
| `PAGERDUTY_API_TOKEN` | **yes** | PagerDuty REST API token used to post incident notes. |
| `PAGERDUTY_FROM_EMAIL` | optional (defaults to `ivan@prasso.ai`) | Email address sent in the `From` header on PagerDuty API writes. |
| `PAGERDUTY_WEBHOOK_SECRET` | optional in dev | HMAC-SHA256 secret for verifying inbound PagerDuty webhook signatures. Required in production. |
| `API_BASE_URL` | optional | Override for the callback URL base sent to Macroscope. Defaults to the server's own origin. |

Full variable list on the [Env vars page](../getting-started/env-vars.md).
