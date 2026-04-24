---
sidebar_position: 2
---

# LaunchDarkly

LaunchDarkly is used on the **web** side only. The API does not read
feature flags.

## Wiring

`apps/web/src/main.tsx` wraps the whole app in an LD provider resolved
asynchronously before first render:

```tsx
import { asyncWithLDProvider } from "launchdarkly-react-client-sdk";

const LD_CLIENT_ID =
  import.meta.env.VITE_LD_CLIENT_ID ?? "69deb82234109a0a96db7e43";

async function bootstrap() {
  const LDProvider = await asyncWithLDProvider({
    clientSideID: LD_CLIENT_ID,
    context: {
      kind: "user",
      key: "anonymous",
      anonymous: true,
    },
    options: {
      application: {
        id: "content-studio-web",
        version: import.meta.env.VITE_RELEASE_SHA ?? "dev",
      },
    },
    // Avoid waiting on streaming connection before first render.
    timeout: 2,
  });

  createRoot(...).render(<LDProvider><BrowserRouter><App /></BrowserRouter></LDProvider>);
}
```

Things to know:

- **Client-side ID in source is intentional.** `69deb82234109a0a96db7e43`
  is a LaunchDarkly **client-side** ID — it's public by design, scoped to
  one LD environment, and safe to commit. `VITE_LD_CLIENT_ID` lets you
  override it per environment (staging, dev, etc.).
- **Context is anonymous.** Every user appears to LD as `anonymous`.
  There is no per-user targeting today; flags are either on for
  everyone hitting this env or off for everyone.
- **`timeout: 2` seconds** — the provider resolves after 2s even if the
  streaming connection isn't up, so first paint isn't blocked on
  LaunchDarkly availability.
- **`application.version` is the commit SHA.** Passed through as
  `VITE_RELEASE_SHA`, which Railway bakes in at build time. This lets
  you slice LD analytics by release.

### Non-LD flag seam

`apps/web/src/lib/flags.ts` exports a separate `useFlag(key, default)`
hook that reads from `localStorage` with keys prefixed `flag:`. It was
the Phase-2 stand-in before LaunchDarkly landed and is **not** wired to
the LD client today. If you see `useFlag(...)` in the codebase, that's
the localStorage seam; the LD client is accessed via
`useFlags()` / `useLDClient()` from `launchdarkly-react-client-sdk`.

## Consuming a flag

Flags are read with `useFlags()`. LD client-side SDKs **camelCase** flag
keys by default, so the LaunchDarkly key `demo-error-trigger-button`
becomes `demoErrorTriggerButton` in code.

`apps/web/src/components/InviteTeammateButton.tsx`:

```tsx
import { useFlags } from "launchdarkly-react-client-sdk";
import { InviteTeammateModal } from "./InviteTeammateModal";

export function InviteTeammateButton() {
  const flags = useFlags();
  const enabled = Boolean(flags["demoErrorTriggerButton"]);
  const [open, setOpen] = useState(false);

  if (!enabled) return null;

  return (
    <>
      <button onClick={() => setOpen(true)}>Invite Teammate</button>
      {open && <InviteTeammateModal onClose={() => setOpen(false)} />}
    </>
  );
}
```

## The `demo-error-trigger-button` flag

This is the one flag the app checks today. It gates the **Invite
Teammate** entry point in the sidebar, which is the demo's entry into
the intentional Sentry error.

| Property | Value |
|---|---|
| LD key | `demo-error-trigger-button` |
| Key in code (camelCase) | `demoErrorTriggerButton` |
| Type | Boolean |
| Default when unresolved | `false` (the `Boolean(flags["…"])` coercion makes `undefined` → `false`) |
| Controls | Whether `<InviteTeammateButton>` renders (it returns `null` when off) |
| Demo flow | Flag on → user clicks the button → `POST /api/invites` → server throws on a null SSO profile → Sentry captures → `/api/webhooks/sentry` forwards to Macroscope |

See [Sentry](./sentry.md) for the full error-capture flow and
[API routes → Invites](../api/routes.md#invites--appsapisrcroutesinvitests)
for the endpoint spec.

## Env vars it reads

- `VITE_LD_CLIENT_ID` — override the hardcoded client-side ID. Optional.
- `VITE_RELEASE_SHA` — passed as `application.version`. Optional.

Full list on the [Env vars page](../getting-started/env-vars.md).

## The `slack-ticket-notifications` flag <span class="badge-new">NEW</span>

Gates the **Slack Notifications** button in the sidebar. When off, the
Slack integration UI is hidden; the API routes still exist but there is
no way to configure them from the frontend.

| Property | Value |
|---|---|
| LD key | `slack-ticket-notifications` |
| Key in code (camelCase) | `slackTicketNotifications` |
| Type | Boolean |
| Default when unresolved | `false` (`Boolean(flags["…"])` coercion makes `undefined` → `false`) |
| Controls | Whether `<SlackIntegrationButton>` renders in the sidebar |

See [Slack ticket notifications](./slack.md) for the full integration
guide.
