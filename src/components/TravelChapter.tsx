"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import type { Journey, JourneyMedia } from "@/content/site";
import { beatCountFor, chunkMedia, railSpanForBeats } from "@/lib/travel-beats";
import { MediaTile, layOut } from "./travel/modes/shared";

// The pinned-chapter treatment: each journey gets its own pin, opening with an
// oversized title beat, then converting further scroll into two parallel
// columns of photographs travelling in opposite directions. Nothing here plays
// on a timer, every motion value is a direct read of scroll position,
// reversible in both directions.
//
// This used to be one of fifteen interchangeable rail treatments behind a
// ?travelMode switch. The comparison is over, columns won, and the rig it was
// judged in is gone: the layout is inlined below rather than reached through a
// one-entry registry.

// --- span -------------------------------------------------------------------

// Media is grouped into a bounded number of beats so scroll length tracks beat
// count rather than raw photo count: a 15-item journey takes about twice the
// scroll of a 4-item one, not four times. Two columns instead of three means
// each carries about half again as much, so a beat needs more vertical
// distance to cross the frame at the same apparent speed.
const PER_BEAT_VH = 0.7;

function columnsBeats(n: number) {
  return beatCountFor(n, { base: 6, growth: 1.3, min: Math.min(6, n) || 1, max: 12 });
}

function railSpanFor(mediaCount: number) {
  return railSpanForBeats(columnsBeats(mediaCount), PER_BEAT_VH);
}

// Two columns in a 76vw container (capped 1280) is about 37vw per tile at
// common desktop widths; phones collapse to a single ~92vw column.
function sizesFor(isNarrow: boolean) {
  return isNarrow ? "92vw" : "37vw";
}

// --- layout constants -------------------------------------------------------

// Container: 76vw, capped. The cap is 1280 rather than a tighter number
// because anything under about 1264 makes a two-column tile *narrower* than
// the old three-column layout from ~1900px up, which would have defeated the
// point of dropping to two columns. Past ~1940 the centred cap holds
// deliberately, which is what a max-width is for.
const COLUMN_MAX = 1280;
const CONTAINER_VW = 0.76;
// Phones get the container nearly full-bleed; there is no peripheral-vision
// problem to solve at 375px, only a too-small-to-read one.
const NARROW_CONTAINER_VW = 0.92;

// A two-column split is only worth having while each tile stays wide enough to
// read. Below this it collapses to a single column rather than showing two
// columns of postage stamps.
const MIN_TILE_VW = 0.68;

export function TravelChapter({
  journey,
  index,
  total,
}: {
  journey: Journey;
  index: number;
  total: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ vw: 0, vh: 0 });

  useEffect(() => {
    const measure = () =>
      setSize({ vw: window.innerWidth, vh: window.innerHeight });
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const isNarrow = size.vw > 0 && size.vw < 640;

  // One full viewport height for the title beat, then room for the columns.
  const introSpan = 1;
  const railSpan = railSpanFor(journey.media.length);
  const sizes = sizesFor(isNarrow);
  const totalSpan = introSpan + railSpan;
  const introFraction = introSpan / totalSpan;

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const railProgress = useTransform(scrollYProgress, [introFraction, 1], [0, 1]);

  return (
    <section aria-label={`${journey.title} chapter`} className="relative bg-ink">
      <div
        ref={containerRef}
        style={{ height: `${totalSpan * 100}vh` }}
        className="relative"
      >
        <div className="sticky top-0 flex h-screen w-full flex-col overflow-hidden">
          <ChapterHeader
            journey={journey}
            index={index}
            total={total}
            scrollYProgress={scrollYProgress}
            introFraction={introFraction}
          />

          <div
            className="relative flex-1 overflow-hidden"
            style={{
              maskImage:
                "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
              WebkitMaskImage:
                "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
            }}
          >
            {size.vw > 0 && (
              <JourneyColumns
                journey={journey}
                progress={railProgress}
                vw={size.vw}
                vh={size.vh}
                isNarrow={isNarrow}
                sizes={sizes}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// The oversized title beat: fills the screen as the chapter opens, then
// dissolves as scroll hands off into the columns. A slim persistent header
// (trip name, when, region) fades in underneath as it goes, so context stays
// on screen for the rest of the scrub without a second big title.
function ChapterHeader({
  journey,
  index,
  total,
  scrollYProgress,
  introFraction,
}: {
  journey: Journey;
  index: number;
  total: number;
  scrollYProgress: MotionValue<number>;
  introFraction: number;
}) {
  // Kept short deliberately: this window is exactly what's on screen right as
  // the previous chapter's last photo has already faded off, so the longer
  // this ramp, the longer the screen sits empty between chapters.
  const revealOpacity = useTransform(
    scrollYProgress,
    [0, introFraction * 0.18],
    [0, 1],
  );
  const revealY = useTransform(scrollYProgress, [0, introFraction * 0.18], [40, 0]);
  const dividerScale = useTransform(
    scrollYProgress,
    [0, introFraction],
    [0.94, 1.04],
  );
  const holdOutOpacity = useTransform(
    scrollYProgress,
    [introFraction * 0.62, introFraction * 0.92],
    [1, 0],
  );
  const dividerOpacity = useTransform(
    [revealOpacity, holdOutOpacity],
    ([a, b]: number[]) => Math.min(a, b),
  );

  const infoOpacity = useTransform(
    scrollYProgress,
    [introFraction * 0.75, introFraction],
    [0, 1],
  );
  const infoY = useTransform(
    scrollYProgress,
    [introFraction * 0.75, introFraction],
    [16, 0],
  );

  // The oversized divider is sized off a single clamp rather than fixed vw
  // breakpoints, scaled down for longer titles ("Uttarakhand" vs "Zanskar")
  // so every chapter's title stays on one line at any width.
  const titleScale = Math.min(1, 11 / journey.title.length);
  const titleFontSize = `clamp(${(2.6 * titleScale).toFixed(2)}rem, ${(15 * titleScale).toFixed(2)}vw, ${(10.5 * titleScale).toFixed(2)}rem)`;

  return (
    <>
      <motion.div
        style={{ opacity: dividerOpacity }}
        className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-center px-6 sm:px-10 lg:px-16"
      >
        <p className="font-mono text-xs uppercase tracking-wider text-stone">
          {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          {"  "}— {journey.when}
        </p>
        <motion.h3
          style={{ y: revealY, scale: dividerScale, fontSize: titleFontSize }}
          className="mt-2 font-display font-medium leading-[0.88] text-mist"
        >
          {journey.title}
        </motion.h3>
      </motion.div>

      <motion.div
        style={{ opacity: infoOpacity, y: infoY }}
        className="absolute inset-x-0 top-0 z-10 flex items-baseline justify-between px-6 pt-20 sm:px-10 lg:px-16"
      >
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-stone">
            {journey.title}
          </p>
          <p className="font-mono text-[11px] text-stone/70">{journey.region}</p>
        </div>
        <p className="font-mono text-xs uppercase tracking-wider text-stone/70">
          {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </p>
      </motion.div>
    </>
  );
}

// Two parallel columns travelling in opposite directions inside a centred
// container.
//
// This was three full-bleed columns first, and the outer two sat far enough
// into peripheral vision that the middle one read as the subject and they read
// as decoration. Two columns inside a narrower container fixes both halves of
// that: neither column is "the outer one" any more, and dropping a column
// while narrowing the container still leaves each photograph meaningfully
// larger than it was at three.
//
// Emphasis is earned by vertical position instead of by column: an item is
// biggest and brightest as it crosses the middle of the viewport, and the same
// curve is applied to both columns so neither is structurally favoured.
function JourneyColumns({
  journey,
  progress,
  vw,
  vh,
  isNarrow,
  sizes,
}: {
  journey: Journey;
  progress: MotionValue<number>;
  vw: number;
  vh: number;
  isNarrow: boolean;
  sizes: string;
}) {
  const beats = chunkMedia(journey.media, columnsBeats(journey.media.length));

  const containerWidth = isNarrow
    ? vw * NARROW_CONTAINER_VW
    : Math.min(vw * CONTAINER_VW, COLUMN_MAX);
  // clamp(16px, 2vw, 32px)
  const gap = Math.min(Math.max(16, vw * 0.02), 32);

  // Two columns unless that would put each tile under MIN_TILE_VW of the
  // viewport. At phone widths it always does (two columns inside a 92vw
  // container is about 44vw each), so phones resolve to one column, which is
  // the intent: one big photograph at a time rather than two small ones.
  const twoUpWidth = (containerWidth - gap) / 2;
  const columnCount = twoUpWidth >= vw * MIN_TILE_VW ? 2 : isNarrow ? 1 : 2;
  const columnWidth = columnCount === 2 ? twoUpWidth : containerWidth;

  // Vertical rhythm is looser than the horizontal gap because captions hang
  // below their tile and need somewhere to sit.
  const rowGap = gap + 22;

  if (beats.length === 0) return null;

  // Beats are dealt to whichever column is currently shortest in pixels, not
  // round-robin by count. The columns have to run out at the same time or one
  // of them ends the span empty, and a portrait frame (several here are
  // 1237x2200) is more than twice the height of a landscape one, so balancing
  // counts does not balance heights.
  const columns: JourneyMedia[][] = Array.from({ length: columnCount }, () => []);
  const heights = new Array(columnCount).fill(0);
  for (const items of beats) {
    let target = 0;
    for (let c = 1; c < columnCount; c++) {
      if (heights[c] < heights[target]) target = c;
    }
    for (const media of items) {
      columns[target].push(media);
      heights[target] += (columnWidth * media.height) / media.width + rowGap;
    }
  }

  const left = (vw - containerWidth) / 2;

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{
        // Only the very edge is masked. The per-item centre-band opacity below
        // does the gradual fade, and running both at full strength stacked two
        // fades on top of each other and crushed the top and bottom of the
        // frame.
        maskImage:
          "linear-gradient(to bottom, transparent, black 8%, black 92%, transparent)",
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent, black 8%, black 92%, transparent)",
      }}
    >
      {columns.map((items, i) => (
        <Column
          key={i}
          items={items}
          progress={progress}
          // One column up, one down. Index 1 also carries the eased timing
          // that produces the speed differential.
          direction={i % 2 === 0 ? 1 : -1}
          eased={i % 2 === 1}
          left={left + i * (columnWidth + gap)}
          width={columnWidth}
          vh={vh}
          gap={rowGap}
          sizes={sizes}
        />
      ))}
    </div>
  );
}

function Column({
  items,
  progress,
  direction,
  eased,
  left,
  width,
  vh,
  gap,
  sizes,
}: {
  items: JourneyMedia[];
  progress: MotionValue<number>;
  direction: number;
  eased: boolean;
  left: number;
  width: number;
  vh: number;
  gap: number;
  sizes: string;
}) {
  // Each tile keeps its own aspect ratio at the column's width, so a portrait
  // stays tall and the column reads as a real strip of photographs rather
  // than a row of identical boxes.
  const heights = items.map((m) => (width * m.height) / m.width);
  const contentHeight = heights.reduce((sum, h) => sum + h + gap, 0);

  // Endpoints are chosen so the column is framed at both ends of the span: at
  // rest it fills the lower half of the frame, at the end it fills the upper
  // half. Nothing runs off into blank space, which is what previously left a
  // single column on screen through the tail of every journey.
  const enter = vh * 0.55;
  const exit = -(contentHeight - vh * 0.45);
  const from = direction > 0 ? enter : exit;
  const to = direction > 0 ? exit : enter;

  // The speed differential. Both columns cover the same distance over the same
  // scroll (that is what keeps them framed together at the end), so the
  // 0.85x / 1.15x delta is applied to velocity rather than to distance: the
  // eased column starts at 0.85x and finishes at 1.15x, crossing the steady
  // column's speed halfway. Scaling travel distance instead is what breaks the
  // framing, a 15% longer sweep on a 4000px column overshoots the viewport by
  // roughly half a screen.
  //
  // A pleasant side effect: because the eased column is slower early and
  // faster late, neither column is the fast one for the whole scroll, so
  // neither can settle into being read as the main one.
  const linear = useTransform(progress, (p) => p);
  const skewed = useTransform(progress, (p) => 0.85 * p + 0.15 * p * p);
  const drive = eased ? skewed : linear;
  const y = useTransform(drive, [0, 1], [from, to]);

  const tops = layOut(heights, gap);

  return (
    <motion.div className="absolute top-0" style={{ left, width, y }}>
      {items.map((media, i) => (
        <ColumnTile
          key={media.src}
          media={media}
          columnY={y}
          top={tops[i]}
          width={width}
          height={heights[i]}
          vh={vh}
          sizes={sizes}
        />
      ))}
    </motion.div>
  );
}

function ColumnTile({
  media,
  columnY,
  top,
  width,
  height,
  vh,
  sizes,
}: {
  media: JourneyMedia;
  columnY: MotionValue<number>;
  top: number;
  width: number;
  height: number;
  vh: number;
  sizes: string;
}) {
  // Distance of this tile's centre from the middle of the viewport, 0 at the
  // centre line and 1 at either edge. Read straight off the column's own
  // transform, so it stays a pure function of scroll and reverses exactly.
  const distance = useTransform(columnY, (v) => {
    const centre = v + top + height / 2;
    return Math.min(Math.abs(centre - vh / 2) / (vh / 2), 1);
  });

  const scale = useTransform(distance, [0, 1], [1, 0.94]);
  const opacity = useTransform(distance, [0, 1], [1, 0.55]);
  // Captions belong to the item currently being looked at, not to every item
  // on screen: past a quarter of the way out they are gone.
  const captionOpacity = useTransform(distance, [0.18, 0.25], [1, 0]);

  return (
    <MediaTile
      media={media}
      sizes={sizes}
      captionOpacity={captionOpacity}
      style={{ left: 0, top, width, height, scale, opacity }}
    />
  );
}
