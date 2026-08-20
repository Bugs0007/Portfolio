"use client";

import { motion, useTransform, type MotionValue } from "motion/react";
import type { JourneyMedia } from "@/content/site";
import { beatCountFor, chunkMedia, railSpanForBeats } from "@/lib/travel-beats";
import { MediaTile, useBeatWindow } from "./shared";
import type { TravelModeDef, TravelModeProps } from "./types";

// The evolution of the original single-ribbon Reel: same right-to-left
// motion, same centre-based scale/opacity/caption-focus math, but the media
// is chunked into a bounded number of beats first. Each beat is its own
// short-lived mini-ribbon (1-3 items) that reuses the full-width travel
// [vw -> -ribbonWidth+vw*0.6], so screen time per beat stays roughly
// constant no matter how large the journey gets, only beat count grows (and
// that growth is capped).
function beatCount(n: number) {
  return beatCountFor(n, { base: 5, growth: 1.3, min: Math.min(5, n) || 1, max: 10 });
}

function getSpan(n: number) {
  return railSpanForBeats(beatCount(n), 0.6);
}

function StreamMode({ journey, progress, vw, vh, isNarrow }: TravelModeProps) {
  const count = beatCount(journey.media.length);
  const beats = chunkMedia(journey.media, count);
  const height = vh * (isNarrow ? 0.42 : 0.5);
  const gap = isNarrow ? 18 : 34;
  const maxWidthRatio = isNarrow ? 0.85 : 0.55;

  if (beats.length === 0) return null;

  return (
    <div className="absolute inset-0">
      {beats.map((items, i) => (
        <StreamBeat
          key={i}
          items={items}
          progress={progress}
          index={i}
          count={beats.length}
          vw={vw}
          height={height}
          gap={gap}
          maxWidthRatio={maxWidthRatio}
        />
      ))}
    </div>
  );
}

function StreamBeat({
  items,
  progress,
  index,
  count,
  vw,
  height,
  gap,
  maxWidthRatio,
}: {
  items: JourneyMedia[];
  progress: MotionValue<number>;
  index: number;
  count: number;
  vw: number;
  height: number;
  gap: number;
  maxWidthRatio: number;
}) {
  // A modest overlap: enough for a brief crossfade at the handoff, same as
  // how two adjacent items on the old single ribbon briefly shared the
  // screen, without letting two full beats coexist at full opacity.
  const local = useBeatWindow(progress, index, count, 0.2);

  const widths = items.map((m) => Math.min((height * m.width) / m.height, vw * maxWidthRatio));
  const offsets: number[] = [];
  let acc = 0;
  for (const w of widths) {
    offsets.push(acc);
    acc += w + gap;
  }
  const ribbonWidth = Math.max(acc - gap, 1);

  // Every beat but the last exits fully off-screen left, clearing the stage
  // before the next beat's items fly in from the right. Only the journey's
  // very last beat stops short of that (same trick the original single
  // ribbon used), so the final photo is still on screen when the sticky
  // pin releases instead of leaving a blank trailing scroll.
  const isLastBeat = index === count - 1;
  const exitX = isLastBeat ? -ribbonWidth + vw * 0.6 : -ribbonWidth;
  const x = useTransform(local, [0, 1], [vw, exitX]);

  return (
    <motion.div className="absolute inset-y-0 left-0" style={{ x, width: ribbonWidth }}>
      {items.map((media, i) => (
        <StreamItem
          key={media.src}
          media={media}
          ribbonX={x}
          left={offsets[i]}
          width={widths[i]}
          height={height}
          vw={vw}
        />
      ))}
    </motion.div>
  );
}

function StreamItem({
  media,
  ribbonX,
  left,
  width,
  height,
  vw,
}: {
  media: JourneyMedia;
  ribbonX: MotionValue<number>;
  left: number;
  width: number;
  height: number;
  vw: number;
}) {
  const centre = useTransform(ribbonX, (v) => v + left + width / 2);
  const scale = useTransform(centre, [0, vw * 0.5, vw], [0.92, 1, 0.92]);
  const opacity = useTransform(
    centre,
    [-width * 0.6, width * 0.4, vw - width * 0.4, vw + width * 0.6],
    [0, 1, 1, 0],
  );
  const focus = useTransform(centre, [vw * 0.22, vw * 0.5, vw * 0.78], [0, 1, 0]);
  // Gated by the item's own opacity so a photo that's off-screen (or mid
  // crossfade into the next beat) never leaves its caption text lingering
  // behind on its own.
  const captionOpacity = useTransform([opacity, focus], ([o, f]: number[]) => o * (0.4 + 0.6 * f));
  const captionY = useTransform(focus, [0, 1], [4, 0]);

  return (
    <MediaTile
      media={media}
      captionOpacity={captionOpacity}
      captionY={captionY}
      style={{ left, top: "50%", width, height, marginTop: -height / 2, scale, opacity }}
    />
  );
}

export const streamMode: TravelModeDef = {
  id: "stream",
  label: "Stream",
  getSpan,
  Component: StreamMode,
};
