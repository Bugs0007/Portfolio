"use client";

import { motion, useTransform, type MotionStyle, type MotionValue } from "motion/react";
import type { JourneyMedia } from "@/content/site";
import { EASE } from "@/lib/motion";
import { MediaFrame } from "@/components/TravelMap";

// Maps a beat's index within a fixed-size sequence to a local 0 -> 1
// progress, padded so neighbouring beats overlap and cross-fade rather than
// hard-cutting. `overlap` is a fraction of one beat's own width.
//
// Deliberately generic over its input: the modes that show one frame at a
// time (Clip, Focus, Cinema, Ring) call it a second time on a beat's own
// local value to sub-divide that beat between its items, so every item gets
// screen time without the beat count, and therefore the span, going up.
export function useBeatWindow(
  progress: MotionValue<number>,
  index: number,
  count: number,
  overlap = 0.35,
): MotionValue<number> {
  const width = 1 / count;
  const start = index * width;
  const end = start + width;
  const pad = width * overlap;
  const paddedStart = Math.max(0, start - pad);
  const paddedEnd = Math.min(1, end + pad);
  return useTransform(progress, [paddedStart, paddedEnd], [0, 1]);
}

// The one leaf renderer every mode composes with: a media frame plus its
// mono caption, styled entirely through motion values so no mode needs its
// own copy of the caption markup or the hover-scale treatment.
export function MediaTile({
  media,
  style,
  frameStyle,
  sizes,
  // Videos fill their tile the same way stills do. Every mode sizes a tile
  // from the media's aspect but then caps the width against the viewport, so
  // the box frequently isn't the media's ratio; a contained video letterboxed
  // itself inside that box with black bands while the still next to it filled
  // edge to edge (MediaFrame renders images object-cover). Cover for both, so
  // the two kinds of media are indistinguishable as compositional blocks.
  fit = "cover",
  showCaption = true,
  captionOpacity,
  captionY,
  hoverScale = 1.035,
}: {
  media: JourneyMedia;
  style: MotionStyle;
  // Styles that belong to the media frame alone rather than the whole tile.
  // Clip and Focus need this: the caption sits outside the figure's border
  // box, so a clip-path or a blur applied at figure level would eat it.
  frameStyle?: MotionStyle;
  // The owning mode's getSizes(isNarrow), threaded down to next/image.
  sizes?: string;
  fit?: "contain" | "cover";
  showCaption?: boolean;
  captionOpacity?: MotionValue<number> | number;
  captionY?: MotionValue<number> | number;
  hoverScale?: number;
}) {
  return (
    <motion.figure className="group absolute" style={style}>
      <motion.div
        className="relative h-full w-full overflow-hidden bg-ink-soft"
        style={frameStyle}
        whileHover={{ scale: hoverScale }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        <MediaFrame media={media} sizes={sizes} fit={fit} />
      </motion.div>
      {showCaption && (
        <motion.figcaption
          style={{ opacity: captionOpacity, y: captionY }}
          className="mt-3 flex items-baseline gap-2 font-mono text-[10px] uppercase tracking-wider text-stone"
        >
          <span>{media.caption}</span>
          {media.coords && (
            <span className="text-stone/60">
              {media.coords.lat.toFixed(3)}°, {media.coords.lon.toFixed(3)}°
            </span>
          )}
        </motion.figcaption>
      )}
    </motion.figure>
  );
}

// Cumulative start offsets for items laid end to end with a fixed gap.
// Deliberately a module-level function rather than an accumulator inside a
// component: the React Compiler's immutability rule (correctly) rejects
// reassigning a captured variable from inside a .map callback during render.
export function layOut(lengths: number[], gap: number): number[] {
  const out: number[] = [];
  let acc = 0;
  for (const len of lengths) {
    out.push(acc);
    acc += len + gap;
  }
  return out;
}

// Fits a media item into a box by height, capped to a fraction of the
// viewport width. Every mode was doing this same two-line calculation
// inline; the portrait shots (several are 1237x2200) are the reason the cap
// exists at all.
export function fitByHeight(
  media: JourneyMedia,
  height: number,
  vw: number,
  maxWidthRatio: number,
): { width: number; height: number } {
  return {
    width: Math.min((height * media.width) / media.height, vw * maxWidthRatio),
    height,
  };
}
