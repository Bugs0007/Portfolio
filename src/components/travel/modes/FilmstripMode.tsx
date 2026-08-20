"use client";

import { motion, useTransform, type MotionValue } from "motion/react";
import type { JourneyMedia } from "@/content/site";
import { beatCountFor, chunkMedia, railSpanForBeats } from "@/lib/travel-beats";
import { MediaTile, useBeatWindow } from "./shared";
import type { TravelModeDef, TravelModeProps } from "./types";

// A denser, two-row contact-sheet variant of Stream: each cluster (usually
// 1-3 items) rides across the screen as one unit, split into a top and
// bottom row so several frames occupy the same visual interval instead of
// one at a time. More, cheaper beats than Stream since each beat is smaller.
function beatCount(n: number) {
  return beatCountFor(n, { base: 6, growth: 1.3, min: Math.min(6, n) || 1, max: 12 });
}

function getSpan(n: number) {
  return railSpanForBeats(beatCount(n), 0.5);
}

function FilmstripMode({ journey, progress, vw, vh, isNarrow }: TravelModeProps) {
  const count = beatCount(journey.media.length);
  const clusters = chunkMedia(journey.media, count);
  const rowHeight = vh * (isNarrow ? 0.22 : 0.28);
  const gap = isNarrow ? 12 : 20;
  const maxWidthRatio = isNarrow ? 0.5 : 0.3;

  if (clusters.length === 0) return null;

  return (
    <div className="absolute inset-0">
      {clusters.map((items, i) => (
        <FilmstripCluster
          key={i}
          items={items}
          progress={progress}
          index={i}
          count={clusters.length}
          vw={vw}
          rowHeight={rowHeight}
          gap={gap}
          maxWidthRatio={maxWidthRatio}
        />
      ))}
    </div>
  );
}

type LaidOutItem = { media: JourneyMedia; row: 0 | 1; left: number; width: number; height: number };

function FilmstripCluster({
  items,
  progress,
  index,
  count,
  vw,
  rowHeight,
  gap,
  maxWidthRatio,
}: {
  items: JourneyMedia[];
  progress: MotionValue<number>;
  index: number;
  count: number;
  vw: number;
  rowHeight: number;
  gap: number;
  maxWidthRatio: number;
}) {
  const local = useBeatWindow(progress, index, count, 0.22);

  const rowAcc = [0, 0];
  const laidOut: LaidOutItem[] = items.map((media, i) => {
    const row = (i % 2) as 0 | 1;
    // The lead item in each cluster reads as slightly more important, the
    // one bit of deliberate size variety a contact sheet needs.
    const importance = i === 0 ? 1.15 : 0.85;
    const height = rowHeight * importance;
    const width = Math.min((height * media.width) / media.height, vw * maxWidthRatio);
    const left = rowAcc[row];
    rowAcc[row] += width + gap;
    return { media, row, left, width, height };
  });

  const ribbonWidth = Math.max(rowAcc[0] - gap, rowAcc[1] - gap, 1);
  // Same off-screen-exit rule as Stream's beats: only the last cluster stops
  // short (so the final photo rides out with the unpin), every other
  // cluster clears fully left before the next one enters.
  const isLastCluster = index === count - 1;
  const exitX = isLastCluster ? -ribbonWidth + vw * 0.6 : -ribbonWidth;
  const x = useTransform(local, [0, 1], [vw, exitX]);

  return (
    <motion.div className="absolute inset-y-0 left-0" style={{ x, width: ribbonWidth }}>
      {laidOut.map((item) => (
        <FilmstripItem key={item.media.src} item={item} clusterX={x} vw={vw} />
      ))}
    </motion.div>
  );
}

function FilmstripItem({ item, clusterX, vw }: { item: LaidOutItem; clusterX: MotionValue<number>; vw: number }) {
  const { media, row, left, width, height } = item;
  const centre = useTransform(clusterX, (v) => v + left + width / 2);
  const scale = useTransform(centre, [0, vw * 0.5, vw], [0.94, 1, 0.94]);
  const opacity = useTransform(
    centre,
    [-width * 0.6, width * 0.4, vw - width * 0.4, vw + width * 0.6],
    [0, 1, 1, 0],
  );

  const topStyle = row === 0 ? { top: "42%", marginTop: -height } : { top: "46%" };

  return (
    <MediaTile
      media={media}
      showCaption={row === 0}
      captionOpacity={opacity}
      style={{ left, width, height, scale, opacity, ...topStyle }}
    />
  );
}

export const filmstripMode: TravelModeDef = {
  id: "filmstrip",
  label: "Filmstrip",
  getSpan,
  Component: FilmstripMode,
};
