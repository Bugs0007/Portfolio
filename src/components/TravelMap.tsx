"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useMotionValueEvent,
  type MotionValue,
} from "motion/react";
import { journeys, type Journey, type JourneyMedia } from "@/content/site";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { VideoClip } from "./VideoClip";

const EASE = [0.16, 1, 0.3, 1] as const;

// Scroll length per journey, in viewport heights. Longer trips get more room so
// every photo gets roughly the same amount of screen time.
const SPANS = journeys.map((j) => Math.max(1.15, j.media.length * 0.5));
const TOTAL_SPAN = SPANS.reduce((a, b) => a + b, 0);

function journeyAt(progress: number) {
  const p = progress * TOTAL_SPAN;
  let acc = 0;
  for (let i = 0; i < SPANS.length; i++) {
    if (p < acc + SPANS[i]) {
      return { index: i, local: (p - acc) / SPANS[i] };
    }
    acc += SPANS[i];
  }
  return { index: SPANS.length - 1, local: 1 };
}

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
  if (reduceMotion || !mounted) {
    return <StaticJourneys />;
  }

  return <FlowingJourneys />;
}

function FlowingJourneys() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [size, setSize] = useState({ vw: 0, vh: 0 });

  useEffect(() => {
    const measure = () =>
      setSize({ vw: window.innerWidth, vh: window.innerHeight });
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const { scrollYProgress } = useScroll({
    target: wrapperRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const { index } = journeyAt(v);
    setActiveIndex((prev) => (prev === index ? prev : index));
  });

  // Pure function of scroll, no dependency on the active-index state, so it
  // stays smooth across journey boundaries.
  const localProgress = useTransform(scrollYProgress, (v) => journeyAt(v).local);

  const journey = journeys[activeIndex];

  return (
    <section id="travel" aria-label="Travel" className="relative bg-ink">
      <div
        ref={wrapperRef}
        style={{ height: `${TOTAL_SPAN * 100}vh` }}
        className="relative"
      >
        <div className="sticky top-0 flex h-screen w-full flex-col overflow-hidden">
          <div className="flex items-baseline justify-between px-6 pt-20 sm:px-10 lg:px-16">
            <p className="font-mono text-xs uppercase tracking-wider text-stone">
              Travel
            </p>
            <p className="font-mono text-xs uppercase tracking-wider text-stone/70">
              {String(activeIndex + 1).padStart(2, "0")} /{" "}
              {String(journeys.length).padStart(2, "0")}
            </p>
          </div>

          <div className="relative flex-1 overflow-hidden">
            {size.vw > 0 && (
              <Ribbon
                key={journey.id}
                journey={journey}
                localProgress={localProgress}
                vw={size.vw}
                vh={size.vh}
              />
            )}
          </div>

          <div className="px-6 pb-14 sm:px-10 lg:px-16">
            <AnimatePresence mode="wait">
              <motion.div
                key={journey.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4, ease: EASE }}
              >
                <p className="font-mono text-xs uppercase tracking-wider text-stone">
                  {journey.when}
                </p>
                <h3 className="mt-2 font-display text-4xl font-medium text-mist sm:text-6xl">
                  {journey.title}
                </h3>
                <p className="font-mono text-sm text-stone">{journey.region}</p>
                {journey.blurb && (
                  <p className="mt-3 max-w-xl text-sm leading-relaxed text-mist/85">
                    {journey.blurb}
                  </p>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

// One trip's media, laid out end to end and flowed across the screen as a
// group. Each item rides a sine curve as it crosses, so the set moves like a
// current rather than a stack of cards being dealt.
function Ribbon({
  journey,
  localProgress,
  vw,
  vh,
}: {
  journey: Journey;
  localProgress: MotionValue<number>;
  vw: number;
  vh: number;
}) {
  const isNarrow = vw < 640;
  const height = vh * (isNarrow ? 0.4 : 0.46);
  const gap = isNarrow ? 18 : 34;

  const widths = journey.media.map((m) =>
    Math.min((height * m.width) / m.height, vw * (isNarrow ? 0.82 : 0.52)),
  );
  const offsets: number[] = [];
  let acc = 0;
  for (const w of widths) {
    offsets.push(acc);
    acc += w + gap;
  }
  const ribbonWidth = acc;

  // Starts fully off the right edge, ends fully off the left one.
  const x = useTransform(localProgress, [0, 1], [vw, -ribbonWidth]);

  return (
    <motion.div
      className="absolute inset-y-0 left-0"
      style={{ x, width: ribbonWidth }}
    >
      {journey.media.map((media, i) => (
        <FlowItem
          key={media.src}
          media={media}
          ribbonX={x}
          left={offsets[i]}
          width={widths[i]}
          height={height}
          vw={vw}
          vh={vh}
        />
      ))}
    </motion.div>
  );
}

function FlowItem({
  media,
  ribbonX,
  left,
  width,
  height,
  vw,
  vh,
}: {
  media: JourneyMedia;
  ribbonX: MotionValue<number>;
  left: number;
  width: number;
  height: number;
  vw: number;
  vh: number;
}) {
  // Where this item's centre currently sits on screen, in px from the left edge.
  const centre = useTransform(ribbonX, (v) => v + left + width / 2);

  const wave = (c: number) => (c / vw) * Math.PI * 1.35;
  const y = useTransform(centre, (c) => Math.sin(wave(c)) * vh * 0.08);
  const rotate = useTransform(centre, (c) => Math.cos(wave(c)) * 4.5);
  const scale = useTransform(centre, [0, vw / 2, vw], [0.92, 1, 0.92]);
  const opacity = useTransform(
    centre,
    [-width * 0.6, width * 0.4, vw - width * 0.4, vw + width * 0.6],
    [0, 1, 1, 0],
  );

  return (
    <motion.figure
      className="absolute top-1/2"
      style={{
        left,
        width,
        height,
        marginTop: -height / 2,
        y,
        rotate,
        scale,
        opacity,
      }}
    >
      <div className="relative h-full w-full overflow-hidden bg-ink-soft">
        <MediaFrame media={media} />
      </div>
      <figcaption className="mt-3 flex items-baseline gap-2 font-mono text-[10px] uppercase tracking-wider text-stone">
        <span>{media.caption}</span>
        {media.coords && (
          <span className="text-stone/60">
            {media.coords.lat.toFixed(3)}°, {media.coords.lon.toFixed(3)}°
          </span>
        )}
      </figcaption>
    </motion.figure>
  );
}

function MediaFrame({ media }: { media: JourneyMedia }) {
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
            {journey.blurb && (
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-mist/85">
                {journey.blurb}
              </p>
            )}
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
