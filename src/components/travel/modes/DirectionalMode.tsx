"use client";

import { useTransform, type MotionValue } from "motion/react";
import type { JourneyMedia } from "@/content/site";
import { chunkMedia } from "@/lib/travel-beats";
import { directionalBeats } from "./specs";
import { MediaTile, useBeatWindow } from "./shared";
import type { TravelModeProps } from "./types";

type Direction =
  | "left"
  | "right"
  | "top"
  | "bottom"
  | "topLeft"
  | "topRight"
  | "bottomLeft"
  | "bottomRight";

// A fixed, repeating choreography script, not a random direction per photo:
// two from the right, a diagonal pair, one hero from below, a group of
// three dispersing, then a quiet single before the pattern repeats. Applied
// by each item's position in the journey, so it's identical between loads.
const PHRASE_PATTERN: Direction[] = [
  "right",
  "right",
  "topLeft",
  "bottomRight",
  "bottom",
  "left",
  "top",
  "right",
  "topRight",
];

// Simplified to the four cardinal directions on narrow screens, one axis of
// movement at a time instead of two, to cut visual complexity on mobile.
const NARROW_DIRECTION: Record<Direction, Direction> = {
  left: "left",
  right: "right",
  top: "top",
  bottom: "bottom",
  topLeft: "top",
  topRight: "top",
  bottomLeft: "bottom",
  bottomRight: "bottom",
};

const VECTORS: Record<Direction, { dx: number; dy: number }> = {
  left: { dx: -0.55, dy: 0 },
  right: { dx: 0.55, dy: 0 },
  top: { dx: 0, dy: -0.42 },
  bottom: { dx: 0, dy: 0.42 },
  topLeft: { dx: -0.4, dy: -0.34 },
  topRight: { dx: 0.4, dy: -0.34 },
  bottomLeft: { dx: -0.4, dy: 0.34 },
  bottomRight: { dx: 0.4, dy: 0.34 },
};

// Deterministic small tilts, never assigned per photo at random: rotation is
// allowed only in this mode, kept within -2deg to 2deg.
const ROTATIONS = [-2, 1.2, -1.4, 2, -0.6, 1.6, -1.8, 0.8];

const BASE_X_OFFSETS: Record<number, number[]> = {
  1: [0],
  2: [-0.13, 0.13],
  3: [-0.19, 0, 0.19],
};

export default function DirectionalMode({
  journey,
  progress,
  vw,
  vh,
  isNarrow,
  sizes,
}: TravelModeProps) {
  const count = directionalBeats(journey.media.length);
  const beats = chunkMedia(journey.media, count);
  const lastIndex = journey.media.length - 1;

  if (beats.length === 0) return null;

  // Each beat's starting index in the full (uncapped) journey sequence,
  // computed up front so direction/rotation/depth stay aligned with the
  // desktop sequence even when a narrow screen renders fewer items per beat.
  const beatStartIndex: number[] = [];
  let running = 0;
  for (const items of beats) {
    beatStartIndex.push(running);
    running += items.length;
  }

  return (
    <div className="absolute inset-0">
      {beats.map((items, beatIndex) => {
        const capped = isNarrow ? items.slice(0, 2) : items;
        const baseXOffsets = BASE_X_OFFSETS[capped.length] ?? BASE_X_OFFSETS[3];
        return capped.map((media, orderInBeat) => {
          const idx = beatStartIndex[beatIndex] + orderInBeat;
          const isFinal = idx === lastIndex;
          const rawDirection = isFinal ? "bottom" : PHRASE_PATTERN[idx % PHRASE_PATTERN.length];
          const direction = isNarrow ? NARROW_DIRECTION[rawDirection] : rawDirection;
          const depth = idx % 3;
          return (
            <DirectionalItem
              key={media.src}
              media={media}
              progress={progress}
              beatIndex={beatIndex}
              beatCount={beats.length}
              orderInBeat={orderInBeat}
              beatSize={capped.length}
              baseXOffset={baseXOffsets[orderInBeat] ?? 0}
              direction={direction}
              rotateDeg={ROTATIONS[idx % ROTATIONS.length]}
              depth={depth}
              emphasis={isFinal ? 1.3 : 1}
              vw={vw}
              vh={vh}
              isNarrow={isNarrow}
              sizes={sizes}
            />
          );
        });
      })}
    </div>
  );
}

function DirectionalItem({
  media,
  progress,
  beatIndex,
  beatCount,
  orderInBeat,
  beatSize,
  baseXOffset,
  direction,
  rotateDeg,
  depth,
  emphasis,
  vw,
  vh,
  isNarrow,
  sizes,
}: {
  media: JourneyMedia;
  progress: MotionValue<number>;
  beatIndex: number;
  beatCount: number;
  orderInBeat: number;
  beatSize: number;
  baseXOffset: number;
  direction: Direction;
  rotateDeg: number;
  depth: number;
  emphasis: number;
  vw: number;
  vh: number;
  isNarrow: boolean;
  sizes: string;
}) {
  const beatLocal = useBeatWindow(progress, beatIndex, beatCount, 0.16);
  // A short internal stagger so a multi-item beat still reads as a phrase
  // (items arriving in sequence) rather than a single simultaneous cut.
  const staggerStart = orderInBeat * 0.12;
  const local = useTransform(beatLocal, [staggerStart, 1], [0, 1], { clamp: true });

  const heightBase = vh * (isNarrow ? 0.3 : 0.4);
  const depthScale = depth === 0 ? 1 : depth === 1 ? 0.85 : 0.7;
  const height = heightBase * depthScale * emphasis;
  const width = Math.min((height * media.width) / media.height, vw * (isNarrow ? 0.7 : 0.42));

  const vector = VECTORS[direction];
  const distanceScale = isNarrow ? 0.55 : 1;
  const dx = vector.dx * vw * distanceScale * (depth === 2 ? 0.7 : 1);
  const dy = vector.dy * vh * distanceScale * (depth === 2 ? 0.7 : 1);

  // A small per-beat bias on top of the within-beat layout, alternating
  // left/right and drifting up/down by beat index. Without it, two
  // consecutive single-item beats would both settle dead-centre and
  // double-expose each other during the crossfade.
  const beatXBias = beatIndex % 2 === 0 ? -0.07 : 0.07;
  const beatYBias = ((beatIndex % 3) - 1) * 0.06;
  const centerX = vw * (0.5 + beatXBias + baseXOffset * (beatSize > 1 ? 1 : 0));
  const centerY = vh * (0.5 + beatYBias + (orderInBeat % 2 === 0 ? -0.03 : 0.03));

  // Two dimensions settle on slightly different timing, which is what
  // reads as a gentle curved approach rather than a straight line in.
  const xOffset = useTransform(local, [0, 0.55, 1], [dx, dx * 0.22, 0]);
  const yOffset = useTransform(local, [0, 0.7, 1], [dy, dy * 0.18, 0]);
  const x = useTransform(xOffset, (v) => centerX - width / 2 + v);
  const y = useTransform(yOffset, (v) => centerY - height / 2 + v);

  const opacity = useTransform(local, [0, 0.22, 0.8, 1], [0, 1, 1, 0]);
  const scale = useTransform(local, [0, 0.3, 1], [0.85, 1, 0.97]);
  const rotate = useTransform(local, [0, 0.4], [rotateDeg * 2.2, rotateDeg]);

  return (
    <MediaTile
      media={media}
      sizes={sizes}
      showCaption={depth === 0}
      captionOpacity={opacity}
      style={{ left: x, top: y, width, height, opacity, scale, rotate, zIndex: 3 - depth }}
    />
  );
}
