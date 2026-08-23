"use client";

import { motion, useTransform, type MotionValue } from "motion/react";
import type { JourneyMedia } from "@/content/site";
import { chunkMedia } from "@/lib/travel-beats";
import { columnsBeats } from "./specs";
import { MediaTile, layOut } from "./shared";
import type { TravelModeProps } from "./types";

// Two parallel columns travelling in opposite directions inside a centred
// container.
//
// This was three full-bleed columns first, and the outer two sat far enough
// into peripheral vision that the middle one read as the subject and they read
// as decoration. Two columns inside a narrower container fixes both halves of
// that: neither column is "the outer one" any more, and dropping a column
// while narrowing the container still leaves each photograph meaningfully
// larger than it was at three (see COLUMN_MAX below).
//
// Emphasis is earned by vertical position instead of by column: an item is
// biggest and brightest as it crosses the middle of the viewport, and the same
// curve is applied to both columns so neither is structurally favoured.

// Container: 76vw, capped. The cap is 1280 rather than 1180 because 1180
// makes a two-column tile *narrower* than the old three-column one from about
// 1900px up (at 1920: 574 vs 616), which would have defeated the point of the
// change. At 1280 the tile is larger at every width up to ~1940 and never
// smaller in the mainstream desktop range. Past that the centred cap holds
// deliberately, which is what a max-width is for.
const COLUMN_MAX = 1280;
const CONTAINER_VW = 0.76;
// Phones get the container nearly full-bleed; there is no peripheral-vision
// problem to solve at 375px, only a too-small-to-read one.
const NARROW_CONTAINER_VW = 0.92;

// A two-column split is only worth having while each tile stays wide enough to
// read. Below this the mode collapses to a single column rather than showing
// two columns of postage stamps.
const MIN_TILE_VW = 0.68;

export default function ColumnsMode({
  journey,
  progress,
  vw,
  vh,
  isNarrow,
  sizes,
}: TravelModeProps) {
  const count = columnsBeats(journey.media.length);
  const beats = chunkMedia(journey.media, count);

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
  const columnWidth =
    columnCount === 2 ? twoUpWidth : containerWidth;

  // Vertical rhythm is looser than the horizontal gap because captions hang
  // below their tile and need somewhere to sit.
  const rowGap = gap + 22;

  if (beats.length === 0) return null;

  // Beats are dealt to whichever column is currently shortest in pixels, not
  // round-robin by count. The columns have to run out at the same time or one
  // of them ends the span empty, and a portrait frame (several here are
  // 1237x2200) is more than twice the height of a landscape one, so balancing
  // counts does not balance heights. This also subsumes the odd-count rule:
  // the extra item lands on whichever column would otherwise finish short.
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
        // Only the very edge is masked now. The per-item centre-band opacity
        // below does the gradual fade, and running both at full strength
        // stacked two fades on top of each other and crushed the top and
        // bottom of the frame.
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
          // that produces the speed differential (see below).
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

  // Endpoints are chosen so the column is framed at both ends of the span:
  // at rest it fills the lower half of the frame, at the end it fills the
  // upper half. Nothing runs off into blank space, which is what previously
  // left a single column on screen through the tail of every journey.
  const enter = vh * 0.55;
  const exit = -(contentHeight - vh * 0.45);
  const from = direction > 0 ? enter : exit;
  const to = direction > 0 ? exit : enter;

  // The speed differential. Both columns cover the same distance over the same
  // scroll (that is what keeps them framed together at the end), so the 0.85x
  // / 1.15x delta is applied to velocity rather than to distance: the eased
  // column starts at 0.85x and finishes at 1.15x, crossing the steady column's
  // speed halfway. Scaling travel distance instead was tried and is what
  // breaks the framing, a 15% longer sweep on a 4000px column overshoots the
  // viewport by roughly half a screen.
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
      style={{
        left: 0,
        top,
        width,
        height,
        scale,
        opacity,
      }}
    />
  );
}
