<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Known architectural constraints

Findings from the Aug 2026 Next 16 audit that were deliberately **not** changed.
Read this before "fixing" any of them — each one is a decision, not an oversight.

## No route is prerendered

`src/app/layout.tsx` calls `getLocale()`, which resolves through
`src/i18n/request.ts` → `await cookies()`. Reading a request API in the **root**
layout marks the entire tree dynamic, so every route — including the data-free
marketing landing page — is server-rendered on every request. Confirmed against
`.next/prerender-manifest.json`: only `/robots.txt` and `/sitemap.xml` are static.

Fixing this means moving to a `[locale]` route segment with
`generateStaticParams()` + `setRequestLocale()`, and demoting the cookie to a
proxy-level redirect. Large blast radius (every route, every link, the proxy
matcher); deferred on purpose.

## The Next server holds no credential, so it cannot fetch data

The access token lives in a module-level variable in `src/lib/api.ts` (browser
memory only) and the refresh cookie is host-only on the **backend** origin
(`backend_lead/app/api/v1/auth.py`). The browser therefore talks to FastAPI
directly via `NEXT_PUBLIC_API_URL`, and the Next server has nothing to
authenticate with.

Consequences, all intentional for now:

- No `prefetchQuery` / `HydrationBoundary` anywhere. Every route is
  shell → JS boot → 401 → refresh → real fetch.
- A cold load of `/dashboard` fires ~9 queries with no `Authorization` header,
  all 401, all funnel into the (correctly deduped) `refreshAccessToken()`, then
  all re-fire. Fixable on its own with a bootstrap refresh in `providers.tsx`
  before rendering children.
- Moving to a BFF route handler (`app/api/backend/[...path]/route.ts` forwarding
  to a server-only `API_URL`) would fix all of the above and remove CORS, but
  needs backend cookie-domain coordination.

`src/lib/api.ts` imports `client-only` for this reason: the module-level token
would otherwise be shared across concurrent users if it were ever imported from
a Server Component.

## `logged_in` is a UX hint, not a security boundary

`src/proxy.ts` gates `/dashboard/*` on a cookie that `src/lib/api.ts` writes
from JS, so anyone can forge it — they just land on a dashboard that immediately
401-bounces them back to `/login`. This matches the Next guidance that proxy
"should not be used as a full session management or authorization solution"
(`node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`). The real
gate is the backend rejecting every unauthenticated `/api/v1` call.

## API responses are not validated

`zod` is used only for form input (`connection-config-fields.tsx`). Every
response is cast through `apiFetch<T>`'s `as T`. `parseBody` now rejects
non-JSON bodies, and the shared `asList` in `src/lib/api/_shared.ts` logs
unrecognized shapes, but per-response `z.infer` schemas remain future work.

## Other open items

- `typedRoutes` is off in `next.config.ts`. The three footer legal links
  (`/privacy-policy`, `/terms-of-service`, `/data-deletion`) now exist under
  `src/app/(marketing)/`, so the original blocker is gone — enabling it just
  needs a build to confirm no other link is untyped.
- The settings page calls `PATCH /me`, `POST /me/password`, `POST /me/image` and
  `POST /me/telegram-connect-token`. The backend only implements `GET /me` —
  those four actions 404 today.
- `useTranslations("connections.facebook")` in
  `components/connections/facebook-sources.tsx` and
  `facebook-callback-view.tsx` points at a namespace that does not exist in
  `messages/*.json`.
- `messages/*.json` carries unused namespaces: `marketing` (~7 KB), `orders`,
  `pacing`, `validation`, `dateRange`.
- `src/components/ui/*` (shadcn) is mostly gone; the six survivors
  (`alert-dialog`, `badge`, `button`, `card`, `dropdown-menu`, `skeleton`,
  plus `sonner`) are used only by `connections/facebook-sources.tsx`,
  `integrations/meta.tsx` and `connections/facebook-callback-view.tsx`.
  `src/components/yb/*` is the real design system. Porting those three files
  needs a `yb` dropdown, which does not exist yet.

# i18n message slicing

`src/app/layout.tsx` ships only the shared namespaces (`common`, `nav`,
`navigation`). Routes needing more wrap their tree in `<RouteMessages
namespaces={[...]}>` (`src/i18n/route-messages.tsx`). Nested
`NextIntlClientProvider`s **replace** rather than merge, which is why
`pickMessages` always re-includes the shared set.

If you add a `useTranslations("x")` call to a client component, add `"x"` to the
`namespaces` of every route that renders it, or `t()` will throw at runtime.
