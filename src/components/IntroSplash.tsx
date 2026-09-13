"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { EASE } from "@/lib/motion";

// Fraunces has no Devanagari or Telugu glyphs, so each greeting carries its
// own serif companion (see layout.tsx) instead of falling back to the
// browser's default system font for two of the three words.
const GREETINGS = [
  { text: "Hello", fontFamily: undefined },
  { text: "नमस्ते", fontFamily: "var(--font-tiro-devanagari)" },
  { text: "నమస్తే", fontFamily: "var(--font-tiro-telugu)" },
] as const;

// Kept short on purpose: this splash sits at z-[100] over the whole viewport,
// so every millisecond here is a millisecond the real LCP text underneath
// can't count as painted. Measured with Lighthouse (both simulated and real
// throttling): at the old 750ms/word timing, "Render Delay" was ~100% of a
// 3.5-5.4s LCP with zero network/load delay, i.e. this splash alone was
// blowing the brief's 2.5s LCP budget. This timing keeps the three-greeting
// beat recognizable while getting out of the way fast.
const WORD_MS = 450;
const EXIT_S = 0.4;

// How long the splash covers the page, every word's hold plus its fade out.
const SPLASH_SECONDS = (WORD_MS * GREETINGS.length) / 1000 + EXIT_S;

// The splash lives in the root layout, so it plays once per full page load,
// while page content remounts on every client-side navigation back to "/"
// (the résumé and 404 pages both link there). An entrance that always waited
// out the splash would sit blank for nearly two seconds on those remounts with
// nothing covering it.
const splash = { finished: false };

/**
 * Seconds an entrance on load should wait so it doesn't play behind the
 * splash. Zero once the splash has already gone.
 */
export function introSplashDelay() {
  return splash.finished ? 0 : SPLASH_SECONDS;
}

// Plays once on every load, Apple-style: one greeting at a time, then out.
// Skipped entirely under reduced motion rather than shown as a static
// equivalent, since a splash with nothing to show statically has no
// reduced-motion version worth keeping.
export function IntroSplash() {
  const reduceMotion = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (reduceMotion || !visible) return;
    if (index < GREETINGS.length - 1) {
      const t = setTimeout(() => setIndex((i) => i + 1), WORD_MS);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      splash.finished = true;
      setVisible(false);
    }, WORD_MS);
    return () => clearTimeout(t);
  }, [index, reduceMotion, visible]);

  if (reduceMotion) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          aria-hidden
          exit={{ opacity: 0 }}
          transition={{ duration: EXIT_S, ease: EASE }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-ink"
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={index}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.28, ease: EASE }}
              style={{ fontFamily: GREETINGS[index].fontFamily }}
              className="font-display text-5xl font-medium text-mist sm:text-6xl"
            >
              {GREETINGS[index].text}
            </motion.span>
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
