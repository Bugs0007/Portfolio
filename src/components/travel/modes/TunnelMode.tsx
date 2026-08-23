"use client";

import { motion, useTransform, type MotionValue } from "motion/react";
import type { JourneyMedia } from "@/content/site";
import { chunkMedia } from "@/lib/travel-beats";
import { tunnelBeats } from "./specs";
import { MediaTile, fitByHeight, layOut } from "./shared";
import type { TravelModeProps } from "./types";

// A dolly down the Z axis. Beats sit on fixed planes 420px apart in a
// perspective space and the camera moves forward through them, so items
// approach, swell past the frame, and are gone. Scale is never animated
// directly here: it falls out of the perspective divide, which is what makes
// the approach feel like distance rather than a zoom.
//
// Beats are offset off-axis so the camera isn't flying down a single line,
// and the offsets are a fixed cycle rather than random, so two loads of the
// same journey fly exactly the same route.

const PLANE_GAP = 420;
const PERSPECTIVE = 1200;

// Fractions of the viewport, cycled by beat index.
const OFFSETS: { x: number; y: number }[] = [
  { x: 0, y: 0 },
  { x: 0.16, y: -0.1 },
  { x: -0.18, y: 0.08 },
  { x: 0.1, y: 0.14 },
  { x: -0.12, y: -0.12 },
  { x: 0.2, y: 0.04 },
  { x: -0.08, y: 0.16 },
];

export default function TunnelMode({ journey, progress, vw, vh, isNarrow, sizes }: TravelModeProps) {
  const count = tunnelBeats(journey.media.length);
  const beats = chunkMedia(journey.media, count);
  // Two items abreast on a plane at desktop, one on mobile: a plane that
  // arrives holding three tiles at near-camera scale is unreadable.
  const perPlane = isNarrow ? 1 : 2;

  if (beats.length === 0) return null;

  // The camera starts just behind the first plane and travels past the last.
  const travel = (beats.length - 1) * PLANE_GAP + PLANE_GAP * 1.6;

  return (
    <div
      className="absolute inset-0"
      style={{ perspective: `${PERSPECTIVE}px`, transformStyle: "preserve-3d" }}
    >
      {beats.map((items, i) => (
        <TunnelPlane
          key={i}
          items={items.slice(0, perPlane)}
          progress={progress}
          index={i}
          travel={travel}
          offset={OFFSETS[i % OFFSETS.length]}
          vw={vw}
          vh={vh}
          isNarrow={isNarrow}
          sizes={sizes}
        />
      ))}
    </div>
  );
}

function TunnelPlane({
  items,
  progress,
  index,
  travel,
  offset,
  vw,
  vh,
  isNarrow,
  sizes,
}: {
  items: JourneyMedia[];
  progress: MotionValue<number>;
  index: number;
  travel: number;
  offset: { x: number; y: number };
  vw: number;
  vh: number;
  isNarrow: boolean;
  sizes: string;
}) {
  const restZ = -index * PLANE_GAP;

  // Camera position folded straight into the plane's own Z, so one motion
  // value carries the whole dolly. Linear in progress, therefore exactly
  // reversible on scroll-up.
  const z = useTransform(progress, (v) => restZ + v * travel);

  // Fade in out of the far distance and out again as the plane reaches the
  // camera. Past the camera plane the tile is behind the viewer and is
  // dropped to zero: a real cull isn't possible without state, and state
  // driving animation is exactly what this rig forbids, so this is a visual
  // cull. The DOM stays small anyway because tunnelBeats caps at 7.
  const opacity = useTransform(
    z,
    [-PLANE_GAP * 4.2, -PLANE_GAP * 2.6, -PLANE_GAP * 0.5, -60],
    [0, 1, 1, 0],
  );

  const height = vh * (isNarrow ? 0.34 : 0.4);
  const gap = isNarrow ? 0 : 30;
  const laid = items.map((m) => fitByHeight(m, height, vw, isNarrow ? 0.66 : 0.34));
  const planeWidth = laid.reduce((sum, l, i) => sum + l.width + (i > 0 ? gap : 0), 0);

  const lefts = layOut(
    laid.map((l) => l.width),
    gap,
  );

  return (
    <motion.div
      className="absolute left-1/2 top-1/2"
      style={{
        x: offset.x * vw,
        y: offset.y * vh,
        z,
        opacity,
        transformStyle: "preserve-3d",
      }}
    >
      {items.map((media, i) => (
        <MediaTile
          key={media.src}
          media={media}
          sizes={sizes}
          showCaption={i === 0}
          captionOpacity={opacity}
          style={{
            left: 0,
            top: 0,
            width: laid[i].width,
            height: laid[i].height,
            x: lefts[i] - planeWidth / 2,
            y: -laid[i].height / 2,
          }}
        />
      ))}
    </motion.div>
  );
}
