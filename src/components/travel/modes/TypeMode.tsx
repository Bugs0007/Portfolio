"use client";

import { motion, useTransform, type MotionValue } from "motion/react";
import type { JourneyMedia } from "@/content/site";
import { chunkMedia } from "@/lib/travel-beats";
import { typeBeats } from "./specs";
import { MediaTile, fitByHeight, useBeatWindow } from "./shared";
import type { TravelModeProps } from "./types";

// The place name is the subject and the photographs move behind it.
//
// WHICH PATH SHIPPED: mix-blend-mode: difference, not the SVG text mask.
//
// The mask was tried first and does not survive this content. An SVG <mask>
// can only mask SVG content, so masking a live <video> through letterforms
// means <foreignObject>, which does not composite reliably across browsers
// and drops the video outright in Safari. background-clip: text is the other
// usual route and it cannot take a video at all, only a background image.
// Since 15 of this section's 35 media items are video and MediaFrame renders
// them as real <video> elements (they are deliberately never flattened to
// stills), any masking approach would have had to special-case half the
// media. Difference blending treats video and stills identically, needs no
// per-item branch, and keeps the letterforms legible over both.

export default function TypeMode({ journey, progress, vw, vh, isNarrow, sizes }: TravelModeProps) {
  const count = typeBeats(journey.media.length);
  const beats = chunkMedia(journey.media, count);

  // A slow contrary drift on the title: enough that the layer is clearly
  // alive, not so much that the word stops being readable.
  const titleX = useTransform(progress, [0, 1], [vw * 0.06, -vw * 0.06]);

  if (beats.length === 0) return null;

  // Scaled off the title length the same way the chapter header does it, so
  // "Uttarakhand" and "Zanskar" both stay on one line at any width.
  const titleScale = Math.min(1, 11 / journey.title.length);
  const fontSize = `clamp(${(2.4 * titleScale).toFixed(2)}rem, ${(18 * titleScale).toFixed(2)}vw, ${(13 * titleScale).toFixed(2)}rem)`;

  return (
    <div className="absolute inset-0 overflow-hidden">
      {beats.map((items, i) => (
        <TypeBeat
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

      <motion.div
        style={{ x: titleX, mixBlendMode: "difference" }}
        className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
      >
        <h3
          style={{ fontSize }}
          className="whitespace-nowrap font-display font-medium leading-none text-mist"
        >
          {journey.title}
        </h3>
      </motion.div>
    </div>
  );
}

function TypeBeat({
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
  const local = useBeatWindow(progress, index, count, 0.3);

  // Alternating lanes above and below the centre line, so photographs pass
  // through the word rather than always behind the same part of it.
  const lane = ((index % 3) - 1) * (isNarrow ? 0.16 : 0.22);
  // Mobile shows one photograph per beat: two crossing behind a word that is
  // already 18vw tall is unreadable at phone width.
  const shown = isNarrow ? items.slice(0, 1) : items.slice(0, 2);

  return (
    <>
      {shown.map((media, order) => (
        <TypeFrame
          key={media.src}
          media={media}
          local={local}
          order={order}
          lane={lane}
          direction={index % 2 === 0 ? 1 : -1}
          vw={vw}
          vh={vh}
          isNarrow={isNarrow}
          sizes={sizes}
        />
      ))}
    </>
  );
}

function TypeFrame({
  media,
  local,
  order,
  lane,
  direction,
  vw,
  vh,
  isNarrow,
  sizes,
}: {
  media: JourneyMedia;
  local: MotionValue<number>;
  order: number;
  lane: number;
  direction: number;
  vw: number;
  vh: number;
  isNarrow: boolean;
  sizes: string;
}) {
  const size = fitByHeight(media, vh * (isNarrow ? 0.34 : 0.44), vw, isNarrow ? 0.72 : 0.46);

  // The second photograph in a beat trails the first rather than sitting
  // beside it, so the layer behind the word is never crowded.
  const trail = order * 0.26;
  const travel = vw * 0.62 + size.width;

  // Centring offset folded into the range rather than layered on with a
  // second transform, so `x` stays a single value read straight off scroll.
  const x = useTransform(
    local,
    [trail, 1],
    [direction * travel * 0.5 - size.width / 2, -direction * travel * 0.5 - size.width / 2],
  );
  const y = lane * vh;
  // Deliberately dim: this layer is texture for the word to cut through, and
  // at full opacity the difference blend turns the title into noise.
  const opacity = useTransform(
    local,
    [trail, trail + 0.18, 0.82, 1],
    [0, isNarrow ? 0.5 : 0.62, isNarrow ? 0.5 : 0.62, 0],
  );

  return (
    <MediaTile
      media={media}
      sizes={sizes}
      showCaption={false}
      hoverScale={1}
      style={{
        left: "50%",
        top: "50%",
        width: size.width,
        height: size.height,
        x,
        y: y - size.height / 2,
        opacity,
      }}
    />
  );
}
