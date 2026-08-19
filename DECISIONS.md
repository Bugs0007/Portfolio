# Decisions log

One line each, most recent first. Reversible by design, if any of these should
have gone the other way, say so and they get flipped.

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
