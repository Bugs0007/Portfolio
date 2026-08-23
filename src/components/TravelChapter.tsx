"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";
import type { Journey } from "@/content/site";
import type { TravelMode } from "@/lib/travel-mode";
import { TRAVEL_MODE_DEFS } from "./travel/modes";

// The pinned-chapter treatment: each journey gets its own pin, opening with an
// oversized title beat, then converting further scroll into a horizontal,
// scroll-scrubbed rail through that trip's media. Nothing here plays on a
// timer, every motion value is a direct read of scroll position, reversible
// in both directions. Which rail treatment plays is decided entirely by
// `mode`: see src/components/travel/modes for the five interchangeable
// implementations, all reading the same journey data.

export function TravelChapter({
  journey,
  index,
  total,
  mode,
}: {
  journey: Journey;
  index: number;
  total: number;
  mode: TravelMode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ vw: 0, vh: 0 });

  useEffect(() => {
    const measure = () =>
      setSize({ vw: window.innerWidth, vh: window.innerHeight });
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const isNarrow = size.vw > 0 && size.vw < 640;
  const modeDef = TRAVEL_MODE_DEFS[mode];

  // One full viewport height for the title beat, then room for the rail.
  // Each mode compresses its own rail span from a beat count instead of raw
  // media count (see src/lib/travel-beats.ts), so a 40-photo journey no
  // longer drags the section out linearly the way one beat per photo did.
  //
  // Both of these come from the mode's eagerly-imported spec, never from its
  // lazy component: the container has to be the right height and the images
  // have to be requested at the right size on the very first frame, before
  // the mode's own chunk has finished loading.
  const introSpan = 1;
  const railSpan = modeDef.getSpan(journey.media.length, isNarrow);
  const sizes = modeDef.getSizes(isNarrow);
  const totalSpan = introSpan + railSpan;
  const introFraction = introSpan / totalSpan;

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const railProgress = useTransform(
    scrollYProgress,
    [introFraction, 1],
    [0, 1],
  );

  return (
    <section
      aria-label={`${journey.title} chapter`}
      className="relative bg-ink"
    >
      <div
        ref={containerRef}
        style={{ height: `${totalSpan * 100}vh` }}
        className="relative"
      >
        <div className="sticky top-0 flex h-screen w-full flex-col overflow-hidden">
          <ChapterHeader
            journey={journey}
            index={index}
            total={total}
            scrollYProgress={scrollYProgress}
            introFraction={introFraction}
          />

          <div
            className="relative flex-1 overflow-hidden"
            style={{
              maskImage:
                "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
              WebkitMaskImage:
                "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
            }}
          >
            {size.vw > 0 && (
              // Nothing is rendered while the mode's chunk is in flight. The
              // chapter's title beat owns the first viewport-height of scroll
              // either way, so the rail has not been reached yet and a
              // spinner here would be an interruption, not a reassurance.
              <Suspense fallback={null}>
                <modeDef.Component
                  journey={journey}
                  progress={railProgress}
                  vw={size.vw}
                  vh={size.vh}
                  isNarrow={isNarrow}
                  sizes={sizes}
                />
              </Suspense>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// The oversized title beat: fills the screen as the chapter opens, then
// dissolves as scroll hands off into the rail. A slim persistent header
// (trip name, when, region) fades in underneath as it goes, so context stays
// on screen for the rest of the scrub without a second big title.
function ChapterHeader({
  journey,
  index,
  total,
  scrollYProgress,
  introFraction,
}: {
  journey: Journey;
  index: number;
  total: number;
  scrollYProgress: MotionValue<number>;
  introFraction: number;
}) {
  // Kept short deliberately: this window is exactly what's on screen right as
  // the previous chapter's last photo has already faded off, so the longer
  // this ramp, the longer the screen sits empty between chapters.
  const revealOpacity = useTransform(
    scrollYProgress,
    [0, introFraction * 0.18],
    [0, 1],
  );
  const revealY = useTransform(
    scrollYProgress,
    [0, introFraction * 0.18],
    [40, 0],
  );
  const dividerScale = useTransform(
    scrollYProgress,
    [0, introFraction],
    [0.94, 1.04],
  );
  const holdOutOpacity = useTransform(
    scrollYProgress,
    [introFraction * 0.62, introFraction * 0.92],
    [1, 0],
  );
  const dividerOpacity = useTransform(
    [revealOpacity, holdOutOpacity],
    ([a, b]: number[]) => Math.min(a, b),
  );

  const infoOpacity = useTransform(
    scrollYProgress,
    [introFraction * 0.75, introFraction],
    [0, 1],
  );
  const infoY = useTransform(
    scrollYProgress,
    [introFraction * 0.75, introFraction],
    [16, 0],
  );

  // The oversized divider is sized off a single clamp rather than fixed vw
  // breakpoints, scaled down for longer titles ("Uttarakhand" vs "Zanskar")
  // so every chapter's title stays on one line at any width.
  const titleScale = Math.min(1, 11 / journey.title.length);
  const titleFontSize = `clamp(${(2.6 * titleScale).toFixed(2)}rem, ${(15 * titleScale).toFixed(2)}vw, ${(10.5 * titleScale).toFixed(2)}rem)`;

  return (
    <>
      <motion.div
        style={{ opacity: dividerOpacity }}
        className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-center px-6 sm:px-10 lg:px-16"
      >
        <p className="font-mono text-xs uppercase tracking-wider text-stone">
          {String(index + 1).padStart(2, "0")} /{" "}
          {String(total).padStart(2, "0")}
          {"  "}— {journey.when}
        </p>
        <motion.h3
          style={{ y: revealY, scale: dividerScale, fontSize: titleFontSize }}
          className="mt-2 font-display font-medium leading-[0.88] text-mist"
        >
          {journey.title}
        </motion.h3>
      </motion.div>

      <motion.div
        style={{ opacity: infoOpacity, y: infoY }}
        className="absolute inset-x-0 top-0 z-10 flex items-baseline justify-between px-6 pt-20 sm:px-10 lg:px-16"
      >
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-stone">
            {journey.title}
          </p>
          <p className="font-mono text-[11px] text-stone/70">
            {journey.region}
          </p>
        </div>
        <p className="font-mono text-xs uppercase tracking-wider text-stone/70">
          {String(index + 1).padStart(2, "0")} /{" "}
          {String(total).padStart(2, "0")}
        </p>
      </motion.div>
    </>
  );
}
