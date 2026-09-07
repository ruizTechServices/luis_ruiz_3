# Selective transfer from luis_ruiz_2

Reviewed on 2026-09-07. The active application remains `ruizTechServices/luis_ruiz_3`.
The user authorized retaining useful work from `_2` after the initial `_3` improvements.
This is a selective transfer, not a repository replacement or a bulk merge.

## Source and asset provenance

Source repository: `ruizTechServices/luis_ruiz_2`, inspected at commit
`6966cd39d7e3383523ed63f474733a078244a4d3`.

The source contains 34 raster assets under `public/images` and `public/edited`.
The portraits and project-named artwork considered for reuse were visually inspected.

| Source asset | Decision | Reason |
| --- | --- | --- |
| `public/images/gioWater.jpg` | Copied unchanged to `public/images/gio-water.jpg` in `_3` | Existing outdoor portrait of Gio. Used on the new `/about` page with `next/image`, intrinsic dimensions, responsive sizes, and descriptive alternative text. |
| `public/images/logo_lr.png` | Reused existing `_3` copy | Byte-identical to `_3/public/logo-lr.png`; the same image is now also `app/icon.png`, replacing the starter favicon. |
| `public/images/luis_ruizLogo.png` | Duplicate; skipped | Byte-identical to both logo files above. |
| `public/edited/luis-2.png` | Skipped | A larger edited version of the outdoor composition with a visible generation watermark. The original JPEG is sufficient. |
| `public/images/codeCombinator.png`, `bootstrapLitComponent.png`, `webComponentGPT.jpg`, `webComponentGPT.webp` | Skipped as portfolio proof | Decorative artwork, not screenshots demonstrating the corresponding software. No current project implementation was verified from these files. |
| Other selfies, cutouts, technology logos, and generic backgrounds | Retained in `_2`; not imported | They add no necessary content to this release. No private media bucket was bulk-copied. |

The copied portrait is 1,280 × 720 pixels and 77,734 bytes. Existing EXIF metadata is
preserved with the file. Inspection found no GPS latitude or longitude fields; this
is not a claim that the image is metadata-free.
Source and destination have the same SHA-256:

```text
502c1c2b327d9303cfb672fff9b016a4b48008094c9496908a6597904b0c50cd
```

The three equivalent logo files have SHA-256:

```text
6b34bbc922597ee64359ca1369907d3fd9d2b8e34b39b49621213143666b29aa
```

## Other recoverable media

These assets remain in their source repository. They were not deleted or replaced.
No additional photo currently improves the page enough to justify another public copy.
Source `_2` paths below are recoverable at the inspected commit above.

| Asset | Disposition and possible future use | SHA-256 |
| --- | --- | --- |
| `_3/public/videos/hero-bg-lighting-1.mp4` | Already preserved in the active repository. Remains unused; a decorative hero background is unnecessary for this release. | `a69096bba293eaae5247f7d09d8c657f636921014391e07a6ad1f0ef39f687a9` |
| `_2/public/images/luisIT.jpg` | Existing workplace selfie; possible personal work-history illustration if Gio supplies its context. Not a client testimonial or proof of a specific engagement. | `a519a1ce0b3a995fbeb89559e1dd0b232e022e3ce83ea439d23a91807f8baaac` |
| `_2/public/images/IMG_0011.JPG` | Original portrait; the edited `luis-1.png` repeats this pose. Retain source rather than importing both. | `25570b4ace781cb2c57fb59fcf8f7c3b56c3a63c22f84e102e0a32232250869c` |
| `_2/public/images/IMG_3287.jpg` | Alternative original portrait; not needed alongside the selected outdoor photo. | `fd98d1f19afc911e000488f4121eb4248785f74b562c2d7c63b6d027d2273617` |
| `_2/public/images/IMG_4818.JPG` | Original outdoor selfie; edited `luis-3.png` and its cutout repeat the pose. Retain source. | `de78c963ccc61ca7dca2c30fa8f8b746818982bbe1460e91654f178c3800b12d` |
| `_2/public/images/me_1.png` | Black-and-white personal portrait; available for a future personal post. | `d756a01a3f0d7a29b8dad46a5dc16c4423920ccec4a7ca60e126118cee6cfde0` |
| `_2/public/images/me_2.PNG` | Stylized portrait; available for a future creative post, not current brand photography. | `b6e775a8e03682af121e72be55e9e8865e4d9a552107e110443265a4a1bc360f` |
| `_2/public/edited/luis-4.png` | Smiling portrait cutout; useful alternative if a future layout needs transparency. Not imported as an unused second portrait. | `d793f19b5ad57baee7e7c6546c9c46c3b889a9c16258879c1b2b7cc48a55c795` |
| `_2/public/edited/luis-2.png` | Larger edited variant of the selected outdoor photo; skipped duplicate composition. | `52beab6834a8c04c00dd3c1d9461b320d5b9729d012c45b5f5a8d064a10dd98d` |

## Useful content retained

- The `/about` destination is restored in `_3` with a fresh page matching the existing
  paper/forest visual style. Homepage, footer, and both sitemap presentations link to it.
- The biography uses supported facts from the project source and Gio's supplied context:
  Luis/Gio Ruiz, Bronx/New York, English and Spanish, founder of ruizTechServices in
  2024, web development, AI experiments, projects, and build notes.
- The page links readers to the existing projects, writing, contact, and business site.
  No content records are duplicated in the shared database.

Biography provenance: Gio's supplied user/project biography explicitly states Bronx-born,
bilingual English/Spanish, and that he founded ruizTechServices in New York on September 7,
2024. The legacy About component also calls him Bronx-born and lists “est. 2024.”
The new page preserves those user-provided biographical facts; it does not represent an
independent corporate-registry or employment-history verification.

The legacy biography's performance claims were not transferred: sub-200 ms latency,
99.9% uptime, 30% cost savings, and 100+ concurrent users had no supporting measurements.
The legacy “AI solutions architect by trade,” professional stage experience, upcoming
streaming schedule, two-build availability limit, and one-business-day reply promise
were also not reused without current evidence.

The old mixed “Terms & privacy” paragraph is not a substitute for an accurate policy.
It was not copied into the biography. Legacy auth links that used `/about` as a terms,
privacy, or password-recovery destination must not be revived.

## Functional transfer coordination

Old URL compatibility is implemented in `next.config.ts`: the useful `/gio_dash`
workspace paths and `/signup` map to current routes; `/images/gioWater.jpg` maps to
`/images/gio-water.jpg`; both old logo paths map to `/logo-lr.png`. The old
`/favicon.ico` path also maps to the retained logo, while `app/icon.png` supplies
the current file-based icon metadata. The exact mixed-case alias
`/images/luis_ruizLogo.png` was verified against the source.

The existing `_3` case-study administration now exposes every narrative, technology,
URL, and project date field through its current authenticated server actions. Project
and lead dates use a browser-local date/time picker; existing timestamp precision is
preserved until edited. Lead follow-up dates are editable. The password trimming
regression discovered during comparison is fixed and covered by executable checks.

The restored `/dashboard/media` page lists the existing `hero` photos and new
`portfolio` uploads in the existing public `photos` bucket. The image shortcut in the
story editor opens a new tab and provides URLs and story Markdown. A bounded,
owner-authenticated upload route verifies and re-encodes static image bytes. Existing
files are never overwritten or deleted. An additive owner-only metadata SELECT policy
was applied as migration `20260907171244`; owner/non-owner/anonymous role checks passed.
Public image URLs remain public, including images attached to a private draft.

Consult `docs/portfolio-operations.md` for daily use and remaining browser verification.

Other `_2` mechanisms were considered, not automatically imported:

| Legacy mechanism | Assessment |
| --- | --- |
| About page and portrait | Transferred as described above. |
| Project case-study fields | Transferred into `_3`'s existing authenticated admin surface with server validation. |
| Legacy dashboard/editor URLs | Preserve useful bookmarks through explicit compatibility mappings to current protected routes. |
| Blog tag filtering and pagination | Real UI in `_2`, but its query lacks the new publication filter; reuse would require adapting to `_3`'s published-only model. Not transferred in this asset/content change. |
| Project/blog associations | Legacy code queries `project_blog_links`; repository history records that table was removed. Do not restore the query or schema without a verified current data requirement. |
| Public project iframe previews | Not transferred. The old embed granted microphone, camera, and display-capture capabilities and depended on arbitrary sites permitting embedding. |
| Photo browsing/upload | Rebuilt as owner-only browsing and upload, using existing storage and RLS. Legacy public metadata listing and service-role reads were not carried forward. |
| Client dashboard, AI-tools cards, and homepage seed data | Placeholder/obsolete content; not evidence of completed capabilities. |
| OpenAI endpoints and old multi-model features | Not transferred by this portfolio/content work. Existing `_3` auth and API boundaries remain authoritative. |

## Verification

After integration, run:

```bash
npm run lint
npx tsc --noEmit
npm run build
npm run test:sitemap
```

The release check should open `/about` on desktop and mobile, confirm the portrait loads,
check the homepage/footer links, and verify `/about` appears in `/sitemap.xml` and `/sitemap`.
Validation outcomes belong in the release report; the commands here do not imply they passed.
