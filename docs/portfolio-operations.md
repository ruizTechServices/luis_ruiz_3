# Using and maintaining luis-ruiz.com

This site has three jobs: help prospective clients understand Gio’s work, show useful projects and writing, and provide a private place to manage that work.

## The daily routine

Open [your dashboard](https://luis-ruiz.com/dashboard) and sign in with Gio’s existing account. Publishing and site administration are reserved for the verified owner; another signed-in account does not receive those permissions.

1. **Check inquiries.** Open **Review inquiries** or [the inbox](https://luis-ruiz.com/admin/contactlist). Read new project notes and reply using your usual email application. The site stores submissions; it does **not** send email notifications or replies.
2. **Choose a next action.** Review working projects and open tasks. Put one concrete next step in a working project’s **Next action** field so it appears on the dashboard tomorrow.
3. **Capture useful work.** Write a private journal entry, save a story draft, or improve one portfolio description. Describe what actually happened, including limitations.
4. **Keep the public promise accurate.** Update availability when your capacity changes. Check the public page after publishing or changing a project.

Dashboard **Stories** includes drafts and published stories. **Total inquiries** is the total stored, not an unread count. **Public projects** counts public portfolio records; **Working projects** is your separate private work tracker. Failed counts display **Unavailable** instead of zero.

## Write and publish a story

Both the dashboard and its [saved links page](https://luis-ruiz.com/dashboard/links) have a **Write a story** shortcut.

1. Open [Your stories](https://luis-ruiz.com/dashboard/write), then **Write a story**.
2. Add a title, subtitle, and body. Formatting buttons insert Markdown for headings, emphasis, links, quotes, lists, and code. Add topics separated by commas and sources when useful.
3. Use **Preview** to check the result.
4. Select **Save draft** to store private writing in Supabase, or **Publish** to make the story public.
5. Return to an existing story to **Update story**. **Unpublish** moves a published story back to a private draft after confirmation.

**Saving is explicit; there is no autosave or offline recovery.** Wait for the saved confirmation before closing the tab. Navigation warnings help, but mobile browsers can close without warning. If saving fails, keep the tab open and copy important unsaved text somewhere safe. If another tab saved the story first, the editor refuses the stale update and asks you to reload after preserving your writing.

Published stories appear on the blog and are eligible for the homepage, sitemap, and [RSS feed](https://luis-ruiz.com/feed.xml). Drafts are excluded from public reads. The [blog administration page](https://luis-ruiz.com/admin/blog-posts) also links to story management.

## Add an image

Open the image button in the editor toolbar, or **Your images** on dashboard links. The editor shortcut opens in a separate tab so your unsaved writing stays in place. Upload a static JPEG, PNG, or WebP up to 3 MB. The site converts uploads to WebP and stores them in the existing Supabase `photos` bucket. Uploads use unique names and do not overwrite existing files.

Use **Copy story image** to get Markdown, paste it into the story body, and replace the image description with useful alt text. Use **Copy URL** for a project's cover image field. The media page also lists the existing `hero` folder separately, without moving its files.

**Images in this bucket are public, even when used in a private draft.** Only upload images intended for publication. Draft privacy protects the story record, not the public URL of an uploaded image.

## Manage the rest of the site

| What you need | Where to go | What to check |
| --- | --- | --- |
| Portfolio projects | `/admin/projects` | Clear problem, your role, actual approach and outcome, accurate status, working demo/repository links, suitable cover image. Use `visibility = public` only for work intended for visitors. |
| Availability | `/admin/site-settings` | Keep the availability setting and its wording consistent with your capacity. |
| Client inquiries | `/admin/contactlist` | Name, reply address, requested help, message, and optional budget/timeline. Reply outside the site. |
| Private project tracking | `/dashboard/projects` | Status, priority, links, and a concrete next action. This does not automatically create a public portfolio project. |
| Clients and opportunities | `/dashboard/clients`, `/dashboard/leads` | Keep contact records and follow-up notes current. |
| Tasks and private notes | `/admin/todos`, `/admin/journal` | Record progress and capture ideas without publishing them. |
| Personal shortcuts | `/dashboard/links` | Maintain saved URLs to frequently used tools and project resources. |
| Story and project images | `/dashboard/media` | Upload public images, browse existing photos, and copy URLs or story Markdown. |
| Money and decisions | `/dashboard/money`, `/dashboard/decisions` | Record entries and reasoning; these are manual records, not bank integrations. |

Publish evidence visitors can inspect: working links, a concise explanation, screenshots where useful, and honest outcomes. Avoid invented client results, revenue, testimonials, or experience claims. A redesign and search metadata alone do not guarantee more visitors or clients; share useful published work and follow up on real inquiries.

## Source and infrastructure

- **Repository:** [ruizTechServices/luis_ruiz_3](https://github.com/ruizTechServices/luis_ruiz_3). This is the source for this portfolio; do not substitute another similarly named repository.
- **Production origin:** `https://www.luis-ruiz.com` (the apex domain redirects here).
- **Database and authentication:** existing Supabase project `huyhgdsjpdjzokjwaspb` (`luis-ruiz`). Keep the existing account, tables, and owner authorization. Do not create a replacement project to fix an access problem.
- **Hosting:** the connected Vercel project deploys this GitHub repository. Confirm the configured production branch and deployed commit in Vercel for each release.
- **Shared database boundary:** the `posts` table belongs to another website. Do not read, modify, or delete it while maintaining this portfolio.

Required environment variables are `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Set `NEXT_PUBLIC_SITE_URL=https://www.luis-ruiz.com` for production. Keep `.env.local` and secrets out of Git. Never place a Supabase secret or service-role key in a `NEXT_PUBLIC_` variable.

Optional Ollama settings support the existing authenticated AI API routes; they are not needed to write stories, receive inquiries, or manage projects. Their availability depends on a reachable configured backend.

## Run and check a change

From the repository root, after configuring `.env.local`:

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`. Stop the development server before running the release checks:

```bash
npm run lint
npx tsc --noEmit
npm run test:auth
npm run build
npm run test:sitemap
npm run start
```

`test:auth` checks source wiring; it does not sign in through a browser. `test:sitemap` checks route coverage and inspects generated XML when present. Neither replaces a real owner session or public-page verification.

Before release, check desktop and mobile navigation, project links, published story rendering, contact validation, and private-route protection. Use a clearly labeled contact verification only when you can identify and remove its resulting record.

## Deploy and recover

1. Keep the change on a Git branch, run the checks above, and inspect its Vercel preview.
2. Confirm production environment variables reference the existing Supabase project and production origin.
3. When schema changes are included, review the matching migration and rollback file. Apply changes to the intended database in the release’s documented order; a Git push alone does not apply Supabase SQL migrations.
4. Merge or push the reviewed commit to the Vercel project’s configured production branch. Wait for Vercel’s production deployment to become ready.
5. Verify the production domain, deployed commit, public pages, and protected routes. Record the actual deployment result rather than treating a successful push as a successful release.

Prefer a forward repair for database problems. Vercel rollback changes application code; it does **not** restore database data or reverse migrations. A code rollback must remain compatible with the current schema and authorization rules.

The story-publication rollback refuses to run while private drafts exist. Preserve drafts before planning any schema rollback, and do not publish private writing just to get past that guard. The identity/privacy rollback can restore broader access and refuses known exposure cases. Read those files before any rollback; do not remove their guards to force one through.

## Verification still requiring the owner

The initial redesign shipped through [PR #2](https://github.com/ruizTechServices/luis_ruiz_3/pull/2), production commit `599066118f6f554665302e5f4631e50e22938cdb`, on September 7, 2026. Vercel reported the production deployment ready and assigned both domain aliases. Live article rendering, the contact submission and cleanup, robots, sitemap, and RSS were verified. Lint, TypeScript, auth source checks, production build, and sitemap checks passed.

The existing database records the publishing migration as `20260907151735`, the identity/privacy migration as `20260907165454`, and the owner media-listing policy as `20260907171244`. Transactional database tests verified draft isolation, publishing/unpublishing, stale-edit rejection, owner identity, private project visibility, and comment email protection. Media role checks verified owner-only photo metadata listing without changing files. Their synthetic rows were rolled back; the synthetic contact inquiry was separately removed.

At this handoff, verification of the complete flow in Gio’s own signed-in browser remains pending. After signing in, verify dashboard access, saved links, a private draft save/reopen, preview, a deliberate publication/update, and unpublishing. Confirm a separate signed-out browser cannot see the draft. Source checks and database checks alone do not prove the owner’s OAuth browser flow.

The contact honeypot and server validation reduce basic form spam. They are **not** an API rate limiter, and direct database API requests can bypass the form’s honeypot. There is no automatic email sender, newsletter service, or guarantee of traffic growth in this release.
