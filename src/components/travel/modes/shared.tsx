"use client";

import { motion, type MotionStyle, type MotionValue } from "motion/react";
import type { JourneyMedia } from "@/content/site";
import { EASE } from "@/lib/motion";
import { MediaFrame } from "@/components/TravelMap";


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
