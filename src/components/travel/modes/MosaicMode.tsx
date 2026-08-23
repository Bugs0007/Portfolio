"use client";

import { useTransform, type MotionValue } from "motion/react";
import type { JourneyMedia } from "@/content/site";
import { chunkMedia } from "@/lib/travel-beats";
import { MOSAIC_HOLD, mosaicBeats } from "./specs";
import { MediaTile } from "./shared";
import type { TravelModeProps } from "./types";

// The composition assembles itself. Tiles fly a short distance into a fixed
// grid, beat by beat, and once the last one lands the finished sheet is held
// still for the tail of the span, so the mode ends on the picture rather than
// on the movement.
//
// Tile spans come from each photo's own aspect ratio, so the grid is a
// consequence of the media rather than a template the media is cropped into:
// the landscape frames take two columns, the portraits (several are
// 1237x2200) take two rows.

// Entry offsets, cycled by index. Deliberately short: this is a landing, not
// a flight, and the drama belongs to the assembled whole.
const ENTRY: { x: number; y: number }[] = [
  { x: -34, y: 22 },
  { x: 28, y: 30 },
  { x: -22, y: -28 },
  { x: 36, y: -18 },
  { x: 0, y: 38 },
  { x: -38, y: -8 },
  { x: 18, y: 34 },
  { x: -14, y: 30 },
];

type Placed = {
  media: JourneyMedia;
  beatIndex: number;
  colSpan: number;
  rowSpan: number;
  entry: { x: number; y: number };
};

export default function MosaicMode({ journey, progress, vh, isNarrow, sizes }: TravelModeProps) {
  const count = mosaicBeats(journey.media.length);
  const beats = chunkMedia(journey.media, count);
  const columns = isNarrow ? 3 : 6;

  // The assembly consumes everything but the hold; MOSAIC_HOLD is already
  // baked into this mode's span, so the tail is real still time rather than
  // the section simply ending early. Declared before the empty-journey bail
  // out below, so the hook order never depends on the data.
  const assembly = useTransform(progress, [0, 1 - MOSAIC_HOLD], [0, 1], { clamp: true });

  if (beats.length === 0) return null;

  const placed: Placed[] = [];
  let n = 0;
  beats.forEach((items, beatIndex) => {
    for (const media of items) {
      const landscape = media.width >= media.height;
      placed.push({
        media,
        beatIndex,
        colSpan: landscape ? 2 : 1,
        rowSpan: landscape ? 1 : 2,
        entry: ENTRY[n % ENTRY.length],
      });
      n++;
    }
  });

  // Row height is derived so the whole sheet fits the pinned frame whatever
  // the item count, rather than overflowing on the 15-item journey.
  const unitsPerRow = columns;
  const totalUnits = placed.reduce((sum, p) => sum + p.colSpan * p.rowSpan, 0);
  const estRows = Math.max(2, Math.ceil(totalUnits / unitsPerRow) + 1);
  const rowHeight = Math.min((vh * 0.82) / estRows, vh * 0.2);

  return (
    <div className="absolute inset-0 flex items-center justify-center px-6 sm:px-10 lg:px-16">
      <div
        className="grid w-full gap-2 sm:gap-3"
        style={{
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          gridAutoRows: `${rowHeight}px`,
          gridAutoFlow: "dense",
          maxWidth: isNarrow ? "100%" : "80rem",
        }}
      >
        {placed.map((p) => (
          <MosaicTile
            key={p.media.src}
            placed={p}
            assembly={assembly}
            beatCount={beats.length}
            sizes={sizes}
          />
        ))}
      </div>
    </div>
  );
}

function MosaicTile({
  placed,
  assembly,
  beatCount,
  sizes,
}: {
  placed: Placed;
  assembly: MotionValue<number>;
  beatCount: number;
  sizes: string;
}) {
  const { media, beatIndex, colSpan, rowSpan, entry } = placed;

  // Each beat lands over its own slice of the assembly, and stays landed.
  // One-directional on purpose: a tile that has arrived does not drift again
  // while later tiles are still coming in.
  const start = beatIndex / beatCount;
  const end = start + 1 / beatCount;

  const t = useTransform(assembly, [start, end], [0, 1], { clamp: true });
  const opacity = useTransform(t, [0, 0.32], [0, 1]);
  const scale = useTransform(t, [0, 1], [0.8, 1]);
  const x = useTransform(t, [0, 1], [entry.x, 0]);
  const y = useTransform(t, [0, 1], [entry.y, 0]);

  return (
    <div style={{ gridColumn: `span ${colSpan}`, gridRow: `span ${rowSpan}`, position: "relative" }}>
      <MediaTile
        media={media}
        sizes={sizes}
        // A mosaic is read as one composition; a caption under every tile
        // turns it into a contact sheet with paperwork.
        showCaption={false}
        style={{
          left: 0,
          top: 0,
          width: "100%",
          height: "100%",
          x,
          y,
          scale,
          opacity,
        }}
      />
    </div>
  );
}
