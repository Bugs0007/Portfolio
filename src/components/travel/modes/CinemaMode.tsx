"use client";

import { motion, useTransform, type MotionValue } from "motion/react";
import type { JourneyMedia } from "@/content/site";
import { chunkMedia } from "@/lib/travel-beats";
import { cinemaBeats } from "./specs";
import { MediaTile, useBeatWindow } from "./shared";
import type { TravelModeProps } from "./types";

// The baseline: one photograph, the whole frame, nothing else. No rail, no
// composition, no cleverness. Every other mode in this rig is a variation on
// showing several things at once, and this is what they are all being
// compared against.
//
// The only motion is a slow Ken Burns push and a crossfade at the handover.
// Kept plain on purpose, so if a mode can't beat this it isn't earning its
// complexity.

// Pan directions, cycled by index, so consecutive frames don't all drift the
// same way. Percentages of the overshoot the 1.08 scale buys us.
const PANS: { x: number; y: number }[] = [
  { x: -1, y: 0.4 },
  { x: 1, y: -0.5 },
  { x: 0.6, y: 1 },
  { x: -0.8, y: -0.8 },
  { x: 1, y: 0.2 },
  { x: -0.5, y: -1 },
];

export default function CinemaMode({ journey, progress, isNarrow, sizes }: TravelModeProps) {
  const count = cinemaBeats(journey.media.length);
  const beats = chunkMedia(journey.media, count);

  if (beats.length === 0) return null;

  // Each beat's starting index in the full sequence, built up front rather
  // than accumulated inside the map below, so the pan cycle stays tied to a
  // photograph's real position in the journey.
  const beatStartIndex: number[] = [];
  let running = 0;
  for (const items of beats) {
    beatStartIndex.push(running);
    running += items.length;
  }

  return (
    <div className="absolute inset-0 overflow-hidden">
      {beats.map((items, i) => (
        <CinemaBeat
          key={i}
          items={items}
          progress={progress}
          index={i}
          count={beats.length}
          startIndex={beatStartIndex[i]}
          isNarrow={isNarrow}
          sizes={sizes}
        />
      ))}
    </div>
  );
}

function CinemaBeat({
  items,
  progress,
  index,
  count,
  startIndex,
  isNarrow,
  sizes,
}: {
  items: JourneyMedia[];
  progress: MotionValue<number>;
  index: number;
  count: number;
  startIndex: number;
  isNarrow: boolean;
  sizes: string;
}) {
  // Generous overlap: a full-bleed cut with no crossfade is a jump cut, and
  // there is nothing else on screen to soften it.
  const local = useBeatWindow(progress, index, count, 0.18);

  return (
    <>
      {items.map((media, order) => (
        <CinemaFrame
          key={media.src}
          media={media}
          local={local}
          order={order}
          total={items.length}
          pan={PANS[(startIndex + order) % PANS.length]}
          isNarrow={isNarrow}
          sizes={sizes}
        />
      ))}
    </>
  );
}

function CinemaFrame({
  media,
  local,
  order,
  total,
  pan,
  isNarrow,
  sizes,
}: {
  media: JourneyMedia;
  local: MotionValue<number>;
  order: number;
  total: number;
  pan: { x: number; y: number };
  isNarrow: boolean;
  sizes: string;
}) {
  // Each photograph takes its own share of the beat, so "one at a time" holds
  // even where the beat cap has put two into one beat.
  const sub = useBeatWindow(local, order, total, 0.16);

  const opacity = useTransform(sub, [0, 0.14, 0.86, 1], [0, 1, 1, 0]);
  const scale = useTransform(sub, [0, 1], [1, 1.08]);
  // The pan has to stay inside the 4% of overshoot the scale provides, or the
  // cover frame slides off its own edge and shows the background.
  const reach = isNarrow ? 12 : 20;
  const x = useTransform(sub, [0, 1], [-pan.x * reach, pan.x * reach]);
  const y = useTransform(sub, [0, 1], [-pan.y * reach, pan.y * reach]);

  return (
    <>
      <MediaTile
        media={media}
        sizes={sizes}
        // Full bleed means the frame is the viewport, so the tile's own
        // caption slot (which sits below the frame) has nowhere to go. The
        // caption is rendered as an overlay instead, below.
        showCaption={false}
        fit="cover"
        hoverScale={1}
        style={{
          left: 0,
          top: 0,
          width: "100%",
          height: "100%",
          x,
          y,
          scale,
          opacity,
        }}
      />
      <motion.figcaption
        style={{ opacity }}
        className="pointer-events-none absolute bottom-8 left-6 z-10 flex items-baseline gap-2 font-mono text-[10px] uppercase tracking-wider text-mist/80 sm:left-10 lg:left-16"
      >
        <span>{media.caption}</span>
        {media.coords && (
          <span className="text-mist/50">
            {media.coords.lat.toFixed(3)}°, {media.coords.lon.toFixed(3)}°
          </span>
        )}
      </motion.figcaption>
    </>
  );
}
