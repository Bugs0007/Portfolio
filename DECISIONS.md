# Decisions log

Autonomous calls made while Bhagath was away, one line each, most recent first.
Reversible by design, if any of these should have gone the other way, say so and
they get flipped.

- **Did not fabricate YouTube video IDs for the Watching section, and did not
  scrape/download third-party poster art from the web.** A wrong or guessed
  YouTube ID could point at the wrong (or an inappropriate) video, and BRIEF.md
  Section 10 already bans stock/AI imagery site-wide; sourcing official
  poster art without a clear go-ahead felt like the same category of risk.
  Left `watching.ts` exactly as documented (`// NEEDS:` a real ID + poster per
  entry), matching the file's own existing convention rather than inventing one.
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
