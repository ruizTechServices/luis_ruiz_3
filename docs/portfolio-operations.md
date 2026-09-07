# Using and maintaining luis-ruiz.com

This site has three jobs: help prospective clients understand Gio’s work, show useful projects and writing, and provide a private place to manage that work.

## The daily routine

Open [your dashboard](https://luis-ruiz.com/dashboard) and sign in with Gio’s existing account. Publishing and site administration are reserved for the verified owner; another signed-in account does not receive those permissions.

1. **Check inquiries.** Open **Review inquiries** or [the inbox](https://www.luis-ruiz.com/dashboard/inquiries). Start with new inquiries and overdue follow-ups. Read the submitted message, use **Reply by email**, then save a status, next date, and private notes.
2. **Choose a next action.** Review working projects and open tasks. Put one concrete next step in a working project’s **Next action** field so it appears on the dashboard tomorrow.
3. **Capture useful work.** Write a private journal entry, save a story draft, or improve one portfolio description. Describe what actually happened, including limitations.
4. **Keep the public promise accurate.** Update availability when your capacity changes. Check the public page after publishing or changing a project.

Dashboard **Stories** includes drafts and published stories. **Active inquiries** counts New, Contacted, and Qualified records. **New inquiries** means the saved workflow status is New; opening a message does not mark it read or change its status. **Public projects** counts public portfolio records; **Working projects** is your separate private work tracker. Failed counts display **Unavailable** instead of zero.

## Capture inquiries and follow up

The [inquiry inbox](https://www.luis-ruiz.com/dashboard/inquiries) is reserved for the verified owner. The earlier `/admin/contactlist` URL redirects here. Submitted identity, message, and source attribution remain read-only; status, private notes, and follow-up date are editable.

| Status or view | Meaning |
| --- | --- |
| New | Waiting for your review or first reply. |
| Contacted | You have replied and are keeping the conversation open. |
| Qualified | You consider the opportunity a suitable prospect. This is a manual decision. |
| Won | The conversation resulted in work; set this yourself after agreement. |
| Lost | The opportunity is closed without work. |
| Spam | The submission is unwanted. It stays in the archive. |
| Active | New, Contacted, and Qualified inquiries, with scheduled follow-ups first. |
| Follow-ups due | Active inquiries whose scheduled instant has passed. Won, Lost, and Spam are excluded. |

**Reply by email** opens your email application and does not send a message or change status. **Save follow-up** persists the status, notes, and date together. Dates use the browser's local time zone and are stored as a specific instant. Clear the date to remove a schedule. Concurrent edits are guarded by the last saved timestamp; preserve your notes and reload if another tab changed the inquiry.

The public contact flow uses the `site-inquiries` Supabase function, server validation, a honeypot, bounded requests, duplicate detection, and persistent per-network/per-email rate limits. The database accepts new public inquiries only through this ingestion path after the lockdown migration. Direct anonymous inserts are revoked; the owner can update only workflow columns. These controls reduce abuse without promising a spam-free inbox.

### Email alerts and pending setup

The inbox **Email alerts** panel reports configuration, queued alerts, provider acceptance, and messages needing review. An alert contains a private inbox link and goes only to the verified owner email; it does not send the client's message to the email provider. Tests also count in the activity totals.

**Provider setup is still required until the panel reports configured and a test succeeds.** Add `RESEND_API_KEY` and `INQUIRY_ALERT_FROM` as secrets on the existing Supabase project's functions after verifying the sender domain in Resend. These are server secrets, never public environment variables. No replacement Supabase project or auth provider is needed.

After setup, choose **Refresh status**, then **Send me a test**, and verify that the email arrives. The automatic worker normally processes due alerts every minute; **Process due alerts** is an owner-triggered retry of eligible queued work. Provider acceptance means the sending service received the request, not confirmed inbox delivery. Messages with uncertain outcomes or exhausted retries are held for review rather than blindly resent. Correct credentials or sender configuration and inspect provider logs when the panel reports attention is needed.

Inquiries are saved even when email is unavailable. Queued inquiries from this feature can be processed after setup; older inquiries do not receive retroactive alerts. The site does not send automatic replies to prospective clients or subscribe them to a newsletter.

## Measure attention and inquiries

Open [Site insights](https://www.luis-ruiz.com/dashboard/insights) for 7-, 30-, or 90-day views. The report separates public page views, case-study views, measured inquiries, source pages, sound starts, and estimated soundboard returns. Counts begin with this measurement release; historical visitor data is not invented or imported.

- **Pages before an inquiry** uses the last measured public page in the same browser tab within 30 minutes. Direct or unattributed submissions use `/contact`. It suggests interest; it does not prove that a page caused a sale.
- **Estimated later-day returns** uses a date stored in the browser when someone revisits the soundboard on another UTC day within 90 days. It is not a count of unique people. Clearing browser storage, using another device, simultaneous tabs, privacy settings, and blocked requests affect it.
- **Sound starts** includes restarts; rapid repetitions may be limited. A click that never starts audio is not intended to count as a successful play.
- **Measured inquiries** can be lower than the full inbox because optional measurement may be disabled. Use the inbox as the authoritative contact record.

Measurement covers signed-out browsers on production public pages. Signed-in use, preview deployments, and private dashboard routes are excluded. Do Not Track, Global Privacy Control, and the visitor's **Allow anonymous visit counts** preference are honored. No persistent visitor identifier is sent. Daily public-path aggregates are retained for 90 days; short-lived security counters help limit abuse. Automated traffic and blocked requests can still affect totals. Review patterns and real inquiries together before deciding which project or story to improve.

## Write and publish a story

Both the dashboard and its [saved links page](https://luis-ruiz.com/dashboard/links) have a **Write a story** shortcut.

1. Open [Your stories](https://luis-ruiz.com/dashboard/write), then **Write a story**.
2. Add a title, subtitle, and body. Formatting buttons insert Markdown for headings, emphasis, links, quotes, lists, and code. Add topics separated by commas and sources when useful.
3. Use **Preview** to check the result.
4. Select **Save draft** to store private writing in Supabase, or **Publish** to make the story public.
5. Return to an existing story to **Update story**. **Unpublish** moves a published story back to a private draft after confirmation.

**Saving to your account is explicit; browser recovery runs as you write.** The editor keeps a recovery copy on this browser after a short typing pause and attempts to preserve it when the tab becomes hidden or closes. **Saved on this browser · not your account** is different from a confirmed **Save draft** or **Publish** result.

If you return after a reset, **Writing recovered from this browser** lets you read a copy, **Restore for review**, or **Discard this copy**. Restoring changes the editor only; it does not publish or overwrite the saved story. Copies from other tabs remain separate, and a warning identifies when the saved account version changed. The editor continues to reject stale server updates.

Recovery copies belong to this browser and account and do not sync across devices. They can remain on a device after sign-out; use a private device for private writing. Clearing browser data, private browsing, full storage, or a crash can remove copies or the latest keystrokes. If recovery or saving fails, keep the tab open and copy important writing somewhere safe. Wait for **Saved to your account** before relying on cross-device access.

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
| Client inquiries | `/dashboard/inquiries` | New conversations, due follow-ups, status, private notes, and email alert health. Reply using your email app. |
| Visitor and inquiry insights | `/dashboard/insights` | Compare measured public pages, case studies, inquiry sources, and estimated soundboard returns. |
| Private project tracking | `/dashboard/projects` | Status, priority, links, and a concrete next action. This does not automatically create a public portfolio project. |
| Clients and opportunities | `/dashboard/clients`, `/dashboard/leads` | Keep contact records and follow-up notes current. |
| Tasks and private notes | `/admin/todos`, `/admin/journal` | Record progress and capture ideas without publishing them. |
| Personal shortcuts | `/dashboard/links` | Maintain saved URLs to frequently used tools and project resources. |
| Story and project images | `/dashboard/media` | Upload public images, browse existing photos, and copy URLs or story Markdown. |
| Soundboard collection | `/dashboard/soundboard` | Upload draft clips, preview, publish, rename, reorder, or archive pads. |
| Money and decisions | `/dashboard/money`, `/dashboard/decisions` | Record entries and reasoning; these are manual records, not bank integrations. |

Publish evidence visitors can inspect: working links, a concise explanation, screenshots where useful, and honest outcomes. Avoid invented client results, revenue, testimonials, or experience claims. A redesign and search metadata alone do not guarantee more visitors or clients; share useful published work and follow up on real inquiries.

## Keep case studies supported by evidence

The Catherine Ruiz, ruizTechServices, and soundboard case pages have actual public screenshots, dated captions, and links to source or checked behavior. [Case study evidence](case-study-evidence.md) records what was inspected and where the images came from. Screenshot coverage is desktop; do not treat it as mobile testing. Project identity artwork remains clearly labeled where a real capture is unavailable.

Use `/admin/projects` to update your role, the problem, constraints, approach, technical choices, and outcomes. Describe only contributions and results that you can support. Live behavior, readable source, preserved assets, and a test result are useful evidence; they do not establish increased revenue, client satisfaction, performance scores, or traffic growth without measurements. A third-party brochure viewer belongs to its publisher, even when your site embeds it.

The captured evidence is associated with stable portfolio record IDs, so a slug edit does not detach it. Screenshots are dated snapshots; recapture them when the demonstrated interface changes materially. The operations guide does not itself establish that proposed database case-study wording has been published; confirm the public page during release verification.

## The public soundboard

[Gio’s soundboard](https://www.luis-ruiz.com/soundboard) restores all 16 MP3s from the earlier site, including the previously unlisted **Fahhhhh** clip. It is linked from the homepage and main navigation and needs no account.

- Tap a pad to play it; tapping again restarts it. One sound plays at a time.
- Search by name or category, or filter to favorites. Stars, recent plays, volume, mute, and shortcut preferences stay in the visitor’s browser. They do not sync between devices or accounts.
- Today’s pick rotates through the existing collection by UTC date. It does not represent a newly uploaded sound each day.
- **Copy link** shares the selected sound through `?sound=<id>`. Opening a shared link selects the sound without starting playback.
- Keyboard shortcuts use `1–9`, `Q W E R T Y U`, Space, Escape, and `0`. They can be disabled in the shortcut controls and pause while typing.

### Add and manage sounds from the dashboard

1. Open [Your soundboard](https://www.luis-ruiz.com/dashboard/soundboard).
2. Add a name, category, and MP3 or standard integer PCM WAV file, up to 3 MB and 60 seconds. Choose whether the clip may appear in daily picks.
3. Select **Upload draft sound**. Preview the saved audio before making it public.
4. Set **Visibility** to **Published** and choose **Save sound**. Use **Open sound** to verify the public pad.
5. Rename, change its category, set display order, change daily-pick eligibility, or set **Archived** when the pad should leave the public collection. Lower display-order numbers appear first.

Uploaded clips use the existing Supabase project and its dedicated public `soundboard-audio` bucket. **Audio URLs are public even while a pad is Draft or Archived.** Upload only audio intended for public sharing. Archiving removes the pad from the catalog and daily picks; it preserves its ID and file so saved favorites and shared links can work again after republication. An archived pad is unavailable on the public soundboard while hidden.

The 16 original audio files remain byte-for-byte in `public/sounds/`, with stable IDs and shortcuts. The database catalog adds editable metadata and uploaded clips; `lib/soundboard/catalog.ts` preserves the original baseline. New clips do not require code edits or a deployment. The source commit and hashes for the recovered originals are recorded in [the soundboard provenance guide](soundboard-provenance.md). Do not remove these assets as unused: their public URLs are intentional runtime references.

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
npm run test:soundboard
npm run test:inquiries
npm run test:inquiry-alerts
npm run test:contact-ingestion
npm run test:site-measurement
npm run test:story-recovery
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

## Owner verification and release evidence

The initial redesign shipped through [PR #2](https://github.com/ruizTechServices/luis_ruiz_3/pull/2), production commit `599066118f6f554665302e5f4631e50e22938cdb`, on September 7, 2026. Vercel reported the production deployment ready and assigned both domain aliases. Live article rendering, the contact submission and cleanup, robots, sitemap, and RSS were verified. Lint, TypeScript, auth source checks, production build, and sitemap checks passed.

The existing database records the publishing migration as `20260907151735`, the identity/privacy migration as `20260907165454`, and the owner media-listing policy as `20260907171244`. Transactional database tests verified draft isolation, publishing/unpublishing, stale-edit rejection, owner identity, private project visibility, and comment email protection. Media role checks verified owner-only photo metadata listing without changing files. Their synthetic rows were rolled back; the synthetic contact inquiry was separately removed.

On September 7, 2026, Gio completed Google authentication in the shared test browser. An earlier attempt expired during verification; a fresh OAuth request completed and production showed owner dashboard and Admin access. Expired or failed OAuth returns now lead to a fixed sign-in message with a safe retry destination instead of silently rendering the homepage. Provider error descriptions are not displayed, and authentication expiry/security settings are unchanged.

The authenticated browser verified Dashboard → Links → Write a story, private draft creation, Markdown preview, saving, reloading, and saving an uploaded image inside the draft. An anonymous database-role query returned zero rows for that draft. The separate public-page fetch could not complete, so this is database evidence of draft isolation, not a signed-out browser check. The temporary verification draft was removed after testing; Gio’s own writing was preserved. Publication and unpublishing remain covered by the transactional database tests above, rather than a temporary public test article.

The existing LR logo was uploaded through the production media form, converted to WebP, and successfully rendered at 500 × 500 in the editor preview. Both Copy URL and Copy story image were verified. The reusable public logo remains in Your images at `portfolio/52ac64d2-bd5a-4e97-9465-b697290cf32a.webp`.

The earlier portfolio release used only a honeypot and validation for contact spam. The new workflow adds Edge ingestion, persistent rate limits, duplicate detection, a notification queue, and column-level intake restrictions. Release verification must confirm that Edge functions and migrations are applied before describing these as active in production. Verify both a legitimate submission and rejected direct database insertion after the public form has switched to the Edge function.

The new inquiry UI has four executable regression checks covering permitted update fields, validation, due-date status semantics, filter IDs, and safe reply links. Its focused ESLint and TypeScript checks passed during implementation. Owner browser verification of this new inbox and the other new workflows belongs to the current release; the successful story/media walkthrough above documents the earlier release. Email delivery remains pending until sender setup and an actual received test are verified.
