# Case study evidence — September 7, 2026

This review strengthens three existing public portfolio records without inventing
client outcomes, project roles, performance scores, or revenue metrics.
`case-study-updates.json` contains the reviewed record updates. The matching
`case-study-updates.sql` transaction locks IDs 5, 6, and 14 and checks their slug,
public visibility, and last reviewed timestamp before any content is updated.
It preserves fields omitted from the JSON and aborts the whole transaction if a
guard fails. Apply it after the screenshot and owner sound-management release is
deployed and verified. The SQL header records the JSON source SHA-256.
No database mutation was performed as part of this evidence-gathering subtask.

## Evidence and attribution

| Portfolio record | What was directly checked | Source scope |
| --- | --- | --- |
| 5 — Catherine Ruiz | Live introduction in both languages, telephone link, brochure switch from English to Spanish, Spanish viewer controls/content, public Luis Ruiz footer credit | `https://catherineruiz.com/`. The accessible public `ruizCatherineDotCom` repository is a 2023 predecessor, not the current production source. No current framework/backend claim is inferred from it. |
| 6 — ruizTechServices | Live problem grid, home/business paths, Request Help navigation, inquiry fields; matching current public source | `https://www.ruiztechservices.com/` and `/contact`; `ruizTechServices/ruiztechservices-website` at `ca7251534b749ba23ab3fdbba116a0eb91c4e4c1`. Read `components/marketing/MarketingHome.tsx`, `lib/jobs/jobs.ts`, `lib/actions/contact.ts`, `lib/forms/contactFields.ts`, `app/contact/page.tsx`, and `package.json`. |
| 14 — Gio's Soundboard | Public sound catalog, search/filter/favorite controls, persistent player; existing byte recovery record and player/test source | `https://www.luis-ruiz.com/soundboard`; `ruizTechServices/luis_ruiz_3` production source at `deef92cd5971ff492ea04dbce51f21410cdebd0b`. Source links on the case page use that immutable revision. |

The Catherine development role already existed in Gio's project record and is
corroborated by the live site's credit. The added contribution wording names the
visible website work without claiming that Gio created Avon's brochure content
or viewer. The `ruizCatherineDotCom` historical commit inspected was
`a73642adc9ddb1e0df6c2e91383657502cc373f5`, authored by Luis Ruiz; it is deliberately
not linked as the current production implementation.

RTS source matches the live homepage text and interaction paths. Its inquiry
server action shows the Supabase write, but this review did not submit a real or
synthetic inquiry to the separate RTS site. The case distinguishes implementation
evidence from a successful end-to-end delivery test.

The soundboard recovery is a historical fact about the original 16 files, so
that count remains valid when new clips are added later. Current production
catalog size should never be hardcoded into new case status copy.

The updated soundboard copy also reflects the current release source:
`lib/soundboard/data.ts`, `audio-validation.ts`, `app/api/soundboard/route.ts`, the
owner manager component, and the reviewed soundboard migration. Published catalog
rows come from Supabase; owner checks and RLS restrict management; column grants
preserve original IDs, file paths, and shortcuts. New MP3/PCM-WAV uploads start as
draft catalog entries in a dedicated public audio bucket. A draft or archived
pad does not make its audio URL private. Catalog errors now show an unavailable
state rather than falling back to an old catalog that could re-show archived
pads.

MP3 uploads receive structural checks before dynamic server-side decoding with
exact `mpg123-decoder@1.0.3`. The implementation rejects decoder errors, nonfinite
samples, invalid decoded duration, and all-silent decoded output (which mpg123
can produce when concealing corrupt data). Stored duration uses decoded samples;
the uploaded encoded frames remain intact after ID3 stripping. PCM WAV checks
its chunks and integer sample layout, then removes ancillary metadata. There is
no transcoding claim. The soundboard agent reported 17 passing regression checks;
the final production upload/publication walkthrough remains the release gate
before applying the updated public case copy.

## Screenshot provenance

Four images were captured from the actual public pages through the supported
browser. They are optimized WebP assets committed with this repository. None is
a generated mockup. Images are resized/encoded only as indicated below; crops
remove surrounding navigation or frame whitespace, without editing product
content. Public Catherine contact details appear because they are part of the
existing public business page. No private dashboard content is shown.

| Asset under `public/images/projects` | Source view | Dimensions | Bytes | Processing |
| --- | --- | --- | ---: | --- |
| `catherine-introduction.webp` | Catherine homepage at the top | 1348 × 926 | 44,876 | JPEG capture encoded as WebP |
| `catherine-spanish-brochure.webp` | Catherine homepage after selecting Español | 1035 × 769 | 43,456 | Crop x149/y154/w1035/h769 from viewport; WebP |
| `ruiztechservices-home.webp` | RTS homepage at the top | 1348 × 926 | 44,638 | JPEG capture encoded as WebP |
| `soundboard-controls.webp` | Soundboard catalog and persistent player | 1153 × 795 | 33,108 | Crop x105/y126/w1153/h795 from viewport to omit signed-in navigation; WebP |

The capture UI was desktop. Do not describe these as mobile verification.
The browser's filesystem timezone differs from UTC; the UTC artifact timestamps
and session date are September 7, 2026. Public captions use that date.

SHA-256:

```text
4518fd94ee806a79c8df6b4419c40b9aef65f9f480f8d33aa034536977f7f6b2  catherine-introduction.webp
82e32acbb8e1560645c42adbbace8ce2180ec3e797d4707b8f8b8ca520c67669  catherine-spanish-brochure.webp
0cdf653fc6115cb38d6b855c1e287d8f293b8fd632c1a143872ce79ec24d6061  ruiztechservices-home.webp
c21ceba8c04d1f7515863f7beefa0b5df99eeef1a9924b8ae046b8d6ef11b99c  soundboard-controls.webp
```

## Rendering

`components/projects/project-evidence-data.ts` associates evidence with stable
project IDs, so changing a project slug does not detach its screenshots.
`project-evidence.tsx` renders dated, captioned screenshots with native image
links and explicit source/behavior checks. It is a Server Component and adds no
client JavaScript. `ProjectCard` uses the first real screenshot for those cases;
the unreviewed Chuef card retains its clearly labeled project-identity artwork.

Images use `next/image`, explicit dimensions, responsive sizes, and lazy loading.
There is no image carousel, third-party viewer script, or remote screenshot
service. Live images and evidence are snapshots; replace and recapture them when
the relevant product changes substantially.

## Separate site follow-up discovered

The RTS homepage now focuses on practical local tech help, while its contact page
still advertises broad fractional CTO and AI services and a 24-hour response
promise. The source also uses basic form validation and logs submitted contact
fields. This subtask does not alter the separate RTS repository or database.
Those findings must not be rewritten as proof of hardened validation, guaranteed
response time, proven acquisition, or fully aligned copy in the portfolio.

No access was made to the foreign `public.posts` table in the shared Supabase
project. Only this portfolio's public project records were read.

## Checks

- Targeted ESLint check passed for `components/projects` and the project detail page.
- Browser inspection verified the English/Spanish brochure change and the RTS
  Request Help navigation without submitting forms or opening auth flows.
- Screenshot bytes, final dimensions, crops, and file sizes were inspected.
- Full deployment/build and final database update belong to the parent release.
