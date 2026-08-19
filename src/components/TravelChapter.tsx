"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import type { Journey, JourneyMedia } from "@/content/site";
import { EASE } from "@/lib/motion";
import { MediaFrame } from "./TravelMap";

// The pinned-chapter treatment: each journey gets its own pin, opening with an
// oversized title beat, then converting further scroll into a horizontal,
// scroll-scrubbed rail through that trip's media. Unlike the sine-curve
// ribbon, nothing here plays on a timer, every motion value is a direct read
// of scroll position, reversible in both directions.

const ENTRANCE_VARIANTS = ["rise", "slide-cross", "settle-rotate", "drift-deep"] as const;
type EntranceVariant = (typeof ENTRANCE_VARIANTS)[number];

export function TravelChapter({
  journey,
  index,
  total,
}: {
  journey: Journey;
  index: number;
  total: number;
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

  // One full viewport height for the title beat, then room for the rail
  // scaled to how much media this trip has.
  const introSpan = 1;
  const railSpan = Math.max(1.6, journey.media.length * 0.75);
  const totalSpan = introSpan + railSpan;
  const introFraction = introSpan / totalSpan;

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const railProgress = useTransform(scrollYProgress, [introFraction, 1], [0, 1]);

  return (
    <section aria-label={`${journey.title} chapter`} className="relative bg-ink">
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
              <Reel
                journey={journey}
                progress={railProgress}
                vw={size.vw}
                vh={size.vh}
              />
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
  const revealOpacity = useTransform(scrollYProgress, [0, introFraction * 0.18], [0, 1]);
  const revealY = useTransform(scrollYProgress, [0, introFraction * 0.18], [40, 0]);
  const dividerScale = useTransform(scrollYProgress, [0, introFraction], [0.94, 1.04]);
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
  // breakpoints, scaled down for longer titles ("Manali in the snow" vs
  // "Zanskar") so every chapter's title stays on one line at any width.
  const titleScale = Math.min(1, 11 / journey.title.length);
  const titleFontSize = `clamp(${(2.6 * titleScale).toFixed(2)}rem, ${(15 * titleScale).toFixed(2)}vw, ${(10.5 * titleScale).toFixed(2)}rem)`;

  return (
    <>
      <motion.div
        style={{ opacity: dividerOpacity }}
        className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-center px-6 sm:px-10 lg:px-16"
      >
        <p className="font-mono text-xs uppercase tracking-wider text-stone">
          {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
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
          <p className="font-mono text-[11px] text-stone/70">{journey.region}</p>
        </div>
        <p className="font-mono text-xs uppercase tracking-wider text-stone/70">
          {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </p>
      </motion.div>
    </>
  );
}

function Reel({
  journey,
  progress,
  vw,
  vh,
}: {
  journey: Journey;
  progress: MotionValue<number>;
  vw: number;
  vh: number;
}) {
  const isNarrow = vw < 640;
  const height = vh * (isNarrow ? 0.42 : 0.5);
  const gap = isNarrow ? 18 : 34;

  const widths = journey.media.map((m) =>
    Math.min((height * m.width) / m.height, vw * (isNarrow ? 0.85 : 0.55)),
  );
  const offsets: number[] = [];
  let acc = 0;
  for (const w of widths) {
    offsets.push(acc);
    acc += w + gap;
  }
  const ribbonWidth = acc;

  // Stops short of -ribbonWidth on purpose: the sticky pin releases with
  // exactly one viewport-height of scroll still left in the container (that's
  // inherent to how a sticky child inside a tall container unpins), and if
  // the last photo has already faded to nothing by then, that whole trailing
  // screen is dead air. Landing the ribbon here instead means the last photo
  // is still on screen at release and rides away with the natural unpin
  // scroll, rather than the chapter ending on a blank hold.
  const x = useTransform(progress, [0, 1], [vw, -ribbonWidth + vw * 0.6]);

  return (
    <motion.div className="absolute inset-y-0 left-0" style={{ x, width: ribbonWidth }}>
      {journey.media.map((media, i) => (
        <ReelItem
          key={media.src}
          media={media}
          ribbonX={x}
          left={offsets[i]}
          width={widths[i]}
          height={height}
          vw={vw}
          vh={vh}
          variant={ENTRANCE_VARIANTS[i % ENTRANCE_VARIANTS.length]}
        />
      ))}
    </motion.div>
  );
}

function ReelItem({
  media,
  ribbonX,
  left,
  width,
  height,
  vw,
  vh,
  variant,
}: {
  media: JourneyMedia;
  ribbonX: MotionValue<number>;
  left: number;
  width: number;
  height: number;
  vw: number;
  vh: number;
  variant: EntranceVariant;
}) {
  // Where this item's centre currently sits on screen, in px from the left
  // edge. Every motion below reads only from this one value, so each item
  // stays a pure function of scroll regardless of which entrance it plays.
  const centre = useTransform(ribbonX, (v) => v + left + width / 2);
  const wave = (c: number) => (c / vw) * Math.PI * 1.35;

  // Items travel right-to-left, so "just entered" is c/vw near 1 and "settled"
  // is near/after centre. This reads that crossing as 0 (just entered) to 1
  // (settled by centre), rather than measuring from the left edge.
  const settleFrom = (c: number, threshold: number) =>
    Math.min(Math.max((1 - c / vw) / threshold, 0), 1);

  const y = useTransform(centre, (c) => {
    const base = Math.sin(wave(c)) * vh * (variant === "drift-deep" ? 0.05 : 0.08);
    if (variant !== "slide-cross") return base;
    return base + (1 - settleFrom(c, 0.5)) * 64;
  });

  const rotate = useTransform(centre, (c) => {
    if (variant !== "settle-rotate") return Math.cos(wave(c)) * 4.5;
    return 16 * (1 - settleFrom(c, 0.45));
  });

  const extraX = useTransform(centre, (c) => {
    if (variant !== "drift-deep") return 0;
    return (0.5 - c / vw) * 90;
  });

  const scale = useTransform(centre, (c) => {
    const t = Math.min(Math.max(c / vw, 0), 1);
    const [from, mid, to] = variant === "settle-rotate" ? [0.88, 1, 0.88] : [0.92, 1, 0.92];
    return t <= 0.5 ? from + (mid - from) * (t / 0.5) : mid + (to - mid) * ((t - 0.5) / 0.5);
  });

  const opacity = useTransform(
    centre,
    [-width * 0.6, width * 0.4, vw - width * 0.4, vw + width * 0.6],
    [0, 1, 1, 0],
  );

  // How centred this item currently is, independent of its own fade-in/out,
  // used only to brighten its caption as it nears the middle of the screen.
  const focus = useTransform(centre, [vw * 0.22, vw * 0.5, vw * 0.78], [0, 1, 0]);
  const captionOpacity = useTransform(focus, [0, 1], [0.4, 1]);
  const captionY = useTransform(focus, [0, 1], [4, 0]);

  return (
    <motion.figure
      className="group absolute top-1/2"
      style={{
        left,
        width,
        height,
        marginTop: -height / 2,
        x: extraX,
        y,
        rotate,
        scale,
        opacity,
      }}
    >
      <motion.div
        className="relative h-full w-full overflow-hidden bg-ink-soft"
        whileHover={{ scale: 1.035 }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        <MediaFrame media={media} />
      </motion.div>
      <motion.figcaption
        style={{ opacity: captionOpacity, y: captionY }}
        className="mt-3 flex items-baseline gap-2 font-mono text-[10px] uppercase tracking-wider text-stone"
      >
        <span>{media.caption}</span>
        {media.coords && (
          <span className="text-stone/60">
            {media.coords.lat.toFixed(3)}°, {media.coords.lon.toFixed(3)}°
          </span>
        )}
      </motion.figcaption>
    </motion.figure>
  );
}
