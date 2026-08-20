# Progress log

## Closing summary (2026-08-19)

Picked up mid-diff on an already-substantial build and spent the session on a health
pass rather than new sections: found and fixed one site-wide hydration-mismatch bug
(`Reveal`/`Seam` using Motion's own reduced-motion hook instead of the project's safe
one), one console-error-on-every-load bug (Watching posters requested before they
exist), a real ~1-1.5 viewport-height dead-scroll gap at every Travel chapter boundary
(diagnosed with a temporary debug readout, not guessed), and a real LCP violation
against the brief's own 2.5s budget (the intro splash blocking first paint for ~2.85s).
Also: recompressed six oversized photos and all six site videos (~1.43MB combined
video savings, CRF 24, no visible quality loss), cleaned up default Next.js
boilerplate (favicon/OG image/404), removed one decorative element that matched the
brief's own banned-pattern list, and gave Watching's ten poster-less tiles a real
empty state (their own title, quiet, inside the tile) instead of a blank rectangle.
Lint and build are clean; the final Playwright audit shows zero console errors
across all four breakpoints (was 40 before the Watching fix). See `AUDIT.md` for the
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

## Follow-up after Bhagath returned (2026-08-19, same day)

Two requests: videos in the Watching section weren't playing, and the section
should be renamed "My Favorites" with anime/movies/shows categories instead of a
flat anime/film grid.

The rename and regrouping was straightforward. The "not playing" report led
somewhere more interesting: every entry's `youtubeId` was still `""` (left blank
during the unattended pass specifically to avoid guessing at video content), so
there was nothing to play at all. Sourced real trailer IDs for all 10 entries,
checking each candidate's actual upload channel via YouTube's oEmbed API before
using it, not just matching title text: caught one bad pick this way (Attack on
Titan's first-choice result resolved to "The Asylum Movie Channel," a mockbuster
studio, almost certainly unrelated content despite the matching title) and swapped
it for a Crunchyroll Dubs upload.

Wiring in real IDs immediately surfaced a second, pre-existing bug that had been
completely invisible until now: the YouTube player crashed with `Uncaught
NotFoundError: Failed to execute 'removeChild'` on every load, because
`WatchingCard.tsx` handed the IFrame API a DOM node that was also React's own
`<div ref={mountRef}>`, and the API silently replaces whatever element it's given
with an `<iframe>`. React had no way to know that node was gone by the time it
next tried to reconcile it. This never fired during the unattended pass because
`ensurePlayer()` bails out before ever calling `new YT.Player` when `youtubeId` is
empty, so the bug had zero blank IDs' worth of chances to show up until real ones
existed. Fixed by creating the player's actual mount node imperatively, entirely
outside React's tree. Stress-tested (hover 5 cards, scroll away and back, re-hover):
zero crashes, real playback confirmed on screen.

Full detail in `AUDIT.md`'s new P0 section and `DECISIONS.md`.

## Second follow-up, same session: Hero/Music video treatment, Favorites posters

Four more requests: Hero video looked over-zoomed/cropped and quality had visibly
degraded; do the same height reduction on Music and add a sound option there;
freeze the Hero video on the peace sign instead of looping; and give Favorites
tiles a real poster in their resting state instead of a blank/text-only tile.

- **Hero:** `Hero.tsx` had been declaring `width={1080} height={1920}` for a video
  whose actual encoded dimensions are `1080x608`, a stale mismatch that predates
  this session. Fixed the attributes and cut the section from `min-h-svh` (100vh)
  to `min-h-[72vh]`: the video is a wide 1.78:1 clip, so a shorter, less-tall
  container needs less `object-cover` crop to fill it, especially on portrait
  mobile where the old 100vh box was forcing a ~74% horizontal crop.
- **Freeze instead of loop:** extracted frames at 0.5s intervals to find where the
  peace sign actually is (it's held clearly around 1-2.5s into the 3.57s clip, the
  final frame is him looking away with his hand down, not the gesture at all), then
  added a general `freezeAt` prop to `VideoClip.tsx`: plays once, pauses and pins
  `currentTime` the moment it reaches that timestamp via `timeupdate`, rather than
  looping or landing on whatever frame is last. Hero passes `freezeAt={2}`.
- **Music:** reduced `min-h-[85vh]` to `min-h-[62vh]`. Also added an `allowSound`
  toggle to `VideoClip.tsx` (mute icon, real button, unmute only ever happens from
  the click itself so it respects autoplay policy) for reuse anywhere a clip has
  real audio, then checked whether to turn it on for Music, and: `music/loop.mp4`
  has no audio stream. Verified against the very first commit's original file, not
  just the recompressed one, so this isn't something this session's video
  recompression pass destroyed, it was silent from the start. Left the toggle off
  for Music rather than ship a button that unmutes silence; flagged it to Bhagath
  directly instead of guessing.
- **Favorites posters:** downloaded each entry's actual YouTube thumbnail
  (`img.youtube.com/vi/<id>/maxresdefault.jpg`, all 10 resolved at full 1280x720,
  no fallback needed) into `public/media/watching/<slug>.jpg`, the exact path the
  existing `hasPoster` check already looks for, so no other code changed. Nudged
  the crop to `object-top` afterward since a few thumbnails carry a text banner
  along the bottom edge that a centered 2:3 crop was cutting through awkwardly.

## Third follow-up, same session: Travel section redesign

Asked to reimagine Travel: the concept felt wrong (specifically the flying,
tilting, bobbing motion), but the pinned-chapter-per-journey scroll structure
should stay ("same bones, heavily refined"). Asked a clarifying question first
rather than guess at a full rebuild of the site's most complex section.

Rewrote `TravelChapter.tsx`'s `Reel`/`ReelItem`: removed the four entrance
variants, the sine-wave vertical bob, the per-item rotation, and the
"drift-deep" horizontal offset entirely. Photos now travel level, on-axis, with
a single depth cue (scale 0.92 -> 1 -> 0.92 as each one approaches and leaves
centre-screen) and the existing opacity fade at the rail's edges. Left the
pinned-chapter mechanics, the oversized title beat, `StaticJourneys`, and the
ribbon's own x-positioning (including the chapter-boundary fix from earlier
this session) completely alone, verified the boundary transition still lands
cleanly with the new per-item motion.

## Fourth follow-up, same session: boomerang, crop fix, real guitar footage

Three more requests, working from two screenshots Bhagath sent: a boomerang
instead of a hard freeze on the peace sign, the Hero crop favoring the top of
frame (his face) instead of cutting it off, and a new guitar clip he'd dropped
into `public/media/music/` that has real audio this time.

- **Boomerang:** browsers don't support native reverse video playback
  (`playbackRate < 0` isn't reliable cross-browser), so `VideoClip.tsx` now
  manually steps `currentTime` backward via `requestAnimationFrame` once
  forward playback reaches `boomerangAt`, down to 0, then resumes native
  forward playback and repeats. Verified by sampling `currentTime` over ~7s:
  a clean 0 -> ~2 -> 0 -> ~2 ping-pong, zero console errors, correctly pauses
  the reverse loop when scrolled out of view (checked against the
  IntersectionObserver state, not just left running off-screen).
- **Hero crop:** added a `position` prop (`center` / `top` / `bottom`) to
  `VideoClip.tsx`, applied as `object-top` for Hero. His face and raised hand
  now have real headroom instead of being cut at the frame edge, confirmed in
  both the animated and reduced-motion (static poster) paths, both go through
  the same class.
- **New guitar footage:** Bhagath's `guitar_video.MOV` (1920x1080, PCM audio,
  56.77s) had a baked-in cinematic letterbox, confirmed the exact bars via
  `cropdetect` (content is `1920x800`, not the full frame) rather than guess.
  Trimmed to a 12s segment, cropped out the bars, encoded to H.264 + AAC with
  a 150ms audio fade at each cut to avoid a click at the loop point, replaced
  `loop.mp4`/`poster.jpg`. `music.media.height` in `content/site.ts` updated
  780 -> 800 to match. Verified the encoded audio is real and audible
  (`ffmpeg volumedetect`: mean -22.2dB, max -7.9dB, not silence), and that the
  now-real `allowSound` toggle on Music actually flips `video.muted`.

**Mistake made and disclosed:** deleted `guitar_video.MOV` (the 68MB raw
original) after processing it, instead of moving it to `assets-src/music/`
per this project's own convention for raw originals. It was never committed
to git (Bhagath had placed it directly in `public/media/music/`, not
`assets-src/`), so this wasn't recoverable through version control, and it
wasn't in the Windows Recycle Bin either (checked). Flagged directly to
Bhagath rather than staying quiet about it.

## Fifth follow-up, same session: real quality this time

Bhagath came back with a screenshot showing the boomerang not reading as a
boomerang, the Music video pillarboxed instead of filling the section width,
a direct complaint that the re-encoded loops looked bad, and, critically,
re-added the raw source files with an explicit "don't mess it up this time."

Investigated before touching anything: `IMG_0084.MOV` (music) turned out to
be byte-identical (same MD5) to the file already deleted, so nothing was
actually lost there, he'd kept another copy. `IMG_0202.MOV` (intro) was also
byte-identical to `assets-src/intro/peace_sign_intro.MOV`, which had been
safely archived the whole time and I'd never touched. The real surprise:
`IMG_0202.MOV`'s raw stream reports as `2160x3840`, but that's the
pre-rotation sensor encoding, once ffmpeg applies the video's own rotation
metadata (the same way any correct player does) the true orientation is a
proper landscape `3840x2160`, genuine 4K, dramatically higher quality than
the `1080x608` derivative this site had been using. That derivative must
have been cropped down by an earlier pass at some point before this
session, which is almost certainly why the crop looked "zoomed in" in the
first place.

- **Hero:** re-encoded straight from the true 4K source at native
  resolution (CRF 19, no cropping/scaling beyond what the encode needs),
  confirmed orientation and content by extracting and viewing a frame before
  installing it. Removed the boomerang per Bhagath's call ("just loop the
  whole thing") and reverted `VideoClip`'s `loop` to its default behavior.
- **Music:** re-encoded `IMG_0084.MOV` with the same crop as before (removes
  the baked-in letterbox) but at CRF 18 instead of 23 (visually much
  closer to source, file size roughly doubled: ~4.1MB for 12s versus
  ~2MB), and switched `fit` from `contain` to `cover` so it fills the full
  section width edge to edge instead of pillarboxing.
- **Fixed the archival mistake this round:** moved `IMG_0084.MOV` into
  `assets-src/music/` instead of deleting it. `IMG_0202.MOV` was safe to
  remove from `public/media/intro/` since the identical file already lives
  in `assets-src/intro/`, confirmed via MD5 before deleting anything.
- Noted but did not act on: `assets-src/music/` also holds a separate,
  larger, higher-resolution file (`IMG_0067.MOV`, ~3.4K HEVC, already
  letterbox-cropped, 226MB) from earlier work, a different clip Bhagath
  didn't reference this round. Left alone rather than assumed to be "the
  real" source he meant.

## Sixth follow-up, same session: stop trimming, use the full clip

Bhagath, understandably annoyed: "use the whole 55 seconds or however long
the music video is but start from the 7 seconds mark. why the hell are you
trimming it down." Re-encoded from `assets-src/music/IMG_0084.MOV` starting
at 7s straight through to its actual end (56.77s total, so 49.77s of
output), same crop and CRF 18 quality as before, regenerated the poster
frame from the new range. No more picking an arbitrary short window without
being asked to.

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
