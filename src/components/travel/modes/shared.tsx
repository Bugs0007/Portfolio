"use client";

import { motion, useTransform, type MotionStyle, type MotionValue } from "motion/react";
import type { JourneyMedia } from "@/content/site";
import { EASE } from "@/lib/motion";
import { MediaFrame } from "@/components/TravelMap";

// Maps a beat's index within a fixed-size sequence to a local 0 -> 1
// progress, padded so neighbouring beats overlap and cross-fade rather than
// hard-cutting. `overlap` is a fraction of one beat's own width.
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
  showCaption = true,
  captionOpacity,
  captionY,
  hoverScale = 1.035,
}: {
  media: JourneyMedia;
  style: MotionStyle;
  showCaption?: boolean;
  captionOpacity?: MotionValue<number> | number;
  captionY?: MotionValue<number> | number;
  hoverScale?: number;
}) {
  return (
    <motion.figure className="group absolute" style={style}>
      <motion.div
        className="relative h-full w-full overflow-hidden bg-ink-soft"
        whileHover={{ scale: hoverScale }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        <MediaFrame media={media} />
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
