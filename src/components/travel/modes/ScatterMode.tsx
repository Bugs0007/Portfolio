"use client";

import type { ReactNode } from "react";
import { useTransform, type MotionValue } from "motion/react";
import type { JourneyMedia } from "@/content/site";
import { chunkMedia } from "@/lib/travel-beats";
import { scatterBeats } from "./specs";
import { MediaTile, useBeatWindow } from "./shared";
import type { TravelModeProps } from "./types";

// A curated set of positions across the canvas (fractions of the available
// width/height), cycled deterministically rather than placed at random, so
// the composition reads as considered. Kept off the extreme top/bottom edge
// so nothing feels clipped inside the pinned frame.
const SLOTS: { x: number; y: number }[] = [
  { x: 0.2, y: 0.3 },
  { x: 0.64, y: 0.2 },
  { x: 0.4, y: 0.64 },
  { x: 0.8, y: 0.5 },
  { x: 0.14, y: 0.7 },
  { x: 0.56, y: 0.4 },
];

export default function ScatterMode({ journey, progress, vw, vh, isNarrow, sizes }: TravelModeProps) {
  const count = scatterBeats(journey.media.length);
  const beats = chunkMedia(journey.media, count);
  // Overlap is the whole point here: several beats stay partly visible
  // together so the composition feels spatial, not a single file of items.
  // Mobile trims it back so at most a couple of tiles ever compete for
  // attention on a small screen.
  const overlap = isNarrow ? 0.22 : 0.45;

  if (beats.length === 0) return null;

  let globalIndex = 0;
  const nodes: ReactNode[] = [];
  beats.forEach((items, beatIndex) => {
    for (const media of items) {
      const slot = SLOTS[globalIndex % SLOTS.length];
      const depth = globalIndex % 3;
      nodes.push(
        <ScatterItem
          key={media.src}
          media={media}
          progress={progress}
          beatIndex={beatIndex}
          beatCount={beats.length}
          overlap={overlap}
          slot={slot}
          depth={depth}
          vw={vw}
          vh={vh}
          isNarrow={isNarrow}
          sizes={sizes}
        />,
      );
      globalIndex++;
    }
  });

  return <div className="absolute inset-0">{nodes}</div>;
}

function ScatterItem({
  media,
  progress,
  beatIndex,
  beatCount,
  overlap,
  slot,
  depth,
  vw,
  vh,
  isNarrow,
  sizes,
}: {
  media: JourneyMedia;
  progress: MotionValue<number>;
  beatIndex: number;
  beatCount: number;
  overlap: number;
  slot: { x: number; y: number };
  depth: number;
  vw: number;
  vh: number;
  isNarrow: boolean;
  sizes: string;
}) {
  const local = useBeatWindow(progress, beatIndex, beatCount, overlap);

  const heightBase = vh * (isNarrow ? 0.3 : 0.38);
  const depthScale = depth === 0 ? 1 : depth === 1 ? 0.78 : 0.6;
  const height = heightBase * depthScale;
  const width = Math.min((height * media.width) / media.height, vw * (isNarrow ? 0.62 : 0.4));

  const centerX = slot.x * vw;
  const centerY = slot.y * vh;

  // Drift distance and direction vary by depth, so background and
  // foreground tiles move at different speeds, a cheap parallax cue without
  // a scroll-linked camera.
  const driftDistance = (isNarrow ? 0.03 : 0.07) * vw * (depth === 0 ? 1 : depth === 1 ? 0.7 : 0.45);
  const driftAngle = (beatIndex % 2 === 0 ? 1 : -1) * (depth === 2 ? 0.6 : 1);
  const x = useTransform(local, (t) => centerX - width / 2 + (t - 0.5) * driftDistance * driftAngle);
  const y = useTransform(local, (t) => centerY - height / 2 + (t - 0.5) * driftDistance * 0.5);

  const scale = useTransform(local, [0, 0.5, 1], [0.88 * depthScale, depthScale, 0.88 * depthScale]);
  const opacity = useTransform(local, [0, 0.22, 0.78, 1], [0, 1, 1, 0]);
  const captionOpacity = useTransform(local, [0, 0.3, 0.7, 1], [0, depth === 0 ? 1 : 0.5, depth === 0 ? 1 : 0.5, 0]);

  return (
    <MediaTile
      media={media}
      sizes={sizes}
      showCaption={depth === 0}
      captionOpacity={captionOpacity}
      style={{
        left: x,
        top: y,
        width,
        height,
        scale,
        opacity,
        zIndex: 3 - depth,
      }}
    />
  );
}
