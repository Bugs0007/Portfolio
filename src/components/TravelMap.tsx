"use client";

import Image from "next/image";
import { useSyncExternalStore } from "react";
import { journeys } from "@/content/site";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { VideoClip } from "./VideoClip";
import { TravelChapter } from "./TravelChapter";

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

  // Server render and the first client render both produce the static list, so
  // hydration matches exactly and the photos are in the HTML either way. The
  // flowing version takes over once mounted, and never for reduced motion.
  if (reduceMotion || !mounted) return <StaticJourneys />;

  return <FlowingJourneys />;
}

// Every journey gets its own pinned chapter: an oversized title beat, then two
// counter-travelling columns of that trip's media. See TravelChapter.tsx for
// the mechanics.
function FlowingJourneys() {
  return (
    <div id="travel">
      {journeys.map((journey, i) => (
        <TravelChapter
          key={journey.id}
          journey={journey}
          index={i}
          total={journeys.length}
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

// `sizes` defaults to the two-breakpoint string StaticJourneys' grid wants.
// The flowing modes each override it with their own realistic rendered width
// (see TravelModeSpec.getSizes), since a route marker and a full-bleed cinema
// frame differ by about 4x and one shared value made the small ones over-fetch.
export function MediaFrame({
  media,
  sizes = "(min-width: 640px) 52vw, 82vw",
  fit = "contain",
}: {
  media: Playable;
  sizes?: string;
  fit?: "contain" | "cover";
}) {
  if (media.kind === "video" && media.poster) {
    return (
      <VideoClip
        poster={media.poster}
        src={media.src}
        width={media.width}
        height={media.height}
        alt={media.alt}
        fit={fit}
      />
    );
  }
  return (
    <Image
      src={media.src}
      alt={media.alt}
      fill
      sizes={sizes}
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
