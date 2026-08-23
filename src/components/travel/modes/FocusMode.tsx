"use client";

import { motion, useTransform, type MotionValue } from "motion/react";
import type { JourneyMedia } from "@/content/site";
import { chunkMedia } from "@/lib/travel-beats";
import { focusBeats } from "./specs";
import { MediaTile, fitByHeight, useBeatWindow } from "./shared";
import type { TravelModeProps } from "./types";

// A rack focus down the sequence. One frame holds the focal plane, its
// immediate neighbours sit at the edges small and out of focus, and scroll
// walks the focus from one to the next.
//
// Performance note, because blur is the expensive part: the filter lives on
// the beat wrapper, one element, not on each photo inside it. Only the two
// direct neighbours are ever blurred (one on mobile), and everything further
// out is faded to nothing before it would need a filter at all. If this mode
// ever drops frames the radius is the first thing to cut, not the last, and
// will-change is deliberately absent: promoting every beat here would cost
// more in layers than the blur costs in paint.
const BLUR_RADIUS = 8;
const NARROW_BLUR_RADIUS = 6;

export default function FocusMode({ journey, progress, vw, vh, isNarrow, sizes }: TravelModeProps) {
  const count = focusBeats(journey.media.length);
  const beats = chunkMedia(journey.media, count);

  if (beats.length === 0) return null;

  return (
    <div className="absolute inset-0">
      {beats.map((items, i) => (
        <FocusBeat
          key={i}
          items={items}
          progress={progress}
          index={i}
          count={beats.length}
          vw={vw}
          vh={vh}
          isNarrow={isNarrow}
          sizes={sizes}
        />
      ))}
    </div>
  );
}

function FocusBeat({
  items,
  progress,
  index,
  count,
  vw,
  vh,
  isNarrow,
  sizes,
}: {
  items: JourneyMedia[];
  progress: MotionValue<number>;
  index: number;
  count: number;
  vw: number;
  vh: number;
  isNarrow: boolean;
  sizes: string;
}) {
  // Signed distance from the focal plane, in beats. 0 is sharp and centred,
  // ±1 is a neighbour peeking in at an edge.
  const offset = useTransform(progress, (v) => index - v * (count - 1 || 1));

  const radius = isNarrow ? NARROW_BLUR_RADIUS : BLUR_RADIUS;

  // On mobile only the incoming neighbour is kept: two blurred tiles plus a
  // sharp one at phone width is three things competing inside 400 points of
  // width, and the blur is the most expensive of the three.
  const near = isNarrow ? 1 : 1.55;

  const x = useTransform(offset, (d) => d * vw * (isNarrow ? 0.62 : 0.46));
  const scale = useTransform(offset, [-1, 0, 1], [0.6, 1, 0.6]);
  const filter = useTransform(offset, (d) => {
    const amount = Math.min(Math.abs(d), 1) * radius;
    return amount < 0.05 ? "none" : `blur(${amount.toFixed(2)}px)`;
  });
  const opacity = useTransform(
    offset,
    [-near - 0.35, -near + 0.25, 0, near - 0.25, near + 0.35],
    [0, isNarrow ? 0 : 0.55, 1, 0.55, 0],
  );

  // zIndex can't cross over without state, so the focal item is kept on top
  // by depth order instead: beats stack downward and the sharp one is always
  // the one being scrolled onto.
  const height = vh * (isNarrow ? 0.56 : 0.78);

  return (
    <motion.div
      className="absolute left-1/2 top-1/2"
      style={{ x, scale, filter, opacity }}
    >
      {items.map((media, order) => (
        <FocusFrame
          key={media.src}
          media={media}
          offset={offset}
          order={order}
          total={items.length}
          vw={vw}
          height={height}
          isNarrow={isNarrow}
          sizes={sizes}
        />
      ))}
    </motion.div>
  );
}

function FocusFrame({
  media,
  offset,
  order,
  total,
  vw,
  height,
  isNarrow,
  sizes,
}: {
  media: JourneyMedia;
  offset: MotionValue<number>;
  order: number;
  total: number;
  vw: number;
  height: number;
  isNarrow: boolean;
  sizes: string;
}) {
  const size = fitByHeight(media, height, vw, isNarrow ? 0.88 : 0.58);

  // A beat holding two photos dissolves between them in place while it holds
  // the focal plane, so nothing is dropped from a journey just because the
  // beat count is capped below the item count.
  const local = useTransform(offset, [-0.5, 0.5], [1, 0], { clamp: true });
  const sub = useBeatWindow(local, order, total, 0.12);
  const dissolve = useTransform(sub, [0, 0.25, 0.75, 1], [0, 1, 1, 0]);
  // Computed unconditionally and then discarded for single-item beats, rather
  // than branching around the hook.
  const opacity = total === 1 ? 1 : dissolve;

  return (
    <MediaTile
      media={media}
      sizes={sizes}
      showCaption={order === 0}
      captionOpacity={opacity}
      style={{
        left: 0,
        top: 0,
        width: size.width,
        height: size.height,
        x: -size.width / 2,
        y: -size.height / 2,
        opacity,
      }}
    />
  );
}
