---
sidebar_position: 3
---

# Payments API <span class="badge-new">NEW</span>

The Payments API is a standalone Hono service at `apps/payments-api`. It
handles charge creation with idempotent replay and persists to its own
Postgres database.

## Server overview <span class="badge-new">NEW</span>

| Property | Value |
|---|---|
| Entrypoint | `apps/payments-api/src/index.ts` |
| Default port | `3002` |
| Railway service | Dedicated service with `apps/payments-api/railway.toml` |
| Database | Postgres (`charges` and `charge_idempotency` tables) |

## Logging <span class="badge-new">NEW</span>

Pino multistream outputs to:

1. **stdout** — standard structured JSON logs.
2. **Google Cloud Logging** — log name `payments-api` with `global`
   resource and entry-level severity.

Requires `GOOGLE_APPLICATION_CREDENTIALS` pointing to a GCP service-account
JSON file. `GCP_PROJECT_ID` can override the project ID; otherwise it falls
back to the `project_id` in the service-account key.

## Routes <span class="badge-new">NEW</span>

### `GET /health`

Liveness check for Railway healthchecks.

**Response 200:**
```json
{ "status": "ok", "service": "payments-api", "release": "<sha|null>" }
```

Note: this route does **not** use the standard `ApiResponse<T>` envelope.

---

### `POST /charge` <span class="badge-new">NEW</span>

Create a charge. Idempotent — re-submitting the same `idempotencyKey`
returns the original charge instead of creating a duplicate.

**Request body:**
```ts
{
  amount: number;         // positive integer (cents)
  currency: string;       // e.g. "usd"
  customerId: string;     // customer identifier
  idempotencyKey: string; // client-generated unique key
}
```

**Response 200/201:**
```json
{
  "id": "charge_abc123",
  "amount": 1000,
  "currency": "usd",
  "status": "pending"
}
```

- **201** — new charge created and persisted to the `charges` table.
- **200** — idempotent replay; the existing charge for the given
  `idempotencyKey` is returned from `charge_idempotency`.

**Validation errors (400):** returned when required fields are missing or
have invalid types.

## Database schema <span class="badge-new">NEW</span>

Migrations add two tables:

| Table | Purpose |
|---|---|
| `charges` | Stores charge records (`id`, `amount`, `currency`, `customer_id`, `status`, timestamps). |
| `charge_idempotency` | Maps `idempotency_key` → `charge_id` to enable replay. |
