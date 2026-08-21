# luis-ruiz

Luis Giovanni Ruiz's ("Gio") personal website: a public portfolio, blog, and
contact form, plus a private authenticated admin console and per-user
business dashboard. Built with Next.js (App Router) and Supabase.

## Prerequisites

- Node.js `>=20.9.0`
- npm
- A Supabase project (URL + publishable API key)

## Install

```bash
npm install
```

Create `.env.local` in the project root with the following variables
(see `.devin`/project docs for where to obtain values — never commit actual
values):

**Required**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

**Optional**
- `NEXT_PUBLIC_SITE_URL` — production origin used by the sitemap (falls back
  to `SITE_URL`, then Vercel env vars, then a hardcoded default)
- `SITE_URL`
- `OLLAMA_BASE_URL`, `OLLAMA_CHAT_MODEL`, `OLLAMA_EMBED_MODEL`,
  `EMBEDDING_PROFILE_ID` — used by the `/api/ai/*` routes

## Scripts

```bash
npm run dev          # start the dev server at http://localhost:3000
npm run build        # production build
npm run start         # run the production build
npm run lint          # eslint
npm run test:auth     # verify the auth/routing wiring (scripts/verify-auth-flow.mjs)
npm run test:sitemap  # verify the sitemap (scripts/verify-sitemap.mjs) — run AFTER npm run build
```

## Learn more

- `AGENTS.md` is the source of truth for project architecture, conventions,
  and current state — read it before making changes.
- `docs/` has deeper-dive notes (auth routing, sitemap maintenance, recent
  considerations).
- `CLAUDE.md` is a thin pointer to `AGENTS.md`.
