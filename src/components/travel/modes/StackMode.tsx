"use client";

import { useTransform, type MotionValue } from "motion/react";
import type { JourneyMedia } from "@/content/site";
import { chunkMedia } from "@/lib/travel-beats";
import { stackBeats } from "./specs";
import { MediaTile, fitByHeight } from "./shared";
import type { TravelModeProps } from "./types";

// A pile of prints, seen from directly above. No horizontal travel at all:
// the only movement is the top card peeling away downward and the pile
// settling up by one. That restraint is the point, it's the quietest mode in
// the set next to Clip.
//
// Every card's transform derives from one continuous value: its depth in the
// pile, `index - progress * count`. Depth 0 is the top card, positive is
// buried, negative is already peeled. Because depth is a plain linear read of
// progress, scrolling back up runs the peel exactly backwards.

// Deterministic tilts, cycled by card index. Never Math.random: a pile that
// re-tilts itself on every re-render reads as broken, not casual.
const ROTATIONS = [-2.6, 1.8, -1.1, 3, -0.7, 2.2, -3, 1.3, -1.9];

// How many cards deep the pile stays legible. Beyond this a card is behind
// enough neighbours that it contributes nothing but a composite layer.
const VISIBLE_DEPTH = 3;

export default function StackMode({ journey, progress, vw, vh, isNarrow, sizes }: TravelModeProps) {
  const count = stackBeats(journey.media.length);
  const beats = chunkMedia(journey.media, count);
  const height = vh * (isNarrow ? 0.46 : 0.56);

  if (beats.length === 0) return null;

  return (
    <div className="absolute inset-0">
      {beats.map((items, i) => (
        <StackCard
          key={i}
          items={items}
          progress={progress}
          index={i}
          count={beats.length}
          vw={vw}
          height={height}
          isNarrow={isNarrow}
          sizes={sizes}
        />
      ))}
    </div>
  );
}

function StackCard({
  items,
  progress,
  index,
  count,
  vw,
  height,
  isNarrow,
  sizes,
}: {
  items: JourneyMedia[];
  progress: MotionValue<number>;
  index: number;
  count: number;
  vw: number;
  height: number;
  isNarrow: boolean;
  sizes: string;
}) {
  // Continuous depth in the pile. The whole card reads from this one value.
  const depth = useTransform(progress, (v) => index - v * count);

  // Every print in a card is sized as a full print. A beat holding two of
  // them is a fan, not a two-up spread: the second sits slightly behind and
  // below with its own tilt, so it reads as another print in the same pile
  // rather than a second column. Laying them side by side was tried first and
  // read as a scattered grid, which is the one thing a deck must not look
  // like.
  const laid = items.map((media) => fitByHeight(media, height, vw, isNarrow ? 0.8 : 0.5));

  const baseRotate = ROTATIONS[index % ROTATIONS.length];

  // Buried cards sit slightly up and smaller; the peeled card falls away
  // downward and off. Both directions come out of the same interpolation, so
  // there is no branch and no discontinuity at depth 0.
  // Centring offset is folded straight in (every tile in a card shares one
  // height), so `y` is the single source of vertical position rather than
  // fighting a separate translateY.
  const y = useTransform(
    depth,
    (d) => (d < 0 ? -d * height * 1.25 : -d * (isNarrow ? 10 : 16)) - height / 2,
  );
  const scale = useTransform(depth, (d) => (d < 0 ? 1 + -d * 0.06 : Math.pow(0.96, d)));
  const rotate = useTransform(depth, (d) => (d < 0 ? baseRotate + -d * 9 : baseRotate));
  const opacity = useTransform(
    depth,
    [-0.85, -0.4, 0, VISIBLE_DEPTH - 0.6, VISIBLE_DEPTH + 0.2],
    [0, 1, 1, 1, 0],
  );
  // Only the card actually on top is captioned, so the pile never stacks
  // several captions on top of each other.
  const captionOpacity = useTransform(depth, [-0.4, 0, 0.55], [0, 1, 0]);

  return (
    <>
      {items.map((media, i) => (
        <StackPrint
          key={media.src}
          media={media}
          size={laid[i]}
          order={i}
          y={y}
          scale={scale}
          rotate={rotate}
          opacity={opacity}
          captionOpacity={captionOpacity}
          // Earlier cards sit on top, which is what makes card 0 the one that
          // peels first. Within a card, earlier prints sit on top too.
          zIndex={(count - index) * 4 - i}
          isNarrow={isNarrow}
          sizes={sizes}
        />
      ))}
    </>
  );
}

function StackPrint({
  media,
  size,
  order,
  y,
  scale,
  rotate,
  opacity,
  captionOpacity,
  zIndex,
  isNarrow,
  sizes,
}: {
  media: JourneyMedia;
  size: { width: number; height: number };
  order: number;
  y: MotionValue<number>;
  scale: MotionValue<number>;
  rotate: MotionValue<number>;
  opacity: MotionValue<number>;
  captionOpacity: MotionValue<number>;
  zIndex: number;
  isNarrow: boolean;
  sizes: string;
}) {
  // The fan: each print after the first is nudged down-right and tilted a
  // little further, so a card holding two of them shows both edges instead of
  // hiding one completely behind the other.
  const fan = isNarrow ? 12 : 20;
  const fanRotate = useTransform(rotate, (r) => r + order * 2.4);
  const fanY = useTransform(y, (v) => v + order * fan * 0.7);

  return (
    <MediaTile
      media={media}
      sizes={sizes}
      showCaption={order === 0}
      captionOpacity={captionOpacity}
      style={{
        left: "50%",
        top: "50%",
        width: size.width,
        height: size.height,
        // Static centring folded into the animated transform, so nothing here
        // touches left/top/margin once it's moving.
        x: -size.width / 2 + order * fan,
        y: fanY,
        scale,
        rotate: fanRotate,
        opacity,
        zIndex,
      }}
    />
  );
}
