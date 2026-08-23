"use client";

import { useTransform, type MotionValue } from "motion/react";
import type { JourneyMedia } from "@/content/site";
import { chunkMedia } from "@/lib/travel-beats";
import { maskBeats } from "./specs";
import { MediaTile, fitByHeight, useBeatWindow } from "./shared";
import type { TravelModeProps } from "./types";

// The most restrained mode in the set, deliberately. The frame never moves,
// never scales, never rotates: the only thing scroll drives is a clip-path
// inset wipe across it, in then out. Everything else in this rig is arguing
// for attention, this one just shows the photograph.
//
// The wipe axis rotates through four directions by beat so a long journey
// doesn't become fifteen identical left-to-right wipes.

type Axis = "left" | "top" | "right" | "bottom";

const AXES: Axis[] = ["left", "top", "right", "bottom"];

// inset() takes top/right/bottom/left. A wipe "from left" means the hidden
// edge starts at 100% on the left and retreats to 0.
function insetFor(axis: Axis, amount: number): string {
  const a = `${(amount * 100).toFixed(2)}%`;
  const zero = "0%";
  switch (axis) {
    case "left":
      return `inset(${zero} ${zero} ${zero} ${a})`;
    case "right":
      return `inset(${zero} ${a} ${zero} ${zero})`;
    case "top":
      return `inset(${a} ${zero} ${zero} ${zero})`;
    case "bottom":
      return `inset(${zero} ${zero} ${a} ${zero})`;
  }
}

// The exit wipe leaves from the opposite edge it entered from, so the frame
// reads as being swept through rather than bouncing back the way it came.
const OPPOSITE: Record<Axis, Axis> = {
  left: "right",
  right: "left",
  top: "bottom",
  bottom: "top",
};

export default function MaskMode({ journey, progress, vw, vh, isNarrow, sizes }: TravelModeProps) {
  const count = maskBeats(journey.media.length);
  const beats = chunkMedia(journey.media, count);
  const height = vh * (isNarrow ? 0.56 : 0.72);

  if (beats.length === 0) return null;

  return (
    <div className="absolute inset-0">
      {beats.map((items, i) => (
        <MaskBeat
          key={i}
          items={items}
          progress={progress}
          index={i}
          count={beats.length}
          axis={AXES[i % AXES.length]}
          vw={vw}
          height={height}
          isNarrow={isNarrow}
          sizes={sizes}
        />
      ))}
    </div>
  );
}

function MaskBeat({
  items,
  progress,
  index,
  count,
  axis,
  vw,
  height,
  isNarrow,
  sizes,
}: {
  items: JourneyMedia[];
  progress: MotionValue<number>;
  index: number;
  count: number;
  axis: Axis;
  vw: number;
  height: number;
  isNarrow: boolean;
  sizes: string;
}) {
  // Near-zero overlap: two stationary frames dissolving through each other in
  // the same spot reads as a double exposure, not a cut. The wipe itself is
  // the transition, so it doesn't need help.
  const local = useBeatWindow(progress, index, count, 0.04);

  return (
    <>
      {items.map((media, order) => (
        <MaskFrame
          key={media.src}
          media={media}
          local={local}
          order={order}
          total={items.length}
          axis={axis}
          vw={vw}
          height={height}
          isNarrow={isNarrow}
          sizes={sizes}
        />
      ))}
    </>
  );
}

function MaskFrame({
  media,
  local,
  order,
  total,
  axis,
  vw,
  height,
  isNarrow,
  sizes,
}: {
  media: JourneyMedia;
  local: MotionValue<number>;
  order: number;
  total: number;
  axis: Axis;
  vw: number;
  height: number;
  isNarrow: boolean;
  sizes: string;
}) {
  // A beat holding two items splits its own window between them, so every
  // photo gets a full wipe without the beat count (and so the span) growing.
  const sub = useBeatWindow(local, order, total, 0.02);
  const size = fitByHeight(media, height, vw, isNarrow ? 0.9 : 0.62);

  const outAxis = OPPOSITE[axis];

  // In over the first third, hold through the middle, out over the last
  // third. Two separate wipes, so the clip string switches source axis at the
  // hold boundary; driving it through one callback keeps that switch exact
  // and keeps the whole thing a pure function of scroll.
  const clipPath = useTransform(sub, (t) => {
    if (t <= 0.34) {
      const amount = 1 - t / 0.34;
      return insetFor(axis, Math.max(0, Math.min(1, amount)));
    }
    if (t < 0.66) return "inset(0% 0% 0% 0%)";
    const amount = (t - 0.66) / 0.34;
    return insetFor(outAxis, Math.max(0, Math.min(1, amount)));
  });

  // A short opacity ramp only at the very ends, so a frame that is fully
  // clipped can't leave a one-pixel seam behind.
  const opacity = useTransform(sub, [0, 0.02, 0.98, 1], [0, 1, 1, 0]);
  const captionOpacity = useTransform(sub, [0.28, 0.4, 0.62, 0.74], [0, 1, 1, 0]);

  return (
    <MediaTile
      media={media}
      sizes={sizes}
      captionOpacity={captionOpacity}
      hoverScale={1}
      style={{
        left: "50%",
        top: "50%",
        width: size.width,
        height: size.height,
        x: -size.width / 2,
        y: -size.height / 2,
        opacity,
      }}
      // On the frame, not the figure: the caption hangs below the figure's
      // border box and an inset() clip at figure level would erase it.
      frameStyle={{ clipPath }}
    />
  );
}
