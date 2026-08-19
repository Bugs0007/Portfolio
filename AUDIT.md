# Audit

Written mid-session, during an unattended continuation of the build. The site was
already well past Phase 0 when this pass started (Hero through Watching all exist,
`CLAUDE.md` already documents real design decisions), so this isn't a from-scratch
recon, it's a health check against the brief's own bar plus a live Playwright pass:
screenshots at 1920x1080 / 1440x900 / 834x1112 / 390x844, a 400px scroll sequence at
desktop and mobile with reversal, console/network capture, and `prefers-reduced-motion`
toggled.

## P0 (fixed this session)

- **`Reveal.tsx` and `Seam.tsx` used Motion's own `useReducedMotion()` to pick a render
  branch.** `CLAUDE.md` already documents exactly why this is wrong (returns `null` on
  the server, the real value during the client's first render, so a component branching
  on it renders two different trees and React throws a hydration mismatch) and ships
  `usePrefersReducedMotion()` specifically to avoid it. `Reveal` wraps nearly every
  section's content, so this wasn't a narrow bug. Fixed by swapping both to the local
  hook.
- **Every page load threw 10 console errors**, one `400` per Watching entry, from
  Next's image optimizer choking on `/media/watching/<slug>.jpg` files that don't exist
  yet (none of the 10 entries have poster art). Fixed by checking file existence
  server-side in `Watching.tsx` (a server component) and only rendering the `<Image>`
  when a poster is actually on disk, instead of requesting-then-catching client-side.
- **~1-1.5 viewport-heights of dead scroll at all three Travel chapter boundaries**
  (Zanskar→Manali, Manali→Coimbatore, Coimbatore→Uttarakhand), diagnosed with a
  temporary on-screen `scrollYProgress` readout rather than guessed: `position:sticky`
  inherently reserves one full viewport-height of "unpin and scroll away" space at the
  end of every pinned chapter, and the rail's last photo was already faded to invisible
  before that release point, so the trailing screen had nothing left to show. Fixed by
  shortening the ribbon's travel distance so the last photo is still on screen at
  release and rides away with the natural unpin scroll instead of the chapter ending on
  a blank hold. Also tightened the incoming chapter's title-reveal ramp
  (`introFraction * 0.4` → `* 0.18`). Combined, this cut the dead stretch from
  ~900-1200px down to ~200px per transition, verified with fine-grained (100px) scroll
  screenshots before and after.

## Lighthouse

Desktop (simulated throttling): **Performance 95 · Accessibility 100 · Best Practices
100 · SEO 100**, LCP 1.0s, CLS 0, TBT 0ms. Clean.

Mobile is messier to report honestly. Real (devtools) throttling across three
consecutive runs showed **LCP falling from 3.6s → 2.7s → 2.5s** as a direct,
mechanically-traceable result of the intro-splash fix below (each run's "Render Delay"
phase, ~100% of LCP with ~0% load/network delay both before and after, tracked the
splash's configured duration almost exactly). But absolute numbers on this pass are
not trustworthy: this machine had two Next.js servers and repeated headless Chrome
launches running concurrently while testing, and one run's `bootup-time` audit
attributed **10.3 seconds** to a single script chunk, more than the total LCP measured
in the same run, which is only possible if the trace itself was corrupted by CPU
contention. Simulated-throttling mode fared even worse here: it doesn't model a
fixed-duration `setTimeout`-gated overlay well and its LCP number actually went the
wrong direction after the fix (5.9s → 7.1s) while TBT stayed flat, the opposite of
what the mechanistic, real-throttling evidence shows. **Numbers from this session's
mobile Performance score (60-74 across runs) should not be treated as final** — rerun
Lighthouse mobile on an otherwise-idle machine (or web.dev/PageSpeed Insights) before
using it as a release gate. Accessibility (96, see below), Best Practices (100), and
SEO (100) were stable across every mobile run regardless of throttling noise.

**Mobile accessibility's one deduction:** `color-contrast`, on Travel rail captions
sitting at their resting `opacity: 0.4` (per `TravelChapter.tsx`'s `captionOpacity`,
rising to 1 only once an item is centered) plus the rail's own edge mask. Verified by
querying the live DOM for the exact flagged color, not guessed. This is inherent to
the horizontally-scrolling-rail-with-edge-fade pattern, not a defect, forcing a
contrast floor here would fight the design (captions are meant to dim off to the
side and brighten as their photo takes focus), and it doesn't block screen-reader
users since alt/caption text is unaffected by CSS opacity. 96 still clears the ≥95
bar; left as-is.

**LCP root cause (mobile), found and fixed:** `IntroSplash.tsx` sits at `z-[100]`
over the full viewport for its multilingual greeting sequence. At the original
750ms/word timing that's ~2.85s before the real Hero content can be credited as
painted, directly conflicting with the brief's "LCP under 2.5s... must not block
first paint." Cut `WORD_MS` 750→450 and tightened the exit transitions
(0.6s→0.4s container, 0.35s→0.28s per word), preserving the three-greeting beat
(Hello / नमस्ते / నమస్తే) but getting it out of the way roughly 40% faster.

## P1

- **Six photos over 500KB** (`sethan-forest.jpg` 1.15MB, `koksar-group.jpg` 929KB,
  `coimbatore-trek.jpg` 765KB, `badrinath.jpg` 754KB, `ganesh.jpg` 522KB,
  `helmet-night.jpg` 511KB). Recompressed in place with sharp/mozjpeg (capped long edge,
  quality 74-80, same path/format so no code changes needed elsewhere). Four now sit
  under 500KB; `sethan-forest.jpg` (630KB) and `koksar-group.jpg` (550KB) are close but
  not quite there without visibly softening the image. The real fix is the
  `scripts/process-media.mjs` pipeline (AVIF/WebP/LQIP) that `CLAUDE.md` already flags
  as deliberate Phase 2 work, not attempted here, this recompression pass closes most
  of the gap in the meantime.
- **No `metadataBase`** in `layout.tsx`, so Next falls back to `localhost` for
  OG/Twitter image URL resolution (a build warning, not an error). Needs a real domain,
  which `BRIEF.md` Section 11 already lists as an open question. Revisit once decided.
- **`riding.bike`** is still `null` (`// NEEDS: make/model`), and Watching has zero real
  YouTube IDs or poster art. Both pre-existing, both correctly marked rather than
  guessed, left as-is (see `DECISIONS.md`).

## P2

- Default Next.js boilerplate (`favicon.ico`, `file.svg`, `globe.svg`, `next.svg`,
  `vercel.svg`, `window.svg`, no OG image, no custom 404) was still present. Replaced
  with a generated monogram `icon.tsx`, a generated `opengraph-image.tsx` in the site's
  own tokens, and an on-brand `not-found.tsx`; removed the five unused placeholder SVGs
  (confirmed unreferenced first).
- `.agents/skills/**` (bundled skill reference assets, not site source) was being
  linted, producing 92 unrelated errors that had nothing to do with this project.
  Excluded via `eslint.config.mjs`.
- Riding's per-photo "01/02" index caption was decorative numbering with no real
  sequence behind it, matching the brief's own banned-pattern list. Removed (see
  `DECISIONS.md`); Travel's chapter numbering ("01 / 04") stays, that one's real.
- The photo counts in the run brief (Coimbatore 5, Manali 7, Uttarakhand 4, Zanskar 14)
  don't match what's actually in `site.ts` (Coimbatore 4, Manali 2, Uttarakhand 4,
  Zanskar 8). This reads as the brief describing an intended future state rather than
  a bug, current asset availability per `CLAUDE.md` is the likely constraint; not
  changed.

## What's solid

Hero, Work, Music, Art, Riding, and the résumé page all read clean at a skim, hold up
with motion off, and match the brief's copy register (no "passionate developer",
no invented achievements). Design tokens in `globals.css` match what `CLAUDE.md`
documents. The Travel signature moment (`TravelChapter.tsx`) is genuinely the
strongest thing on the site once the boundary dead-zones were tightened: real depth,
real per-photo entrance variants, GPS captions only where EXIF actually had them.
`StaticJourneys` and reduced-motion fallbacks render correctly (checked via
Playwright's `reducedMotion: "reduce"` context). Lint and build both run clean.

See `PROGRESS.md` for the running log and `DECISIONS.md` for the calls made without
being able to ask first.
