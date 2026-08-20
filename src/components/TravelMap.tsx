"use client";

import Image from "next/image";
import { useSyncExternalStore } from "react";
import { journeys } from "@/content/site";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useTravelMode } from "@/hooks/useTravelMode";
import type { TravelMode } from "@/lib/travel-mode";
import { VideoClip } from "./VideoClip";
import { TravelChapter } from "./TravelChapter";
import { TravelModeDevTools } from "./travel/TravelModeDevTools";

const noopSubscribe = () => () => {};

// True only after hydration. useSyncExternalStore gives React an explicit
// server snapshot, so this is a clean two-pass render rather than a setState
// fired from an effect.
function useIsMounted() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

export function TravelMap() {
  const reduceMotion = usePrefersReducedMotion();
  const mounted = useIsMounted();
  // Mode selection is independent of the reduced-motion branch below: the
  // dev tools mount either way (a keyboard switch is harmless under
  // StaticJourneys, which never reads the mode), but only FlowingJourneys
  // actually renders a different gallery treatment per mode.
  const mode = useTravelMode();

  // Server render and the first client render both produce the static list, so
  // hydration matches exactly and the photos are in the HTML either way. The
  // flowing version takes over once mounted, and never for reduced motion.
  if (reduceMotion || !mounted) {
    return (
      <>
        <StaticJourneys />
        <TravelModeDevTools />
      </>
    );
  }

  return (
    <>
      <FlowingJourneys mode={mode} />
      <TravelModeDevTools />
    </>
  );
}

// Every journey gets its own pinned chapter: an oversized title beat, then a
// scroll-scrubbed horizontal rail through that trip's media. See
// TravelChapter.tsx for the mechanics, and src/components/travel/modes for
// the five interchangeable rail treatments `mode` switches between.
function FlowingJourneys({ mode }: { mode: TravelMode }) {
  return (
    <div id="travel">
      {journeys.map((journey, i) => (
        <TravelChapter
          key={journey.id}
          journey={journey}
          index={i}
          total={journeys.length}
          mode={mode}
        />
      ))}
    </div>
  );
}

// Deliberately minimal: only the fields MediaFrame actually reads, so it
// works for Travel's JourneyMedia and Riding's RidingMedia alike without
// either needing fields (caption, coords) the other doesn't have.
type Playable = {
  kind: "image" | "video";
  src: string;
  poster?: string;
  width: number;
  height: number;
  alt: string;
};

export function MediaFrame({ media }: { media: Playable }) {
  if (media.kind === "video" && media.poster) {
    return (
      <VideoClip
        poster={media.poster}
        src={media.src}
        width={media.width}
        height={media.height}
        alt={media.alt}
      />
    );
  }
  return (
    <Image
      src={media.src}
      alt={media.alt}
      fill
      sizes="(min-width: 640px) 52vw, 82vw"
      className="object-cover"
    />
  );
}

// The deliberate static version: same content, same order, no pinning and no
// flow. Also what gets server-rendered, so the photos are in the HTML.
function StaticJourneys() {
  return (
    <section
      id="travel"
      aria-label="Travel"
      className="bg-ink px-6 py-24 sm:px-10 sm:py-32 lg:px-16"
    >
      <h2 className="font-display text-4xl font-medium text-mist sm:text-5xl">
        Travel
      </h2>
      <div className="mt-14 space-y-20">
        {journeys.map((journey) => (
          <div key={journey.id}>
            <p className="font-mono text-xs uppercase tracking-wider text-stone">
              {journey.when}
            </p>
            <h3 className="mt-2 font-display text-3xl font-medium text-mist sm:text-4xl">
              {journey.title}
            </h3>
            <p className="font-mono text-sm text-stone">{journey.region}</p>
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {journey.media.map((media) => (
                <figure key={media.src}>
                  <div
                    className="relative overflow-hidden bg-ink-soft"
                    style={{ aspectRatio: `${media.width} / ${media.height}` }}
                  >
                    <MediaFrame media={media} />
                  </div>
                  <figcaption className="mt-2 flex items-baseline gap-2 font-mono text-[10px] uppercase tracking-wider text-stone">
                    <span>{media.caption}</span>
                    {media.coords && (
                      <span className="text-stone/60">
                        {media.coords.lat.toFixed(3)}°,{" "}
                        {media.coords.lon.toFixed(3)}°
                      </span>
                    )}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
