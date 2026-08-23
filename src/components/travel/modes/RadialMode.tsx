"use client";

import { motion, useTransform, type MotionValue } from "motion/react";
import type { JourneyMedia } from "@/content/site";
import { chunkMedia } from "@/lib/travel-beats";
import { radialBeats } from "./specs";
import { MediaTile, useBeatWindow } from "./shared";
import type { TravelModeProps } from "./types";

// A carousel seen face on. Beats sit at fixed angles on a ring, scroll turns
// the ring, and whichever photograph reaches twelve o'clock grows and takes
// the caption.
//
// Every item counter-rotates by exactly the ring's own rotation plus its own
// angle, so the photographs stay upright the whole way round: the ring turns,
// the pictures do not. Emphasis comes from cos(angle from top), which peaks
// smoothly at the top and needs no comparison against the other items and no
// state to track which one is currently "the" active one.

// A little over one full turn, so the ring is still moving as the pin
// releases rather than parking dead at its starting angle.
const TOTAL_ROTATION = 400;

export default function RadialMode({ journey, progress, vw, vh, isNarrow, sizes }: TravelModeProps) {
  const count = radialBeats(journey.media.length);
  const beats = chunkMedia(journey.media, count);

  // Ring rotation in degrees. Negative so the ring carries slots up past the
  // top in reading order, first beat first.
  const rotation = useTransform(progress, [0, 1], [0, -TOTAL_ROTATION]);

  if (beats.length === 0) return null;

  const vmin = Math.min(vw, vh);
  const radius = vmin * (isNarrow ? 0.36 : 0.42);
  const step = 360 / beats.length;
  // Tiles have to fit the arc each slot actually owns, or a ten-slot ring
  // overlaps itself into an unreadable pinwheel. Sized off the chord between
  // neighbouring slots rather than a fixed fraction of the viewport, so the
  // ring stays legible whether a journey fills 4 slots or 10.
  const chord = 2 * radius * Math.sin(Math.PI / Math.max(beats.length, 2));
  const tileWidth = Math.min(chord * 0.86, vw * (isNarrow ? 0.34 : 0.22));

  return (
    <div className="absolute inset-0">
      <motion.div className="absolute left-1/2 top-1/2" style={{ rotate: rotation }}>
        {beats.map((items, i) => (
          <RingSlot
            key={i}
            items={items}
            progress={progress}
            rotation={rotation}
            angle={i * step}
            radius={radius}
            tileWidth={tileWidth}
            vh={vh}
            isNarrow={isNarrow}
            sizes={sizes}
          />
        ))}
      </motion.div>
    </div>
  );
}

function RingSlot({
  items,
  progress,
  rotation,
  angle,
  radius,
  tileWidth,
  vh,
  isNarrow,
  sizes,
}: {
  items: JourneyMedia[];
  progress: MotionValue<number>;
  rotation: MotionValue<number>;
  angle: number;
  radius: number;
  tileWidth: number;
  vh: number;
  isNarrow: boolean;
  sizes: string;
}) {
  // How close this slot is to twelve o'clock, 1 at the top, -1 at the bottom.
  // The ring's rotation is already in the same units as the slot's own angle,
  // so this is a plain sum.
  const proximity = useTransform(rotation, (r) => Math.cos(((angle + r) * Math.PI) / 180));

  // Only the top of the ring is emphasised; the falloff is sharpened so the
  // effect is clearly on one photograph rather than smeared across three.
  const emphasis = useTransform(proximity, (p) => Math.max(0, p) ** 3);
  const scale = useTransform(emphasis, [0, 1], [0.78, 1.25]);
  const opacity = useTransform(proximity, [-1, -0.35, 0.4, 1], [0.25, 0.45, 0.9, 1]);
  const captionOpacity = useTransform(emphasis, [0.45, 0.85], [0, 1]);
  // Cancels the ring so the photograph itself never tilts. Only the ring's
  // own rotation is undone here, not the slot angle: the wrapper below
  // already nets to zero rotation (it turns by `angle` to step out along the
  // radius, then immediately turns back by `-angle`). Subtracting the angle a
  // second time is what left every photograph lying on its side.
  const counterRotate = useTransform(rotation, (r) => -r);

  const maxHeight = vh * (isNarrow ? 0.22 : 0.26);

  return (
    <div
      className="absolute left-0 top-0"
      // Static placement on the circle: rotate out to the slot's angle, step
      // out by the radius, then undo the angle so the box is axis-aligned
      // before anything animated touches it.
      style={{ transform: `rotate(${angle}deg) translateY(${-radius}px) rotate(${-angle}deg)` }}
    >
      <motion.div style={{ rotate: counterRotate, scale }}>
        {items.map((media, order) => (
          <RingFrame
            key={media.src}
            media={media}
            progress={progress}
            order={order}
            total={items.length}
            captionOpacity={captionOpacity}
            slotOpacity={opacity}
            tileWidth={tileWidth}
            maxHeight={maxHeight}
            sizes={sizes}
          />
        ))}
      </motion.div>
    </div>
  );
}

function RingFrame({
  media,
  progress,
  order,
  total,
  captionOpacity,
  slotOpacity,
  tileWidth,
  maxHeight,
  sizes,
}: {
  media: JourneyMedia;
  progress: MotionValue<number>;
  order: number;
  total: number;
  captionOpacity: MotionValue<number>;
  slotOpacity: MotionValue<number>;
  tileWidth: number;
  maxHeight: number;
  sizes: string;
}) {
  // Width is fixed by the slot's arc; height follows the photo's own ratio
  // but is capped so a portrait frame can't tower over its neighbours.
  const height = Math.min((tileWidth * media.height) / media.width, maxHeight);
  const size = { width: (height * media.width) / media.height, height };

  // A slot carrying two photographs cycles between them across the whole
  // rotation, so a capped beat count never means a dropped photograph.
  const sub = useBeatWindow(progress, order, total, 0.15);
  const cycle = useTransform(sub, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  const opacity = useTransform([slotOpacity, cycle], ([s, c]: number[]) =>
    total === 1 ? s : s * c,
  );

  return (
    <MediaTile
      media={media}
      sizes={sizes}
      showCaption={order === 0}
      captionOpacity={captionOpacity}
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
