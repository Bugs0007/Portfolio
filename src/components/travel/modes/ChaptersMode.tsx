"use client";

import { useTransform, type MotionValue } from "motion/react";
import type { JourneyMedia } from "@/content/site";
import { beatCountFor, chunkMedia, railSpanForBeats } from "@/lib/travel-beats";
import { MediaTile, useBeatWindow } from "./shared";
import type { TravelModeDef, TravelModeProps } from "./types";

// 3-5 cinematic scenes instead of one beat per photo: each scene is a hero
// (the first, chronologically earliest, item in its slice) plus a handful of
// supporting frames, so a 40-photo journey reads as roughly five considered
// moments rather than forty individual beats.
function beatCount(n: number) {
  return beatCountFor(n, { base: 3, growth: 1.4, min: Math.min(3, n) || 1, max: 5 });
}

function getSpan(n: number) {
  return railSpanForBeats(beatCount(n), 0.95);
}

function ChaptersMode({ journey, progress, vw, vh, isNarrow }: TravelModeProps) {
  const count = beatCount(journey.media.length);
  const chunks = chunkMedia(journey.media, count);
  const maxSupporting = isNarrow ? 2 : 4;

  if (chunks.length === 0) return null;

  return (
    <div className="absolute inset-0">
      {chunks.map((chunk, i) => (
        <Scene
          key={i}
          hero={chunk[0]}
          supporting={chunk.slice(1, 1 + maxSupporting)}
          progress={progress}
          index={i}
          count={chunks.length}
          vw={vw}
          vh={vh}
          isNarrow={isNarrow}
        />
      ))}
    </div>
  );
}

function Scene({
  hero,
  supporting,
  progress,
  index,
  count,
  vw,
  vh,
  isNarrow,
}: {
  hero: JourneyMedia;
  supporting: JourneyMedia[];
  progress: MotionValue<number>;
  index: number;
  count: number;
  vw: number;
  vh: number;
  isNarrow: boolean;
}) {
  // Tighter than the other modes' overlap: hero and supporting positions are
  // fixed per scene (not sliding off-screen like a ribbon), so a wide
  // overlap reads as two scenes double-exposed rather than a clean dissolve.
  const local = useBeatWindow(progress, index, count, 0.1);

  const heroHeight = vh * (isNarrow ? 0.4 : 0.62);
  const heroWidth = Math.min((heroHeight * hero.width) / hero.height, vw * (isNarrow ? 0.86 : 0.5));
  const heroLeft = isNarrow ? (vw - heroWidth) / 2 : vw * 0.07;

  const heroOpacity = useTransform(local, [0, 0.14, 0.86, 1], [0, 1, 1, 0]);
  const heroScale = useTransform(local, [0, 0.16, 1], [0.96, 1, 0.99]);
  const heroX = useTransform(local, [0, 0.16], [isNarrow ? 0 : -28, 0]);

  return (
    <>
      <MediaTile
        media={hero}
        captionOpacity={heroOpacity}
        style={{
          left: heroLeft,
          top: "50%",
          marginTop: -heroHeight / 2,
          width: heroWidth,
          height: heroHeight,
          scale: heroScale,
          opacity: heroOpacity,
          x: heroX,
          zIndex: 2,
        }}
      />
      {supporting.map((media, i) => (
        <SupportItem
          key={media.src}
          media={media}
          local={local}
          order={i}
          total={supporting.length}
          vw={vw}
          vh={vh}
          isNarrow={isNarrow}
        />
      ))}
    </>
  );
}

function SupportItem({
  media,
  local,
  order,
  total,
  vw,
  vh,
  isNarrow,
}: {
  media: JourneyMedia;
  local: MotionValue<number>;
  order: number;
  total: number;
  vw: number;
  vh: number;
  isNarrow: boolean;
}) {
  const height = vh * (isNarrow ? 0.16 : 0.2);
  const width = Math.min((height * media.width) / media.height, vw * (isNarrow ? 0.34 : 0.24));

  const enterStart = 0.12 + order * 0.09;
  const opacity = useTransform(
    local,
    [enterStart, Math.min(enterStart + 0.16, 0.7), 0.86, 1],
    [0, 1, 1, 0],
  );
  const y = useTransform(local, [enterStart, Math.min(enterStart + 0.16, 0.7)], [18, 0]);

  const style = isNarrow
    ? {
        left: `${10 + order * (80 / Math.max(total, 1))}%`,
        top: "78%",
      }
    : {
        left: `${64 + (order % 2) * 6}%`,
        top: `${14 + order * (76 / Math.max(total, 1))}%`,
      };

  return (
    <MediaTile
      media={media}
      showCaption={false}
      style={{
        ...style,
        width,
        height,
        opacity,
        y,
        zIndex: 1,
      }}
    />
  );
}

export const chaptersMode: TravelModeDef = {
  id: "chapters",
  label: "Chapters",
  getSpan,
  Component: ChaptersMode,
};
