@AGENTS.md

# Bhagath's portfolio site

Next.js (App Router) + TypeScript + Tailwind v4. See `BRIEF.md` for the full spec, this
file is the quick-reference for continuing the build.

## Status

This is a **direction demo**, built ahead of the formal phase plan to validate the design
before committing to it. It is not phase-complete: no media pipeline script yet, no
styleguide page, GPS coordinates in `src/content/site.ts` are place-level lookups, not
real EXIF. Treat `BRIEF.md` Section 9 as the source of truth for what's actually left.

Style note: no em dashes anywhere on the site or in this codebase, including comments.
Use commas, periods, colons, or parentheses instead.

## Design tokens (`src/app/globals.css`)

Six colors, each traced to a real photo or brief note, not a generator:

| Token | Hex | Source |
|---|---|---|
| `--ink` | `#0d1219` | Zanskar night sky |
| `--stone` | `#8b8478` | fog-wrapped peak rock |
| `--mist` | `#e4e0d6` | cloud light off the same peak |
| `--moss` | `#77864a` | Zanskar high pasture |
| `--jacket` / `--jacket-bright` | `#2f6e80` / `#4a95a8` | the jacket worn in most travel photos, the signature accent |
| `--ember` | `#b23a2e` | tail-light red, Riding section only |

Exposed to Tailwind via `@theme inline` as `bg-ink`, `text-jacket-bright`, `fill-stone`, etc.

Fonts, same mechanism (`--font-display` / `--font-body` / `--font-mono`):
- **Fraunces**, display face, hero name + chapter titles only, restraint.
- **Hanken Grotesk**, body copy.
- **JetBrains Mono**, stack tags, EXIF/coordinate captions, nav labels.

One easing curve, one duration scale: `cubic-bezier(0.16, 1, 0.3, 1)`, 700ms, used by every
`<Reveal>` entry animation. The Travel section's flying-photo transitions run faster
(850ms) since it's the signature moment. `prefers-reduced-motion: reduce` disables Lenis
entirely (`src/components/SmoothScroll.tsx`) and swaps every scroll-driven effect
(Travel's flying photos, Music/Riding's video) for a static equivalent, not a degraded one.

## Content conventions

All real content lives in `src/content/site.ts`, typed, no hardcoded copy in JSX.
Unresolved facts are marked `// NEEDS: ...` inline, grep for `NEEDS` before treating
anything as final. Current open items:
- `riding.bike`, real make/model. Several bikes show up in photos, unconfirmed which is his.
- `trips[].blurb`, still empty for Badrinath and Mana Village.
- `watching`, titles are real (`src/content/watching.ts`) but every entry still needs
  a real `youtubeId`/`startSeconds` and a `public/media/watching/<slug>.jpg` poster.
  `WatchingCard` never requests a poster that doesn't exist (checked server-side in
  `Watching.tsx` via `existsSync`, not client-side `onError`), so dropping a real
  `<slug>.jpg` in place is the only step needed to light one up, no other code
  changes. Same for a real `youtubeId`: leave it `""` and the card never tries to
  create a player.

Resolved this round: `person.linkedin`, `person.instagram`, `person.email` are real.
`riding.namedRides` has Parigi. Ooty and Haridwar are deliberately left out of `trips`
(no usable photo yet), easy to add back later.

## Media

- `assets-src/` (gitignored) holds raw originals, synced in locally from
  `C:\Users\Bhagath\OneDrive\Pictures\bhagath_portfolio` rather than read over the OneDrive
  path directly. Reading HEIC/video straight off OneDrive was slow (cloud placeholder
  files); a local copy fixed that. Subfolder-per-section structure: `art/`, `bike/`,
  `music/`, `travel/`. Only files with descriptive labels (not `IMG_####`) get used,
  that's the signal Bhagath has actually reviewed them.
- `public/media/<section>/` holds web-ready derivatives, committed. For this demo pass
  they were hand-processed with `sharp` (images, one-off scripts, not committed) and
  `ffmpeg` (video posters/clips, and as a fallback for HEIC files sharp's libheif rejects,
  some iPhone photos have more image references in their `iref` box than sharp's safety
  limit allows). The real `scripts/process-media.mjs` (AVIF+WebP+LQIP+EXIF+manifest, per
  BRIEF.md Section 4) is Phase 2 work and does not exist yet.
- Art and Riding both have real photos now (3 paintings, 5 bike/ride photos + a video
  clip). Nothing in `public/media` is stock or AI-generated.
- Coordinates shown on the site come from real GPS EXIF and are only rendered where the
  original file actually carried it (5 of the travel photos). Everywhere else the
  coordinate is simply absent rather than filled in with a place-level lookup, so a
  number on screen always means a real one read off the photo.

## Travel section

The signature moment (BRIEF.md Section 7), in `TravelMap.tsx`.

Content is grouped into **journeys**, not individual stops: one entry per actual trip,
each holding all its photos and videos. Grouping is backed by EXIF capture dates read
with `exifr`, which confirmed the Zanskar run (Sethan, Jispa, Gonbo Rangjon, Pensi La,
the three Zanskar frames, Zangla Palace) really is one trip, 31 May to 7 June, and that
the Manali snow photos are a separate January one.

Each journey's media are laid out end to end in a ribbon and flowed across the viewport
as a group. Every item rides a sine curve as it crosses (`y`, `rotate` and `scale` all
derive from its current on-screen x), so the set moves like a current rather than cards
being dealt. Scroll length per journey scales with its media count so each photo gets
about the same screen time.

Videos in Travel play inline through the shared `VideoClip`, same as Music and Riding.
They are never flattened to stills; the `.jpg` next to each `.mp4` is only the poster
frame.

Three earlier versions were tried and dropped: a dot-scatter "constellation" and an
orthographic rotating globe (both too abstract, the globe looked bad outright), then a
one-photo-at-a-time card flight (split up photos that belong to the same trip).

`StaticJourneys` is the reduced-motion version *and* the server-rendered one, so all of
the current 18 media items are in the HTML for no-JS and for crawlers; the flowing
version takes over after mount.

Each chapter's `position:sticky` pin releases with exactly one viewport-height of
scroll still left in its container (inherent to a sticky child inside a tall
container, not tunable away). `TravelChapter.tsx`'s `Reel` deliberately stops the
ribbon short of `-ribbonWidth` (`-ribbonWidth + vw * 0.6`) so the last photo is still
on screen at release and rides away with the natural unpin scroll, instead of
already having faded to nothing and leaving that trailing screen blank. If you touch
the ribbon's `x` transform, re-check this: it's easy to reintroduce a dead zone at
every chapter boundary without it being obvious from a quick look, only shows up
scrolling through slowly or with a `scrollYProgress` debug readout.

## Reduced motion

Use `usePrefersReducedMotion` from `src/hooks/`, never Motion's `useReducedMotion`, for
anything that picks a render branch. Motion's hook reads `matchMedia` synchronously
during render, so it returns `null` on the server and the real value during hydration,
and any component branching on it renders two different trees and throws a hydration
mismatch. The local hook uses `useSyncExternalStore` with an explicit server snapshot,
which is the supported way to do this.

## Running it

```bash
npm run dev
```

`.claude/launch.json` is configured for `preview_start` on port 3000.
