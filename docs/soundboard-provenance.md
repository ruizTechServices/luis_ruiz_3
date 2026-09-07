# Soundboard recovery provenance

Recovered on 2026-09-07 into the active `ruizTechServices/luis_ruiz_3` repository.
The user explicitly requested restoring his existing soundboard as a public feature
for returning visitors after the preceding portfolio improvements were deployed.

## Exact source

- Source repository: `ruizTechServices/luis_ruiz_2`.
- Recovery commit: `97ea4af20a26b6ca6b7cf69f1117c2bc7810f607`.
- Original component: `components/app/landing_page/soundboard.tsx` at that commit.
- Original MP3 directory: `public/sounds/` at that commit.
- Removal commit: `924e7cc27c051f22a375dc704e076831b9d4315b`, dated 2026-08-26;
  the component and all 16 files were removed during a dead-code cleanup.
- Component implementation commit: `34efcaf6f30fbda66c524e7795cf8b790b2871bb`,
  dated 2026-04-10. That change mounted the compact demo on the projects page.
- The latest removed component's SHA-256 is
  `a76186390517c0b3907719c1911019d9e68d779940421ce111daf8466b73f5e8`.

All 16 audio files were restored **byte for byte** from Git blobs. Their combined
size is **1,275,313 bytes**. No replacement audio was downloaded, generated, trimmed,
normalized, or re-encoded. This ledger establishes the recovery source; it does not
claim original authorship by Gio or a particular license for the audio recordings.

## Catalog

`lib/soundboard/catalog.ts` exports `SoundClip`, `SoundCategory`, and the readonly
`SOUND_CLIPS` array. Each entry supplies `id`, `label`, `src`, `hotkey`, `category`,
and `durationSeconds`. The original 15-pad IDs, labels, order, and keys are retained.
Categories are new editorial groupings for browsing, not claims about recording origin.
All source filenames remain intact and use URL-safe characters.

The archive includes `fahhhhhhhhhhhhhh.mp3`, added with audio in commit
`1fe6d1fa9120b362bb2253cc21c9feedd754c0e5` on 2026-04-27. The old manifest omitted it;
it is now the sixteenth pad, **Fahhhhh**, with stable ID `fah` and key `U`.
The legacy label **Mystery Clip** remains attached to `/sounds/indian.mp3`; no identity
or language is inferred from that filename.

Durations below are `ffprobe` container durations in seconds, measured from the restored
files. Browser media metadata remains authoritative for actual playback/progress because
encoder padding can produce slight differences. All files were recognized as MP3 audio.

| Pad | Key | Public path | Duration (seconds) | Bytes | SHA-256 |
| --- | --- | --- | ---: | ---: | --- |
| Vine Boom | `1` | `/sounds/vine-boom.mp3` | 1.306122 | 21,230 | `c4dadbc0b9cd21b1313ec11845a00d9401bc208ae0f59f54a0282b8cb89d56c2` |
| UwU | `2` | `/sounds/uwu.mp3` | 0.72 | 11,520 | `32b88ee021f699ccf26fd5526eaeff52e00e950b01821999225663137b133797` |
| Stop The Cap | `3` | `/sounds/stop-the-cap-cut.mp3` | 0.862041 | 14,172 | `327ac74f55d973cdbe708c964bc59f09efd6903e49bb99eb64706ca87dd22766` |
| Roblox Oof | `4` | `/sounds/roblox-death-sound_1.mp3` | 1.044898 | 16,971 | `fd51f1f5b2d1293cf1466a5f5a912c05db77fde5c511a743da76211c98c0db8b` |
| MLG Airhorn | `5` | `/sounds/mlg-airhorn.mp3` | 3.004082 | 48,318 | `95beb8827452fab91d38535bbfd359b5e59547e2f98a937cb01032d3dced930c` |
| Meow | `6` | `/sounds/meow_jEHtSyd.mp3` | 0.835918 | 13,627 | `2f9ae7f85be15c36269aa4aab0df2a71bf9d6168627b8e29b38e0337f2257d5a` |
| Mystery Clip | `7` | `/sounds/indian.mp3` | 8.594286 | 137,854 | `34ea03472b96ac14babcd75925a361446e17835b3e89529c65913ce227d29960` |
| Gulp | `8` | `/sounds/gulping.mp3` | 17.110204 | 274,283 | `3a8ef9f9614f9065c9eb8f46526a52c17895b0cd073c17575bf7889db76b5a09` |
| Gigachad | `9` | `/sounds/gigachad.mp3` | 28.656438 | 458,641 | `fb6a43bacc7f177026ff196beae71a4a2993039f320aa8b76c5b2aa06b6a1a13` |
| Get Out | `Q` | `/sounds/getouttuco.mp3` | 1.752 | 15,837 | `a779b9112155606ea3c6f58ac5e7e7af0011329985d27a4f0fe258bb95ff8f52` |
| Ewww | `W` | `/sounds/ewww.mp3` | 3.056327 | 49,565 | `31b7fa47bb568b45964a8eb179c70591dfcba62c32a6ca163d3553a9243c5ff2` |
| Dry Fart | `E` | `/sounds/dry-fart.mp3` | 0.365714 | 1,690 | `11c2bbd0505f013f928c21bff7c202b62ac3da5c67db16f8b7a489f653e304c8` |
| DaBaby | `R` | `/sounds/dababy.mp3` | 3.696 | 59,136 | `6c563677016d1b8bcc6b69152a4f11d33d2a02d9b289c62681cfa65f7e003bfc` |
| Bruh | `T` | `/sounds/bruh.mp3` | 0.336 | 5,376 | `57939563f32d350e6fd358f27bb08cd43cc337e0d579e51f530b5bbc4bd3a089` |
| Anime Wow | `Y` | `/sounds/anime-wow-sound-effect.mp3` | 4.205714 | 67,637 | `5118c619f0ab62e181f32d9eacd490441b49aaa7bb8e1be1b6b51e7a3c25debc` |
| Fahhhhh | `U` | `/sounds/fahhhhhhhhhhhhhh.mp3` | 1.959184 | 79,456 | `f65311d5eea216616cde00edc9e0ee0e2be1f5a03aeeb5aef8b23d55f676826a` |

## Original behavior worth retaining

The old component used one audio element: choosing a pad stopped the previous clip
and restarted the chosen clip from zero. It offered click/tap pads, keyboard keys
`1`–`9` and `Q W E R T Y`, `Space` for pause/resume, `Escape` to stop, and `0` for
random playback excluding the current clip. It showed elapsed time/duration and
progress, plus volume and mute with restoration of the previous volume.

The legacy default volume was 0.72. Playback began only after a user action.
It required no authentication, database, or paid provider. The recovery keeps the
assets local to the application; the public route and client controls are integrated
separately into the current `_3` design and runtime.

Do not copy the old implementation unchanged: its global key handler did not reject
modifier combinations or repeated keydown events, and Space could override a focused
button's native behavior. Its visible error text also referred to restarting the dev
server or checking `/public/sounds`. The current public feature should use accessible,
scoped controls and reader-facing playback feedback.

## Verification performed for the recovered assets

- Confirmed 16 unique clip IDs, 16 unique hotkeys, and 16 existing audio paths.
- Compared every restored file byte-for-byte against the recovery commit.
- Computed the SHA-256 values above from the restored files.
- Ran `ffprobe` on every file; each exposed an MP3 stream and a finite duration.

Re-check a restored clip against the source checkout with:

```bash
git -C ../site-source show 97ea4af20a26b6ca6b7cf69f1117c2bc7810f607:public/sounds/vine-boom.mp3 | sha256sum
sha256sum public/sounds/vine-boom.mp3
ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1 public/sounds/vine-boom.mp3
```

Client interaction, responsive layout, network playback, and deployment verification
are recorded with the integrated release, not implied by the asset checks above.
