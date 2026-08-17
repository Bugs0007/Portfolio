# Portfolio Build Brief

**How to use this:** save this file as `BRIEF.md` in an empty project folder. Open Claude Code in that folder and say:

> Read BRIEF.md end to end. Don't write any code yet. Ask me the questions in Section 11, then produce the design plan in Section 6 and the phase plan in Section 9 for my approval.

Everything below is written for Claude, not for me.

---

## 1. Who this is for and what it is

You are building a personal portfolio site for **Bhagath Samalla** — a 2026 CS graduate from MGIT Hyderabad, backend/software engineer (Python, Django/DRF, AWS), currently interviewing for SDE roles.

The site has **two audiences in one scroll**, and this tension is the central design problem:

- **Audience A — recruiters and hiring managers.** They open the link from an email or a resume, give it 15–40 seconds, and want: is this person real, what have they shipped, can I contact them. They must be able to get what they need *without scrolling past the personal sections*.
- **Audience B — everyone else** (and recruiters who stay). Friends, collaborators, people who found the Instagram. For them the site is a personal showcase: music, travel, art, motorcycles, film.

**Design implication you must respect:** the professional block is short, dense, and skimmable. The personal block is long, photographic, and slow. Do not let the personal sections dilute the professional one, and do not let the professional one make the personal half feel like a resume appendix. A persistent, minimal nav (Résumé · GitHub · LinkedIn · Email) that survives the whole scroll is non-negotiable — it's the escape hatch for Audience A.

---

## 2. Section order (fixed — do not reorder)

1. **Hero** — name + a short intro that conveys the kind of person he is
2. **Work** — profession, experience, projects *(end of recruiter-critical content)*
3. **Music** — learning flute and guitar
4. **Travel** — trips and photography
5. **Art** — painting and sketching
6. **Riding** — motorcycle
7. **Watching** — TV shows, movies, anime
8. **Contact / footer**

There should be a clear, deliberate *seam* between section 2 and section 3 — a visual and tonal gear-change that tells the reader "the professional part is over, this is the personal part." Make that transition an intentional moment, not just another section boundary.

---

## 3. Content you already have

Use this as the real content. Don't write lorem ipsum, and don't invent achievements — if you need a fact that isn't here, put `<!-- NEEDS: ... -->` in the source and list it for me at the end of the phase.

### Professional facts

- B.Tech Computer Science, Mahatma Gandhi Institute of Technology (MGIT), Hyderabad — 2026. CGPA 8.15, no backlogs.
- Based in Hyderabad.
- Core stack: Python, Java, JavaScript, C, SQL · Django, DRF, Flask, REST APIs, JWT, OAuth2, microservices · PostgreSQL, MySQL, Redis, pgvector · AWS (EC2, S3, Lambda, SQS, EventBridge) · CI/CD via GitHub Actions · LangGraph, MCP, RAG, multi-step LLM orchestration.
- GitHub: `@Bugs0007`.

### Experience — Brynklabs (software development intern, through March 2026)

- Built a notification microservice on AWS SQS + Lambda.
- Built an MCP integration for **Gathr** — conversational event booking surfaced through ChatGPT Apps.
- **Truspace** (Vastu report generation): end-to-end work on the customer-facing app, the admin web app, and the backend; S3 / Lambda / EventBridge / EC2; set up CI/CD for backend deploys; shipped the app to both the App Store and Play Store.
- Built a login SDK integrating Firebase and FCM tokens.

### Projects

- **CaseIntel** — multi-tenant legal case management platform, live at `caseintel.in`. Django + LangGraph, hybrid pgvector + full-text search with RRF reranking and HyDE query expansion, eCourts integration (advocate search, cause-list PDF parsing, order tracking), invoicing. Next.js frontend on Vercel, backend on AWS (EC2, RDS/pgvector, Nginx/gunicorn), CI/CD. Real users: advocates at a working law office.
- **Composite Sketch & Criminal Face Identification System** — FaceNet, DeepFace, pix2pix GANs, dlib.
- **YouTube Shorts automation pipeline** — Groq + edge-tts + ComfyUI, Ken Burns animation, automated upload via YouTube Data API v3.

**How to present these:** for each project, lead with what it *does for someone*, then the interesting engineering decision, then the stack as small utility type. Do not write "Leveraged cutting-edge technologies to build a robust solution." Write like an engineer explaining a thing they actually built to another engineer. Short sentences. Specific nouns.

### Personal sections — what's known so far

- **Music:** learning flute and guitar. Flute goal: the Krrish theme (Raga Hamsadhvani).
- **Travel:** recent trips include Zanskar Valley (Ladakh), Manali, Coimbatore, Ooty, Kedarnath, Badrinath, Haridwar. More to be added — build the data structure so trips are easy to append.
- **Art:** paints and sketches.
- **Riding:** motorcycle. *(Ask me for the bike, and any specific rides worth naming.)*
- **Watching:** favorites list coming later. Build the section to render from a data file that's currently mostly empty, with a real empty-state — don't stub it with placeholder titles.

---

## 4. Assets

### Source location

`C:\Users\Bhagath\OneDrive\Pictures\bhagath_portfolio` — photos and videos, partially populated, more coming.

**Do not import from OneDrive at build time.** Set up:

- `assets-src/` in the repo — gitignored, this is where raw originals get copied to.
- A documented one-liner (PowerShell or Node) that syncs from the OneDrive folder into `assets-src/`, preserving the subfolder-per-section structure.
- `public/media/` — generated derivatives, committed or built in CI, your call. Justify the choice.

### Processing pipeline

Write a real script (`scripts/process-media.mjs`), idempotent, skips files whose output already exists:

- **Images:** `sharp` → AVIF + WebP at a defined width ladder, plus a tiny base64 LQIP for blur-up. Emit width/height so nothing ever causes layout shift.
- **Video:** `ffmpeg` → H.264 MP4 (compatibility) + WebM (size), a poster JPG from a chosen frame, and a muted/silent variant for autoplay loops. Cap the long edge; nobody needs 4K in a scroll section.
- **EXIF:** read with `exifr`. Capture date, camera/lens, and GPS where present.
- **Output:** `content/media-manifest.json` — one entry per asset with path, dimensions, LQIP, EXIF, and the section it belongs to.

The EXIF GPS data is the most interesting raw material on this project. Think hard about whether the travel section should be driven by it.

### Instagram

**Do not scrape Instagram and do not use third-party downloader sites.** Those violate Meta's terms, break constantly, and several of them are outright malware. Also — you can't log in as him, so this isn't a thing you can do regardless of what the site claims.

The correct path, which he does manually, once:

> Instagram → profile → menu (☰) → **Accounts Center** → **Your information and permissions** → **Download your information** → Download or transfer information → select the account → choose **Posts, Stories, Reels** → format **JSON**, media quality **High** → Create files. Meta emails a ZIP within a few hours to a couple of days.

What *you* do: write `scripts/import-instagram.mjs` that takes the extracted export folder, parses `content/posts_1.json`, `stories.json`, and `reels.json`, and copies the referenced media out of the export's `media/` tree into `assets-src/<section>/` — using the post captions and timestamps to suggest a section, but writing a review file rather than auto-filing. He confirms the mapping; you don't guess silently.

---

## 5. Technical stack

Default to this unless you have a specific reason to deviate, in which case say so before building:

- **Next.js (App Router) + TypeScript**, deployed on Vercel. He already runs a Next.js frontend on Vercel for CaseIntel, so this is familiar ground.
- **Tailwind** for layout and spacing; a small set of CSS custom properties for the design tokens so the palette lives in one place.
- **Motion (Framer Motion)** for component-level animation, **Lenis** for smooth scroll. Add **GSAP ScrollTrigger** only if a specific effect genuinely needs it — don't pull in three animation libraries by default.
- **next/image** everywhere, with the LQIP from the manifest as `blurDataURL`.
- Content in typed data files (`content/*.ts` or MDX) — never hardcoded in JSX. He will edit these himself.
- No CMS. No database. This is a static site.

---

## 6. Design direction — do this before writing code

The reference sites he loves: `landonorris.com`, `charlesleclerc.com`. He also follows F1, which is worth knowing: part of what he responds to in those sites is the sport, not just the design. **Do not build an F1-driver site for a backend engineer.** Copying the racing aesthetic onto a portfolio it doesn't belong to is the single most likely way this project ends up feeling wrong.

What's actually transferable from those two:

- Full-bleed photography carrying the emotional weight; type sitting *on* the image rather than beside it
- Very large display type, very few words
- Chapters that take over the viewport, one idea at a time
- Almost no UI chrome — no cards, no shadows, minimal borders
- Motion that is scroll-driven and continuous, not hover-triggered and scattered

Also referenced: `styles.refero.design` — a gallery of real product UI organized by visual style. Use it as a vocabulary source, not a template. Pick a named direction and commit to it; don't blend five.

### Required process

Work in two passes and show me the first before you build.

**Pass 1 — the plan.** Produce a compact token system:

- **Color:** 4–6 named hex values. Derive them from his actual photographs (Ladakh cold blues and stone greys, Ooty greens, workshop/sketch paper, tail lights) rather than from a palette generator.
- **Type:** at least two roles — a characterful display face used with restraint, a body face that reads well at length, and a utility face for captions, EXIF data, and stack labels. Do not pair Inter with a generic geometric sans and call it done.
- **Layout:** one-sentence prose per section plus ASCII wireframes, so we can compare structures cheaply.
- **Signature:** the single element this site will be remembered by.

**Pass 2 — critique the plan before building.** Ask yourself: is this what I would produce for *any* portfolio brief, or is it specific to this person? Specifically avoid these three defaults, all of which are AI-design tells right now:

1. Warm cream background (#F4F1EA-ish) + high-contrast serif + terracotta accent
2. Near-black background + one acid-green or vermilion accent
3. Broadsheet layout, hairline rules, zero border-radius, dense columns

Any of them can be right for some brief. None of them should be chosen by default. Revise whatever reads as generic and tell me what you changed and why.

**Be honest about scale.** The reference sites were built by agencies with commissioned photography, custom type licences, and WebGL budgets. This is one person and a Claude subscription. The way to get within striking distance is **one signature moment executed properly**, with everything around it quiet and disciplined — not five effects each at 60%.

---

## 7. Motion

Pick **one** signature motion moment and build it well. Candidates, in rough order of how well they fit the content:

- A travel section where scroll drives movement across a map, with photos surfacing at their real GPS coordinates from the EXIF data
- A hero where his own footage plays behind the type and the type responds to scroll velocity
- A section-to-section transition where the dominant colour of the incoming section's photography bleeds into the outgoing one
- A "watching" section as a horizontally-scrolling reel rather than a grid

Everywhere else: restraint. Fades and small translations on entry, one consistent easing curve, one consistent duration scale. If a reader would notice the animation *as* animation, it's too much.

**Non-negotiable:** `prefers-reduced-motion: reduce` disables all of it and the site remains completely usable and good-looking. Not a degraded fallback — a deliberate static version.

---

## 8. Quality floor

Build to these without announcing them:

- Real mobile layouts, designed rather than reflowed. Assume a meaningful share of traffic is a recruiter on a phone.
- LCP under 2.5s on a mid-range Android over 4G. The hero video must not block first paint — poster image first, video swapped in after.
- Videos: `muted`, `playsInline`, `loop`, `preload="metadata"`, and play/pause driven by IntersectionObserver. Never more than one video decoding at a time.
- Zero cumulative layout shift. Every image and video has explicit dimensions from the manifest.
- Visible keyboard focus everywhere. Semantic landmarks. Alt text written per image — real descriptions, not filenames.
- Open Graph image and metadata, so the link previews properly when he pastes it into an application or a DM.
- No analytics that requires a cookie banner. If analytics at all, Vercel Analytics or Plausible.

---

## 9. Build phases

Stop at the end of each phase, show me what exists, and wait. Commit at every phase boundary with a real message.

| Phase | Deliverable |
|---|---|
| 0 | Questions from Section 11 answered; design plan from Section 6 approved |
| 1 | Repo scaffold, tokens, type scale, layout primitives, a rendered style-tile page at `/styleguide` |
| 2 | Media pipeline scripts + manifest, run against whatever is currently in the folder |
| 3 | Hero + Work sections, complete and deployed to a Vercel preview — this alone is a usable recruiter link |
| 4 | The section-2-to-3 seam, plus Music and Travel |
| 5 | Art, Riding, Watching, Contact |
| 6 | The signature motion moment |
| 7 | Performance pass, accessibility pass, reduced-motion pass, metadata, real device check |

Phase 3 shipping on its own is deliberate. He is job hunting now; a live link with the professional half finished is worth more this week than a complete site in three.

Maintain a `CLAUDE.md` with the token values, the content-file conventions, and the media pipeline commands. Keep it under ~200 lines.

---

## 10. Do not

- Do not use stock photography or AI-generated imagery anywhere. Every image is his. If a section lacks assets, design the empty state honestly and tell me what to shoot.
- Do not write copy in the register of "passionate developer with a keen eye for innovative solutions." First person, plain, specific, occasionally funny. When in doubt, fewer words.
- Do not add a skills bar chart, a percentage proficiency meter, a "years of experience" counter, or a testimonial section.
- Do not add a blog he won't write, or a newsletter signup.
- Do not scrape Instagram (see Section 4).
- Do not build a custom cursor unless the design plan specifically argues for one.
- Do not put the personal sections above the professional ones on mobile "because it looks better."

---

## 11. Ask me these before you start

1. Domain — is one bought, or do I need to pick one?
2. The bike, and any rides worth naming in the Riding section.
3. Résumé: link to a PDF, or a rendered HTML version?
4. Should there be a contact form, or just an email link?
5. Anything in the photo folder that is explicitly *not* for public use?
6. How much do I want people to see the Instagram — link, or embedded content?
7. Do I want the site to name my current employment status, or stay neutral on it?
