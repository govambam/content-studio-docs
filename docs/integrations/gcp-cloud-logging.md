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
| `GOOGLE_APPLICATION_CREDENTIALS_JSON` | optional | Full JSON of the GCP service-account key, supplied as a string. Use this on platforms like Railway that don't provide a writable secrets path. Takes precedence over `GOOGLE_APPLICATION_CREDENTIALS` when both are set. If the value is not valid JSON, GCP log shipping is disabled and a warning is printed. |
| `GOOGLE_APPLICATION_CREDENTIALS` | optional | Path to a GCP service-account JSON key file. Used as a fallback when `GOOGLE_APPLICATION_CREDENTIALS_JSON` is not set. Suitable for local dev via `gcloud auth` or a mounted secret. |
| `GCP_PROJECT_ID` | optional | Overrides the GCP project ID. If omitted, the client library infers it from the credentials. |
| `LOG_LEVEL` | optional | Pino log level (`debug`, `info`, `warn`, `error`). Defaults to `info` in production, `debug` otherwise. |

### Credential resolution order <span class="badge-new">NEW</span>

1. If `GOOGLE_APPLICATION_CREDENTIALS_JSON` is set, its value is parsed as JSON and used directly as credentials. If parsing fails, GCP log shipping is disabled.
2. Otherwise, if `GOOGLE_APPLICATION_CREDENTIALS` is set, it is used as a key-file path.
3. If neither variable is set, GCP log shipping is disabled and only stdout logging is active.

## Local development <span class="badge-new">NEW</span>

Locally you can omit both credential variables. The logger will print
`[logger] no GOOGLE_APPLICATION_CREDENTIALS_JSON or GOOGLE_APPLICATION_CREDENTIALS set; GCP log shipping disabled`
to stderr and write only to stdout.
