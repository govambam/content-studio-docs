---
sidebar_position: 3
---

# GCP Cloud Logging <span class="badge-new">NEW</span>

The payments API ships structured logs to Google Cloud Logging in addition
to stdout. This is configured in `apps/payments-api/src/lib/logger.ts`.

## How it works <span class="badge-new">NEW</span>

The logger uses `pino.multistream` to write every log entry to two
destinations simultaneously:

1. **stdout** — standard pino JSON output, consumed by Railway's log
   viewer.
2. **GCP Cloud Logging** — via `@google-cloud/logging`. Entries are
   written to a log named `payments-api` with the resource type `global`.

Pino log levels are mapped to GCP severity:

| Pino level | GCP severity |
|---|---|
| `fatal` (60) | `CRITICAL` |
| `error` (50) | `ERROR` |
| `warn` (40) | `WARNING` |
| `info` (30) | `INFO` |
| `debug` / `trace` | `DEBUG` |

## Env vars <span class="badge-new">NEW</span>

| Var | Required? | Purpose |
|---|---|---|
| `GOOGLE_APPLICATION_CREDENTIALS` | optional | Path to a GCP service-account JSON key file. When absent, GCP log shipping is disabled and a warning is printed to stderr. |
| `GCP_PROJECT_ID` | optional | Overrides the GCP project ID. If omitted, the client library infers it from the credentials file. |
| `LOG_LEVEL` | optional | Pino log level (`debug`, `info`, `warn`, `error`). Defaults to `info` in production, `debug` otherwise. |

## Local development <span class="badge-new">NEW</span>

Locally you can omit `GOOGLE_APPLICATION_CREDENTIALS`. The logger will
print `[logger] GOOGLE_APPLICATION_CREDENTIALS not set; GCP log shipping disabled`
to stderr and write only to stdout.
