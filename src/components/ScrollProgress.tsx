"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

// The replacement for the native scrollbar hidden in globals.css. Purely
// decorative: native scrolling is untouched, so real position information is
// still there for assistive tech and for every input method. Hence aria-hidden,
// and hence no attempt to make this draggable, it is an indicator and not a
// control.

// Thumb height as a percentage of the track. Fixed rather than derived from
// document height: this page runs to tens of viewport-heights, which would
// leave a proportional thumb a couple of pixels tall.
const THUMB_PCT = 16;

// How long the rail stays up after the last scroll movement.
const IDLE_MS = 1200;

// Lenis eases asymptotically, so it keeps emitting sub-pixel scroll changes
// for several seconds after the wheel has stopped. Treating every one of those
// as activity meant the idle timer was reset forever and the rail never faded
// out after a long scroll. Anything smaller than this is settling, not moving.
const MOVE_EPSILON_PX = 0.5;

export function ScrollProgress() {
  const { scrollY, scrollYProgress } = useScroll();
  const reduceMotion = usePrefersReducedMotion();
  const [active, setActive] = useState(false);
  const lastRef = useRef(0);

  // Travel expressed in multiples of the thumb's own height, so position is
  // one transform on one element: no top, no height, nothing touching layout.
  // A 16%-tall thumb has 84% of track to cross, which is 84/16 of itself.
  const y = useTransform(
    scrollYProgress,
    [0, 1],
    ["0%", `${((100 - THUMB_PCT) / THUMB_PCT) * 100}%`],
  );

  useEffect(() => {
    if (reduceMotion) return;
    let timer: ReturnType<typeof setTimeout>;
    // A timeout is the right tool here specifically because idleness is a
    // property of time, not of scroll position: no scroll value means
    // "stopped 1.2s ago". Everything that is a function of position stays a
    // motion value.
    lastRef.current = scrollY.get();
    const unsubscribe = scrollY.on("change", (v) => {
      if (Math.abs(v - lastRef.current) < MOVE_EPSILON_PX) return;
      lastRef.current = v;
      setActive(true);
      clearTimeout(timer);
      timer = setTimeout(() => setActive(false), IDLE_MS);
    });
    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, [scrollY, reduceMotion]);

  // Nothing at all under reduced motion: a rail that fades itself in and out
  // is exactly the kind of incidental movement that setting asks to be spared.
  if (reduceMotion) return null;

  return (
    <motion.div
      aria-hidden="true"
      initial={false}
      animate={{ opacity: active ? 1 : 0 }}
      transition={{ duration: 0.45 }}
      // Hidden below 640px, where mobile browsers already draw and auto-hide
      // an indicator of their own. Non-interactive so it can never sit in
      // front of something clickable.
      className="pointer-events-none fixed bottom-4 right-2 top-4 z-50 hidden w-0.5 overflow-hidden rounded-full bg-ink-soft sm:block"
    >
      <motion.div
        style={{ y, height: `${THUMB_PCT}%` }}
        className="w-full rounded-full bg-stone"
      />
    </motion.div>
  );
}
