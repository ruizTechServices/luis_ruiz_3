# Sitemap Maintenance Guide

This project should expose one production sitemap from `app/sitemap.ts`, served by
Next.js at `/sitemap.xml`.

Current status: `app/sitemap.ts` is the Next.js metadata route, and
`lib/seo/sitemap.ts` is the implementation. Keep those files as the single
source of truth for all indexable URLs.

## Core Rule

Only include public, indexable, canonical pages.

Never include:

- `/admin/*`
- `/dashboard/*`
- `/account`
- `/login`
- `/auth/*`
- `/api/*`
- Any route behind `requireUser()`, `requireGioAdmin()`, or `requireApiUser()`
- Draft, private, hidden, archived, or test content
- Supabase rows that are not meant for public discovery

If a page requires authentication or should not appear in Google results, it does
not belong in the sitemap.

## Expected Sitemap Shape

Use the Next.js Metadata Route contract:

```ts
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return buildSitemap();
}
```

Each entry should include:

- `url`: absolute canonical URL
- `lastModified`: `Date` where available
- `changeFrequency`: realistic crawl hint
- `priority`: relative importance from `0.1` to `1.0`

## Site Origin

Do not scatter the domain across the file. Centralize it.

Preferred order:

1. `NEXT_PUBLIC_SITE_URL`
2. `SITE_URL`
3. `VERCEL_PROJECT_PRODUCTION_URL`
4. `VERCEL_URL`
5. Production fallback: `https://luis-ruiz.com`

Normalize it by removing a trailing slash before appending paths.

Current helper:

```ts
import { absoluteUrl, getSiteUrl } from "@/lib/seo/site-url";
```

For production, set `NEXT_PUBLIC_SITE_URL=https://luis-ruiz.com`.

## Current Public Route Inventory

These are the public route families that can belong in the sitemap:

- `/`
- `/projects`
- `/projects/[slug]`
- `/blog`
- `/blog/[id]`
- `/contact`
- `/sitemap`

These are not sitemap routes:

- `(authenticated)` route group pages
- `/admin/*`
- `/dashboard/*`
- `/account`
- `/login`
- `/auth/callback`
- `/api/ai/*`

Route groups such as `(authenticated)` do not appear in the public URL, but the
pages inside that group are still private and must stay out of the sitemap.

## Adding A Static Public Page

When a new public static page is created, for example `app/about/page.tsx`:

1. Confirm it is public and indexable.
2. Add the path to `STATIC_ROUTES` in `lib/seo/sitemap.ts`.
3. Assign priority and change frequency from the table below.
4. Add broadly useful utility pages to the global footer, not the primary navbar.
5. Run verification commands.

Suggested static route table:

| Route type | Priority | Change frequency |
| --- | ---: | --- |
| Home page | `1.0` | `weekly` |
| Top-level public index, like `/projects` or `/blog` | `0.8` | `weekly` |
| Conversion/contact page | `0.7` | `monthly` |
| Supporting static page | `0.5` | `monthly` |
| Legal/utility page, if public | `0.3` | `yearly` |

Do not inflate every page to priority `1.0`. That makes the sitemap less useful.

## Adding A Dynamic Supabase Page

When a new public dynamic route is created, add a database-backed sitemap section
only after the route has a stable canonical URL.

No code change is needed when adding normal content to the existing public
collections:

- A public project in Supabase `projects` with `visibility = 'public'` and a
  valid `slug`.
- A blog post in Supabase `blog_posts`.
- A project cover image URL in `projects.cover_image_url`.

Those rows are already read by `lib/seo/sitemap.ts`, and `/sitemap.xml` is
revalidated every hour.

The human-readable `/sitemap` page also consumes `lib/seo/sitemap.ts`, so the
same update feeds both the crawler XML and the frontend directory.

Examples in this repo:

- `projects.slug` maps to `/projects/${slug}`
- `blog_posts.id` maps to `/blog/${id}`

Dynamic sitemap rules:

1. Query only the columns needed for URLs and freshness.
2. Filter to public rows only.
3. Exclude rows with missing route keys.
4. Use `updated_at` when available, otherwise `created_at`.
5. Map each row to a canonical absolute URL.
6. Keep the query server-only. Do not use client-side Supabase in `sitemap.ts`.

For projects, the sitemap query should filter:

```ts
.from("projects")
.select("slug, updated_at, created_at")
.eq("visibility", "public")
.not("slug", "is", null)
```

For blog posts, use the current route shape:

```ts
.from("blog_posts")
.select("id, updated_at, created_at")
```

If blog posts later get slugs, update both the public route and sitemap together.
Do not emit both `/blog/123` and `/blog/my-post` for the same content unless one
is canonicalized away.

## Adding A New Content Collection

For a new public collection, such as `/case-studies/[slug]`:

1. Add the public page route.
2. Add or reuse a Supabase query that returns only public rows.
3. Add a mapper in `lib/seo/sitemap.ts`.
4. Confirm all generated URLs return `200` for anonymous users.
5. Confirm private/admin rows are excluded.
6. Run `npm run lint` and `npm run build`.

The sitemap should fail closed. If the query errors, return the known static
routes rather than throwing the whole sitemap route in production, unless you
intentionally want search visibility to fail loudly.

## Removing Or Renaming A Page

When deleting or renaming a public route:

1. Remove the old path from `app/sitemap.ts`.
2. Add a redirect if the old URL had public traffic.
3. Confirm the old URL no longer appears in `/sitemap.xml`.
4. Resubmit the sitemap in Google Search Console after deployment if the change
is significant.

Do not keep dead URLs in the sitemap hoping crawlers will figure it out. That
wastes crawl budget and creates noisy coverage reports.

## Freshness Rules

Use `lastModified` only when it means something.

Good sources:

- `updated_at`
- `published_at`
- `created_at` as fallback

Avoid:

- `new Date()` for every entry on every request
- Random build time for unchanged content
- Timestamps from private moderation tables

Using `new Date()` everywhere tells crawlers every page changed constantly. That
is low-quality SEO signaling.

## Priority Rules

Suggested priorities:

| URL family | Priority |
| --- | ---: |
| `/` | `1.0` |
| `/projects` | `0.85` |
| `/projects/[slug]` | `0.75` |
| `/blog` | `0.8` |
| `/blog/[id]` | `0.65` |
| `/contact` | `0.7` |

Adjust only when the business value of the page changes.

## Verification Checklist

After changing `app/sitemap.ts`, `lib/seo/sitemap.ts`, URL helpers, or public
routes, run:

```bash
npm run lint
npm run build
npm run test:auth
npm run test:sitemap
```

If a dev server is already running, manually inspect:

```bash
curl -s http://localhost:3000/sitemap.xml
```

Check for:

- Absolute URLs only
- No duplicate URLs
- No private routes
- No `localhost` URLs in production
- Dynamic project URLs use slugs, not IDs
- Dynamic blog URLs match the actual route shape
- Dates are valid ISO timestamps in the generated XML

Do not start the dev server from an automation session unless Gio explicitly
asks for it. If needed, Gio can run:

```bash
npm run dev
```

## Deployment Checklist

Before merging:

1. `npm run lint` passes.
2. `npm run build` passes.
3. `npm run test:sitemap` passes.
4. `/sitemap.xml` does not list private routes.
5. The production domain is configured through env or fallback.
6. Any new dynamic collection filters out non-public rows.

After deployment:

1. Visit `https://luis-ruiz.com/sitemap.xml`.
2. Confirm the XML loads without auth.
3. Submit or refresh the sitemap in Google Search Console.

## Common Mistakes

- Adding `/admin` because it is an important page. It is private; keep it out.
- Adding `/dashboard` because authenticated users use it. It is private; keep it
  out.
- Emitting Supabase rows without checking `visibility = "public"`.
- Using `new Date()` as `lastModified` for every URL.
- Forgetting that route groups do not affect URLs.
- Forgetting to update the sitemap after adding a new public dynamic route.
- Keeping deleted URLs in the sitemap after a cleanup.

## Commit Checklist

When a PR or commit adds public pages, include sitemap maintenance in the same
change unless there is a deliberate reason not to.

Use this checklist:

- New public static page? Add it to static sitemap routes.
- New public dynamic page? Add a filtered dynamic sitemap query.
- New private page? Do nothing in the sitemap.
- New utility page should appear globally? Prefer `components/navigation/site-footer.tsx`.
- New primary destination should appear in navigation? Add it to
  `lib/navigation/nav-links.ts` with `visibility: "always"` only when it belongs
  beside Home, Blog, Projects, and Contact.
- Route renamed? Remove old URL and add redirect if needed.
- Content source changed? Re-check `lastModified` field selection.

## Verification Script

`scripts/verify-sitemap.mjs` is a guardrail, not an auto-writer. It:

- Scans `app/**/page.tsx` for public static pages.
- Excludes private route groups and private prefixes.
- Compares public static routes against `STATIC_ROUTES` in
  `lib/seo/sitemap.ts`.
- After `npm run build`, checks `.next/server/app/sitemap.xml.body` for empty,
  duplicate, private, or localhost URLs.

Run it after the build so the XML artifact exists:

```bash
npm run build
npm run test:sitemap
```
