# Progress log

## Closing summary (2026-08-19)

Picked up mid-diff on an already-substantial build and spent the session on a health
pass rather than new sections: found and fixed one site-wide hydration-mismatch bug
(`Reveal`/`Seam` using Motion's own reduced-motion hook instead of the project's safe
one), one console-error-on-every-load bug (Watching posters requested before they
exist), a real ~1-1.5 viewport-height dead-scroll gap at every Travel chapter boundary
(diagnosed with a temporary debug readout, not guessed), and a real LCP violation
against the brief's own 2.5s budget (the intro splash blocking first paint for ~2.85s).
Also: recompressed six oversized photos, cleaned up default Next.js boilerplate
(favicon/OG image/404), and removed one decorative element that matched the brief's
own banned-pattern list. Lint and build are clean; the full Playwright audit shows
zero console errors across all four breakpoints (was 40). See `AUDIT.md` for the
full ranked list and Lighthouse numbers, `DECISIONS.md` for judgment calls made
without being able to ask first.

**Still open, not attempted:** the real media pipeline (`scripts/process-media.mjs`,
AVIF/WebP/LQIP) that `CLAUDE.md` already flags as deliberate future work, not a bug
found this session. Two photos (`sethan-forest.jpg`, `koksar-group.jpg`) are still
just over 500KB after recompression; going further would visibly soften them.

**Placeholder / not fabricated, left exactly as found:** `riding.bike` is still
`null`, Watching still has zero real YouTube IDs or poster art, `metadataBase` is
unset pending a real domain. None of these are facts I could safely invent, per the
brief's own instruction not to guess biography or facts. All three are already
marked `// NEEDS:` or documented as open questions in `BRIEF.md` Section 11, exactly
as intended, not something this session broke or needs to fix.

**Mobile Lighthouse Performance numbers from this session should be re-measured on
an idle machine before being treated as a release gate** — see `AUDIT.md`'s
Lighthouse section for why (this machine had two Next.js servers and repeated
Chrome launches running concurrently while testing).

---

Chronological, most recent at the bottom of each session's block. Full context and
rationale for judgment calls lives in `DECISIONS.md`; this file is closer to a lab
notebook.

## Session: unattended continuation, 2026-08-19

Picked up an already-substantial build (per `CLAUDE.md`, Hero through Watching all
existed, Travel's signature moment already built) with one file mid-edit in the working
tree: `WatchingCard.tsx` had a half-finished fix for the pause state always showing a
clean panel instead of a frozen video frame, and `watching.ts` had a temp smoke-test
YouTube ID that needed reverting. Both were sound, kept them, then went looking for
what else needed attention.

**Kept from the in-progress diff:** the permanent-cover pattern in `WatchingCard.tsx`
(pausing always reveals `bg-ink-soft`, independent of poster state) and the reverted
`youtubeId: ""` for One Piece.

**Found and fixed, in order:**
1. `npm run lint` surfaced 92 errors, all from `.agents/skills/**` (bundled skill
   assets, not site code). Excluded from lint via `eslint.config.mjs`. Actual site
   source was already clean.
2. Read every component top to bottom. Found `Reveal.tsx` and `Seam.tsx` both importing
   `useReducedMotion` from `motion/react` instead of the project's own
   `usePrefersReducedMotion` hook, exactly the hydration-mismatch anti-pattern
   `CLAUDE.md` warns about, and `Reveal` wraps almost every section. Fixed both.
3. Walked `public/media/`: six JPGs over 500KB. Recompressed in place with
   sharp/mozjpeg (see `AUDIT.md` P1 for exact before/after sizes).
4. Ran a Playwright pass (4 breakpoints, full-page + 400px scroll sequence, console/
   network capture, reduced-motion toggle). Console showed 10 identical `400` errors
   per page load. Traced to Next's image optimizer failing on Watching's nonexistent
   poster files, fixed by checking `existsSync` server-side in `Watching.tsx` and only
   requesting a poster when one's actually on disk.
5. Screenshots showed a genuinely gorgeous Hero/Work/Music, then long dark stretches
   through Travel that didn't match how good the mid-rail frames looked. Spent real
   time on this rather than shrugging it off, since Travel is explicitly the site's
   signature moment: built a temporary on-screen `scrollYProgress` debug readout (one
   per chapter, removed after), used it plus `getBoundingClientRect` measurements to
   find the actual mechanism (`position:sticky` reserves a full viewport-height of
   "release and scroll away" space at the end of every pinned chapter; the last photo
   had already faded to 0 opacity before that release point). Fixed by shortening the
   ribbon's travel distance and tightening the incoming chapter's title-reveal ramp.
   Verified with fine-grained 100px screenshots before and after: dead zone went from
   ~900-1200px to ~200px per boundary, three boundaries. Two failed hypotheses along
   the way (Manali's own entry lag, ribbon overshoot math by hand) are why this took a
   debug-readout detour instead of a one-shot fix, the corrected diagnosis (confirmed
   with `getBoundingClientRect`, not guessed) is what actually shipped.
6. Removed unused Next.js boilerplate: five placeholder SVGs in `public/` (confirmed
   zero references first), default favicon. Added a generated monogram `icon.tsx`, a
   generated `opengraph-image.tsx` in the site's own tokens, and an on-brand
   `not-found.tsx` per the brief's "Global" checklist (real title/meta/OG image,
   favicon, 404).
7. Removed the decorative "01/02" index caption from Riding's photo grid, per the
   brief's own banned-numbering-pattern rule (see `DECISIONS.md`).
8. Ran Lighthouse (mobile + desktop, production build via `next start`, both
   simulated and real throttling). Desktop was clean (95/100/100/100). Mobile
   Performance was low and noisy (60-74 across runs, see `AUDIT.md`'s Lighthouse
   section for why the absolute numbers aren't trustworthy from this machine), but
   real-throttling LCP traces consistently isolated the cause to `IntroSplash.tsx`:
   its full-viewport greeting sequence was blocking the Hero's real content from
   counting as painted for ~2.85s, directly against the brief's 2.5s LCP budget.
   Tightened the timing (`WORD_MS` 750→450, faster exit transitions) rather than
   removing the splash, verified the fix with three consecutive real-throttled runs
   (LCP 3.6s → 2.7s → 2.5s, tracking the timer reduction almost exactly).

**Verification run after all fixes:** clean `npm run build`, clean `npm run lint`,
re-ran the full Playwright audit: zero console errors/warnings across all four
breakpoints (was 40 total before the Watching poster fix), Travel fix holds across
all three chapter boundaries, reduced-motion and keyboard-focus passes both correct.
