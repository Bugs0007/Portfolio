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
chapter per featured item, drawn via `pathLength` + `strokeDashoffset` read off scroll
position.

The diagrams are a **hybrid, not SVG**. Nodes are HTML divs the browser sizes from their
own text (`width: max-content` between a min and a max that wraps); edges are one SVG
layer behind them, computed from the measured rects. This is structural, not cosmetic:
the previous version estimated node width from label character count and dropped edge
labels at the midpoint of two node *centres*, which is what produced every clipped pill
and every metric sitting on top of a box. A node can no longer be narrower than its
content, and a label can no longer land on a node, because the two live in bands that
never overlap.

The pieces, in `src/components/work/modes/`:

- `diagram-spec.ts`, the shape (lanes, rows, slots, stacks, groups, anchors, edges) plus
  `deriveTiming`. **No geometry**, so nothing here can encode a width. Reveal times are
  derived from lane order and slot depth, never hand-tuned: at roughly forty nodes,
  hand-tuning would be forty numbers that rot the moment a step is inserted.
- `diagram-layout.ts`, pure geometry: band stacking, port selection, cubics, the label
  sweep, `tuneGaps`, `fitScale`, `computeFit`. No React, no DOM.
- `specs/brynklabs.ts` and `specs/caseintel.ts`, the content.
- `Diagram.tsx`, measurement and rendering.
- `work-beats.ts`, `pinSpanFor` from the beat count. Deliberately not Travel's
  `railSpanForBeats`: a photo is glanced at, a diagram node is read.

Load-bearing details, all of them learned the hard way:

- Measure with **`offsetWidth`/`offsetHeight`, never `getBoundingClientRect`**. The stage
  carries the fit transform; `offset*` comes from the layout box and is immune to it,
  while `getBoundingClientRect` returns the scaled box and would feed a smaller content
  size back into the fit and oscillate. Everything measurable is tagged `data-mid` and
  read in one `querySelectorAll` pass, and a signature string guards the `setState` so
  the effect is idempotent under StrictMode, resize and `document.fonts.ready`.
- **Bands alternate**: node band, label band, node band. Every edge label sits in a label
  band with a short leader to its edge, and colliding labels drop into a second row via a
  greedy interval sweep (`sweepRows`). No label position is hand-placed.
- The label anchor is the **analytic Bezier midpoint**, `B(0.5) = (P0+3C1+3C2+P3)/8`, not
  the midpoint of two node centres, which sits well off the curve on exactly the edges
  that carry labels.
- Edge ports come from the **gap between measured rects**, not the centre delta. When two
  boxes overlap on an axis that axis is unavailable and the choice is forced, which is
  what the old `1.2` fudge factor was standing in for.
- Arrowheads are their own `motion.path` on their own window, **never `marker-end`**: a
  marker is placed by path geometry rather than stroke visibility, so it would sit at
  full opacity on its destination for the whole draw.
- `transformOrigin: "0 0"` on the stage is mandatory; the default would add a silent
  `(1-k)*size/2` term and the centring maths would stop matching. Pan lives on a separate
  outer element from the fit so the two cannot multiply.
- **Fit, then pan.** `fitScale` holds the legibility floor (`K_MIN` 0.78) when the
  composition nearly fits, which keeps the pan short and every lane on screen. When the
  composition is more than two frames tall it is a scroll-through anyway, so it takes
  whatever the width allows instead. `tuneGaps` runs one corrective layout pass, spending
  spare height on the band gaps and spare width on the step gaps.
- Reorientation to a top-to-bottom flow is **measured, not a breakpoint**: `needsReorient`
  asks whether the flow fits across the frame at a readable size. The two diagrams have
  very different natural widths, so the width at which one has to reorient is not the
  width at which the other does. `WorkRig` still picks the *preferred* orientation, and
  falls back to `Work.tsx` entirely under 640px wide or 640px tall.
- A lane that has handed off dims to `LANE_DIM` (0.5) and **never unmounts**. The dim
  lives on the lane wrapper and the 0 -> 1 reveal on the nodes: CSS opacity nests, so a
  lane fading in at the same time as its nodes would sit at 0.04 halfway through.

`globals.css`'s print block strips every transform, which is right for scroll state but
would collapse all forty nodes onto the origin now that layout *is* transforms. Print
therefore hides `[data-diagram-frame]`; the heading, bullets, metrics and tags still print.

`Work.tsx` is the fallback and is a real, complete layout rather than a degraded one:
it is the server render, the no-JS output, and what `prefers-reduced-motion` gets. It
holds every bullet and every metric, so nothing is lost by landing there. It is
**unchanged** by the diagram rebuild. CaseIntel architecture terms that have no step in a
flow went into `workItems.caseintel.stack` instead, which extends `projects[0].stack`
rather than editing it, so the classic project card is untouched.

Work also had a `?workMode` rig (tube/product/metrics/terminal, tube on Three.js).
**Deleted**, along with the dependency: `three`, `@react-three/fiber` and
`@types/three` are uninstalled and nothing imports WebGL anywhere. The `WorkItem` /
`WorkMetric` split in `site.ts` stays, because the extracted numbers are what pipeline
rides along its edges.

`.verify/` holds the Playwright audits: `layout.mjs` (clipping and overflow, including
the 150% and 200% zoom cases as proportionally smaller viewports, which is what browser
zoom actually does), `diagram-geom.mjs` (no node overlaps, no label on a node, nothing
outside its frame), `findable.mjs` (every diagram term reachable by Ctrl+F) and
`reverse.mjs` (scroll-up reverses exactly). They default to port 3100; set
`VERIFY_BASE=http://localhost:3000` to point them at the normal dev server.

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
