# Decisions log

One line each, most recent first. Reversible by design, if any of these should
have gone the other way, say so and they get flipped.

## After Bhagath returned (eighth round: My Favorites layout)

- **Fixed the grid, not the padding.** The section's excess height came from
  5-item categories wrapping to 2 rows at 3 columns, not from the shared
  `py-24 sm:py-32` section padding (identical across `Work`/`ContactFooter`
  too). Went to 5 columns at desktop so 5 entries fill one row, left padding
  alone to keep the section rhythm consistent site-wide.
- **Measured before and after with Playwright instead of eyeballing it.**
  Scripted a boundingBox read of `#favorites`'s actual rendered height at
  both breakpoints, confirmed the fix actually reduced it rather than just
  looking plausible in a screenshot.
- **Diagnosed an apparent "broken poster" in an early capture as a test
  artifact, not a real bug**, before touching any product code. Playwright
  scrolled to the section and screenshotted immediately, faster than Next
  Image's lazy-load could finish for cards further down; waiting for
  `networkidle` after the scroll made every poster render correctly. Worth
  recording since it would have wasted the next round chasing a phantom bug.

## After Bhagath returned (seventh round: full Travel content overhaul)

- **Treated the broken Travel paths as a P0 fix bundled into this same round**,
  not a separate bug report. Bhagath's folder reorg had removed every old
  flat `public/media/travel/*` file the live site was still pointing at, so
  until this pass landed the entire Travel section 404'd on every image and
  video. Fixing it was implicit in "include all of them," not optional.
- **Curated the new, generically-named (`IMG_####`) files this round**
  instead of leaving them out on this project's own "undescribed name means
  unreviewed" convention. Bhagath's explicit "include all of them" overrides
  that default; reviewed every file individually (frame extraction for
  video) rather than batch-including blind.
- **Re-sequenced Zanskar into a narrative arc** (arrival, nature, landmarks,
  people, monastery, night sky, Zangla Palace finale) instead of appending
  the 7 new items after the original 8 in whatever order they were found.
- **Recaptioned one Coimbatore video by content, not filename.** A new
  labeled source (`coimbatore_watching_sunset_w_friends.MOV`) matched an
  existing entry's caption better once actually watched than the entry its
  name most resembled. Confirmed by viewing the frame content before
  reassigning it.
- **Confirmed a GPS "mismatch" was consistent, not an error.** A new
  "friends on a misty peak" photo's coordinates (Chikmagalur, Karnataka)
  don't match Coimbatore city, but do match the existing "Kenmangudi" trek
  entry's coordinates: same real place (Kemmangundi), so captioned
  consistent with that entry instead of flagged as wrong or silently
  corrected to something invented.
- **Set aside two files instead of guessing their trip**:
  `parigi_sunrise.jpg` (looks like Riding-section content, not Travel) and
  an unlabeled cliffside/limestone photo matching none of the four
  established trips. Archived under `assets-src/travel/` with `-stray`
  suffixes and flagged to Bhagath rather than assigned on a guess.
- **Retuned rail pacing from `media.length * 0.75` to `* 0.6`** rather than
  a flat per-chapter scroll cap, once the content nearly doubled (18 -> 35
  items). Keeps the formula's actual intent, more content earns more scroll
  time, just at a rate that doesn't balloon past ~30vh of combined scroll.
- **Archived every raw source folder into `assets-src/travel/<trip>/`
  before considering this done**, correcting the process from two earlier
  mistakes this session (a deleted-instead-of-moved raw file, and a
  raw file that briefly got committed). Verified with `git status` that
  zero raw files ended up tracked.

## After Bhagath returned (fifth round: real quality, fixing the archival mistake)

- **Verified file identity via MD5 before assuming anything was lost or
  needed reprocessing.** `IMG_0084.MOV` turned out identical to the file
  deleted last round (nothing actually lost), `IMG_0202.MOV` identical to
  what was already safely in `assets-src/intro/`. Guessing here instead of
  checking would have meant either needlessly re-warning Bhagath about data
  that was fine, or missing that the intro source needed real work.
- **Trusted ffmpeg's rotation-corrected output over the raw stream
  dimensions.** `ffprobe`'s raw `width`/`height` said `2160x3840`
  (portrait); decoding with rotation metadata applied (the same correction
  every real player performs) gives `3840x2160`, landscape. Verified this
  wasn't a wrong assumption by extracting and looking at an actual frame
  before committing to it, rather than trusting either number blind.
- **Did not touch `IMG_0067.MOV`**, a different, larger, already-cropped
  file sitting in `assets-src/music/` from earlier work. Higher resolution
  than what Bhagath just handed me, but he didn't reference it this round,
  and guessing it was "the real" source instead of `IMG_0084.MOV` (which he
  explicitly just placed in `public/media/music/`) would have been
  overriding a direct instruction with a guess.
- **Moved `IMG_0084.MOV` to `assets-src/music/` this time** instead of
  deleting it, correcting last round's mistake now that it's actually
  possible to (there's a file to move rather than one already gone).

## After Bhagath returned (fourth round: boomerang, crop, new guitar footage)

- **Mistake, not a decision: deleted the raw `guitar_video.MOV` after
  processing it**, instead of moving it to `assets-src/music/` the way this
  project's own convention says raw originals should be kept. It was never
  committed (placed directly in `public/media/music/`, not `assets-src/`),
  and wasn't in the Recycle Bin either, checked before assuming that. Told
  Bhagath directly rather than letting it pass quietly. He most likely still
  has it at whatever original source he copied it from, but I don't know
  that for certain.
- **Manually stepped `currentTime` for the boomerang reverse instead of
  `playbackRate = -1`.** Reverse video playback via negative playback rate
  isn't reliably supported across browsers (Chrome/Firefox don't honor it for
  `<video>`); a `requestAnimationFrame` loop that decrements `currentTime`
  each frame is the standard workaround and works everywhere seeking does.
- **Trimmed the new guitar footage to 12 seconds** rather than use the full
  56s clip. The whole thing is one continuous, unchanging shot (checked by
  eye across 9 sampled frames), so nothing is lost by a shorter loop, and a
  much smaller file serves the same "glimpse of him actually playing"
  purpose the original 8s clip did, now with real sound to opt into.

## After Bhagath returned (third round: Travel redesign)

- **Asked a clarifying question before rebuilding Travel**, rather than guess at
  what "reimagine, needs to look good" meant for the site's most complex
  section. Answer: the flying/tilting motion itself was the problem, keep the
  pinned-chapter scroll structure. Removed the sine-wave y-bob, per-item
  rotation, and the four entrance variants; kept everything else (pin
  mechanics, title beat, ribbon x-positioning, the chapter-boundary fix from
  earlier) untouched. A narrower, more targeted change than "reimagine" might
  suggest, but it's what the actual answer pointed at.
- **No per-item vertical stagger or rotation added back in**, even a small
  fixed (non-animated) one for visual variety. Went with the calmest version
  first, level and on-axis, since the direct complaint was specifically about
  motion reading as chaotic; a flourish neither asked for nor verified against
  felt like the wrong thing to introduce in the same pass that removed the
  ones that didn't land.

## After Bhagath returned (second round: Hero/Music video, Favorites posters)

- **Used YouTube's own thumbnail images as Favorites posters**
  (`img.youtube.com/vi/<id>/maxresdefault.jpg`), not downloaded/reused poster art
  from elsewhere. These are the same real, official images YouTube itself serves
  for exactly this purpose (video preview thumbnails) for videos already verified
  and already embedded on the site, a different category from scraping unrelated
  poster art, which is still not something I'd do without asking.
- **Did not add a sound toggle to Music.** `loop.mp4` has no audio stream, checked
  against the file from this repo's first commit, so this isn't something this
  session's recompression broke. A working toggle needs a source file that
  actually has audio; left the (now-reusable) toggle component built but unused
  here rather than ship a button that does nothing, and said so directly instead
  of quietly leaving it broken.
- **Picked `freezeAt={2}` (seconds) for the Hero video** by extracting and looking
  at frames every 0.5s rather than guessing: the peace sign is clearly held from
  about 1s to 2.5s, and 2s landed on a sharp, well-composed frame within that
  window, not a transitional/blurry one.
- **`min-h-[72vh]` for Hero, `min-h-[62vh]` for Music**, picked by working out
  the actual `object-cover` crop math at a few candidate heights against each
  video's real aspect ratio rather than picking a number and eyeballing it (see
  `AUDIT.md`).

## After Bhagath returned (first round: Favorites rename, video playback)

- **Sourced real, verified YouTube trailer IDs for all 10 Watching entries**,
  once explicitly asked to fix playback (rather than left blank as during the
  unattended pass, see below). Searched per title, then checked every
  candidate's actual channel via YouTube's oEmbed API before using it, not
  just the title text: the first-pass Attack on Titan pick resolved to "The
  Asylum Movie Channel" (a mockbuster studio, near-certainly unrelated
  content despite a matching title) and got swapped for a Crunchyroll Dubs
  upload; Your Name got upgraded from a German reseller channel to GKIDS
  Films, the actual North American distributor. `startSeconds` per entry is a
  best-effort skip past studio logos, not verified frame by frame, worth a
  nudge in `content/watching.ts` if any clip opens on a bad beat.
- **Categories are "anime" / "movie" / "show", not "anime" / "film"**, per
  request. All 10 current entries land in anime or movie, `show` exists in
  the type and the section's rendering (`Watching.tsx` hides a category
  entirely when it has zero entries) but nothing populates it yet, no
  fabricated show entries were added to fill the bucket.
- **Renamed the section "My Favorites"** (was "Watching"), matching the exact
  wording requested. Left the internal file/component names
  (`Watching.tsx`, `WatchingCard.tsx`, `content/watching.ts`) alone, only
  user-facing text and the section's `id`/`aria-label` changed, renaming
  files too would've been pure churn for a display-text request.

## While Bhagath was away (unattended pass)

- **Did not fabricate YouTube video IDs for the Watching section, and did not
  scrape/download third-party poster art from the web.** A wrong or guessed
  YouTube ID could point at the wrong (or an inappropriate) video, and BRIEF.md
  Section 10 already bans stock/AI imagery site-wide; sourcing official
  poster art without a clear go-ahead felt like the same category of risk.
  Left `watching.ts` exactly as documented (`// NEEDS:` a real ID + poster per
  entry), matching the file's own existing convention rather than inventing one.
  (Superseded above once Bhagath was back and asked directly: sourcing became
  the reasonable next step, not a repeat of the same risk, since every ID is
  now checked against its actual channel before use.)
- **Removed the per-photo "01/02" index caption in the Riding grid.** It's the
  exact decorative-numbering pattern AGENTS.md's banned list calls out
  (numbering with no real sequence behind it, these five photos aren't steps
  or a narrative order). The chapter-index numbering in Travel
  (`TravelChapter.tsx`'s "01 / 04") stays, that one's a real ordinal position
  in an actual list of chapters.
- **Left `metadataBase` unset in `layout.tsx`.** Setting it needs a real
  domain, and BRIEF.md Section 11 lists the domain as an open question Bhagath
  hasn't answered yet. Next.js falls back to `localhost` for OG/Twitter image
  resolution in the meantime (logged as a build warning, not an error). Revisit
  once a domain exists.
- **Generated `icon.tsx` and `opengraph-image.tsx` with `next/og` instead of a
  designed logo file.** There's no brand mark anywhere in the brief or the
  existing design system to draw one from, a plain monogram in the site's own
  ink/jacket-bright tokens is honest about that rather than inventing a logo
  that would need to be "the" logo everywhere after.
- **Light-touch recompression of the handful of >500KB JPGs (sharp/mozjpeg,
  capped long edge, quality 74-80) instead of building the full
  `scripts/process-media.mjs` pipeline (AVIF/WebP/LQIP/manifest) right now.**
  CLAUDE.md already documents that pipeline as deliberate Phase 2 work, not a
  bug; building it properly is a bigger, separate task than a performance
  audit pass. The recompression is safe (same paths, same format, no code
  changes needed elsewhere) and closes most of the gap in the meantime.
