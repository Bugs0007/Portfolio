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
- `art.pieces` holds 9: 3 paintings + 6 sketchbook pages. A 7th sketch was expected
  but the seventh photo turned out to be the sketchbook's *cover*, not artwork, so it
  is deliberately not in the data. Adding it later is one entry, nothing else.
- `workItems[].media` is still empty for every item, so nothing in Work renders a
  screenshot yet. Nothing is generated to fill the gap.
- `watching` (rendered as "My Favorites", `src/components/Watching.tsx`), grouped
  into anime/movie/show. All 10 current entries have real, individually-verified
  trailer IDs and a real `public/media/watching/<slug>.jpg` poster; `show` has zero
  entries so far and its heading is simply skipped (`Watching.tsx` hides any category
  with nothing in it). `WatchingCard` never requests a poster that doesn't exist
  (checked server-side via `existsSync`, not client-side `onError`), so a future
  entry only needs a real `<slug>.jpg` dropped in place to light up, no other code
  changes. Grid is 5 columns at desktop width (`2 / 3 / 5` across breakpoints) so a
  5-entry category fills exactly one row instead of wrapping, kept deliberately
  compact after Bhagath flagged the section as taking too much space.
- `WatchingCard`'s YouTube player target is a plain DOM node created imperatively
  inside a React-owned wrapper, never a node that's part of this component's own
  JSX. The IFrame API replaces whatever element it's given with an `<iframe>`; if
  that element were React-rendered, React would later try to reconcile a node the
  API already swapped out from under it and throw `Failed to execute 'removeChild'`.
  Don't hand `new YT.Player(...)` a ref'd JSX element directly, hand it a node you
  created yourself. The node also has to still be *attached* when the API finally
  resolves: React 19 remounts every component once in dev, and constructing a player
  on the node left over from the discarded mount is what produced "The YouTube player
  is not attached to the DOM" once per card. `ensurePlayer` checks
  `mountEl.isConnected && mountEl.parentNode === wrapperRef.current` before
  constructing, and teardown destroys the player and removes the node.

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

Each journey pins for a few viewport-heights: an oversized title beat for the first
`100vh`, then the rest of the scroll drives **two parallel columns** of that trip's
media travelling in opposite directions. All of it lives in `TravelChapter.tsx`, top
to bottom, with only `MediaTile`/`layOut` (`travel/modes/shared.tsx`) and the beat
maths (`src/lib/travel-beats.ts`) imported.

How the columns work, since the numbers are all load-bearing:
- Media is grouped into a bounded number of **beats** so scroll length tracks beat
  count rather than raw photo count. Span is `railSpanForBeats(columnsBeats(n), 0.7)`.
- Two columns inside a centred container (`76vw`, capped at `1280px`); phones collapse
  to one column at ~`92vw` once a two-up tile would fall under `68vw`. The cap is 1280
  and not lower because anything tighter makes a two-column tile *narrower* than the
  old three-column layout above ~1900px, which was the whole point of dropping to two.
- Beats are dealt to whichever column is currently **shortest in pixels**, not
  round-robin, because a portrait frame is more than twice the height of a landscape
  one and balancing counts does not balance heights. Balanced heights are what keep
  both columns still full at the end of the span.
- The 0.85x/1.15x speed difference is applied to **velocity, not distance**: one column
  runs `0.85p + 0.15p²`. Scaling travel distance instead overshoots a tall column off
  screen and reintroduces the empty-column-at-the-end problem. Because the eased column
  is slower early and faster late, neither is the fast one throughout, so neither reads
  as the main one.
- Emphasis is by vertical position, not by column: a tile is largest and brightest as
  it crosses the middle of the frame (`scale` 1 → 0.94, `opacity` 1 → 0.55), with the
  same curve on both columns.

Videos in Travel play inline through the shared `VideoClip`, same as Music and Riding.
They are never flattened to stills; the `.jpg` next to each `.mp4` is only the poster
frame.

This section was, for a while, a rig comparing fifteen interchangeable gallery
treatments behind a `?travelMode` query param with a dev switcher. **That is all
deleted.** Columns won; there is no mode contract, no registry, no lazy boundary and no
query param left. Earlier dropped attempts, for the record: a dot-scatter
"constellation", an orthographic rotating globe (both too abstract), and a
one-photo-at-a-time card flight (split up photos belonging to the same trip).

`StaticJourneys` is the reduced-motion version *and* the server-rendered one, so all of
the current 35 media items (Zanskar 15, Manali 8, Coimbatore 8, Uttarakhand 4) are in
the HTML for no-JS and for crawlers; the flowing version takes over after mount.

Each chapter's `position:sticky` pin releases with exactly one viewport-height of
scroll still left in its container (inherent to a sticky child inside a tall
container, not tunable away). Every chapter therefore has a short blank stretch at its
boundary; that is the sticky release, not a bug in the layout, and it predates the
columns treatment. The column endpoints (`enter = vh * 0.55`, `exit = -(contentHeight -
vh * 0.45)`) are chosen so both columns are still framed at both ends of the span
rather than running off into it.

## Work section

`WorkRig.tsx` renders `PipelineMode`: scroll-driven architecture diagrams, one pinned
chapter per featured item, with SVG paths drawn via `pathLength` + `strokeDashoffset`
read off scroll position.

`Work.tsx` is the fallback and is a real, complete layout rather than a degraded one:
it is the server render, the no-JS output, and what `prefers-reduced-motion` gets. It
holds every bullet and every metric, so nothing is lost by landing there.

Work also had a `?workMode` rig (tube/product/metrics/terminal, tube on Three.js).
**Deleted**, along with the dependency: `three`, `@react-three/fiber` and
`@types/three` are uninstalled and nothing imports WebGL anywhere. The `WorkItem` /
`WorkMetric` split in `site.ts` stays, because the extracted numbers are what pipeline
rides along its edges.

## Art section

Justified rows, two labelled groups (Paintings, Sketches), in `ArtGallery.tsx`. Rows
solve for a height that makes each row's natural widths fill the container, so nothing
is ever cropped and the differing proportions become the composition; a trailing row
keeps its natural height instead of stretching. Clicking any piece opens a lightbox
that runs both groups as one sequence (arrows, swipe, Esc, focus trap, focus restored
to the trigger).

The lightbox's scroll lock pins `body` with `position: fixed` at the current offset and
restores it on close. It deliberately does **not** set `overflow: hidden` on `html`,
which would stop Lenis dead (see Reduced motion / the scrollbar note below).

The only motion is a one-shot fade + 12px rise as rows arrive, staggered 40ms within a
row, latched on so it never replays or reverses on scroll-up. This section was briefly
a drag-to-explore pannable canvas with cursor drift and inertia; it was removed because
the interaction was doing more work than the pictures were.

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
