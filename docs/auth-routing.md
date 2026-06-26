# Authentication And Dashboard Routing

## Current Flow

This app uses Supabase Auth with SSR cookies. The browser stores Supabase auth
cookies, and every request sends those cookies back to Next.js.

Server-side identity is resolved in `lib/auth/session.ts` with
`supabase.auth.getClaims()`. The app uses the verified JWT `sub` claim as the
authenticated user id. It does not trust a user id from route params, query
params, form fields, or client-side state.

## Protected Routes

Protected page prefixes are defined in `lib/auth/routes.ts`.

- `/account`
- `/dashboard`

The root `proxy.ts` delegates to `lib/supabase/proxy.ts`, which checks Supabase
claims before protected pages render. Logged-out users are redirected to
`/login?next=<requested-path>`.

The protected route group `app/(authenticated)/layout.tsx` also calls
`requireUser()`. This keeps route protection server-side and avoids treating a
hidden navbar link as authorization.

Protected API routes under `/api/ai` call `requireApiUser()` inside each route
handler and return `401` when the request has no verified Supabase user.

## Account And Dashboard Routing

The app uses stable protected routes:

- `/account`
- `/dashboard`

There is no `/account/[userId]` or `/dashboard/[userId]` route. Account and
dashboard pages resolve the current user from the verified server-side session.

This prevents insecure direct object references where one user could change a
URL id to request another user's account or dashboard.

## Navigation

Navigation links are defined in `lib/navigation/nav-links.ts`.

`components/navigation/site-navbar.tsx` is a server component. It calls
`getAuthenticatedUser()` and filters links by `visibility`.

- Logged-out users see `Sign in`.
- Logged-in users see `Account` and `Dashboard`.
- Logged-in users do not see `Sign in`.

The navbar is only presentation. It is not the authorization boundary.

## Dashboard Data Isolation

Dashboard reads go through `lib/dashboard/data.ts`, which requires an
`AuthenticatedUser` and filters every dashboard table with:

```ts
.eq("user_id", user.id)
```

The Supabase database also enforces ownership with RLS on every dashboard table:

- `dashboard_projects`
- `dashboard_clients`
- `dashboard_leads`
- `dashboard_money_entries`
- `dashboard_decisions`
- `dashboard_system_links`

Each table has a `user_id uuid default auth.uid()` column and select, insert,
update, and delete policies scoped to `(select auth.uid()) = user_id`.

Child dashboard tables with references to projects or clients also check that
referenced rows belong to the same authenticated user.

## Supabase Migrations

These migrations were applied to the `luis-ruiz` Supabase project:

- `20260626214240_secure_dashboard_user_ownership`
- `20260626214309_tighten_dashboard_table_grants`

The first migration added dashboard ownership columns, indexes, foreign keys,
and RLS policies. The second migration tightened table grants so `authenticated`
only has `select`, `insert`, `update`, and `delete` on dashboard tables.

## Verification

Static and build checks:

```bash
npm run test:auth
npm run lint
npm run build
```

Logged-out runtime checks against a running dev server:

```bash
curl -i http://localhost:3000/account
curl -i http://localhost:3000/dashboard
curl -i http://localhost:3000/api/ai/health
```

Expected logged-out behavior:

- `/account` redirects to `/login?next=%2Faccount`
- `/dashboard` redirects to `/login?next=%2Fdashboard`
- `/api/ai/health` returns `401`

Logged-in browser behavior still needs to be verified with a real browser
session after Google OAuth, because the server's authenticated cookies live in
the user's browser.
