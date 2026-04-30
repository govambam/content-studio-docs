---
sidebar_position: 3
---

# PagerDuty <span class="badge-new">NEW</span>

Content Studio relays PagerDuty incidents to Macroscope and writes the
Agent's findings back as incident notes. The integration consists of two
API routes that form a round-trip:

```
PagerDuty  ──incident.triggered──▶  /api/webhooks/pagerduty
                                          │
                                     forward query to
                                     Macroscope Agent
                                          │
Macroscope Agent  ──reply──▶  /api/webhooks/pagerduty/findings/:incidentId
                                          │
                                     POST note to
                                     PagerDuty incident
```

## How it works <span class="badge-new">NEW</span>

1. A PagerDuty V3 webhook subscription sends `incident.triggered` events
   to `POST /api/webhooks/pagerduty`.
2. The inbound route verifies the signature (if `PAGERDUTY_WEBHOOK_SECRET`
   is configured), extracts the incident metadata, and forwards a query
   to the Macroscope Agent at `MACROSCOPE_WEBHOOK_URL_PAGERDUTY`.
3. The forward includes a `responseDestination` callback URL pointing at
   `/api/webhooks/pagerduty/findings/:incidentId`.
4. When the Agent finishes, it POSTs its reply to that callback URL.
5. The findings route extracts the reply text and creates an incident
   note via the PagerDuty REST API.

Non-triggered events (including payloads with a missing or null
`event_type`) are acknowledged with a `200` so PagerDuty does not
retry, but no Agent run is triggered.

## Required env vars <span class="badge-new">NEW</span>

| Var | Purpose |
|---|---|
| `MACROSCOPE_WEBHOOK_URL_PAGERDUTY` | Macroscope webhook ingestion URL for the PagerDuty relay. |
| `MACROSCOPE_WEBHOOK_SECRET_PAGERDUTY` | Shared secret sent as `X-Webhook-Secret`. |
| `PAGERDUTY_API_TOKEN` | PagerDuty REST API token for creating incident notes. |

## Optional env vars <span class="badge-new">NEW</span>

| Var | Default | Purpose |
|---|---|---|
| `PAGERDUTY_WEBHOOK_SECRET` | *(none — accept without verification)* | V3 subscription secret for HMAC-SHA256 signature verification. |
| `PAGERDUTY_FROM_EMAIL` | `ivan@prasso.ai` | PagerDuty `From` header email when posting notes. |
| `API_BASE_URL` | *(derived from request)* | Override the callback URL base. |

## Signature verification <span class="badge-new">NEW</span>

PagerDuty V3 webhooks sign the raw body with HMAC-SHA256 and send one or
more `v1=<hex>` entries in the `X-PagerDuty-Signature` header. When
`PAGERDUTY_WEBHOOK_SECRET` is set, the route validates the signature
using a timing-safe comparison. When unset, the route logs a warning and
accepts the request — this matches the Sentry webhook's dev behavior and
allows the demo to work before a subscription is wired.

## Route reference <span class="badge-new">NEW</span>

See the full request/response specs in the
[API routes reference](../api/routes.md#pagerduty-webhook-inbound--apiapisrcroutespagerdutywebhookts-).
