"use client";

import { motion, useTransform, type MotionValue } from "motion/react";
import type { JourneyMedia } from "@/content/site";
import { chunkMedia } from "@/lib/travel-beats";
import { columnsBeats } from "./specs";
import { MediaTile, layOut } from "./shared";
import type { TravelModeProps } from "./types";

// Parallel vertical columns travelling at different rates, the middle one
// against the other two. The counter-motion is the whole idea: it reads as
// depth without a perspective transform, and it gives the eye somewhere to
// rest while the outer columns keep moving.
//
// Only three transforms are live at any moment (one per column) no matter how
// many photographs are on screen, which makes this the cheapest of the new
// modes by a wide margin.

// Multiples of a column's own travel distance. Negative runs against scroll.
const RATES_WIDE = [1, -0.62, 0.84];
const RATES_NARROW = [1, -0.7];

export default function ColumnsMode({ journey, progress, vw, vh, isNarrow, sizes }: TravelModeProps) {
  const count = columnsBeats(journey.media.length);
  const beats = chunkMedia(journey.media, count);
  const columnCount = isNarrow ? 2 : 3;
  const rates = isNarrow ? RATES_NARROW : RATES_WIDE;

  if (beats.length === 0) return null;

  // Beats deal round-robin into columns so consecutive moments sit side by
  // side rather than stacking one column deep before starting the next.
  const columns: JourneyMedia[][] = Array.from({ length: columnCount }, () => []);
  beats.forEach((items, i) => {
    columns[i % columnCount].push(...items);
  });

  const gap = isNarrow ? 10 : 18;
  const columnWidth = (vw - gap * (columnCount + 1)) / columnCount;

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{
        // A static gradient mask rather than a per-item opacity ramp: the
        // fade is a property of the frame, not of any photograph, and this
        // way it costs one composite instead of one transform per tile.
        maskImage:
          "linear-gradient(to bottom, transparent, black 14%, black 86%, transparent)",
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent, black 14%, black 86%, transparent)",
      }}
    >
      {columns.map((items, i) => (
        <Column
          key={i}
          items={items}
          progress={progress}
          rate={rates[i % rates.length]}
          left={gap + i * (columnWidth + gap)}
          width={columnWidth}
          vh={vh}
          gap={gap}
          sizes={sizes}
        />
      ))}
    </div>
  );
}

function Column({
  items,
  progress,
  rate,
  left,
  width,
  vh,
  gap,
  sizes,
}: {
  items: JourneyMedia[];
  progress: MotionValue<number>;
  rate: number;
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

  // The column travels its own full length plus a viewport, so it enters and
  // leaves cleanly whichever direction its rate sends it.
  const travel = contentHeight + vh;
  const from = rate > 0 ? vh * 0.6 : -(contentHeight - vh * 0.4);
  const y = useTransform(progress, [0, 1], [from, from - travel * rate]);

  const tops = layOut(heights, gap);

  return (
    <motion.div className="absolute top-0" style={{ left, width, y }}>
      {items.map((media, i) => (
        <MediaTile
          key={media.src}
          media={media}
          sizes={sizes}
          // Captions would ride past at three different speeds and never be
          // still long enough to read.
          showCaption={false}
          style={{
            left: 0,
            top: tops[i],
            width,
            height: heights[i],
          }}
        />
      ))}
    </motion.div>
  );
}
