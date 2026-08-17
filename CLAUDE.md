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
- `watching`, empty by design until Bhagath sends a list.

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

## Travel section

The signature moment (BRIEF.md Section 7). Scroll pins the section for `trips.length *
70vh`; each trip's photo flies in from an assigned direction (alternating left/right/top/
bottom) and flies out the opposite side when the next trip becomes active, in
`TravelMap.tsx`. Two earlier versions of this (a dot-scatter "constellation" and an
orthographic rotating globe) were tried and dropped, first for being too abstract, then
for looking bad outright. `useReducedMotion` swaps the whole thing for `StaticTravelList`,
a plain stacked list, no flying, no pinning.

## Running it

```bash
npm run dev
```

`.claude/launch.json` is configured for `preview_start` on port 3000.
