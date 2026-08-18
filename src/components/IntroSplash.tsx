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

const WORD_MS = 750;

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
    const t = setTimeout(() => setVisible(false), WORD_MS);
    return () => clearTimeout(t);
  }, [index, reduceMotion, visible]);

  if (reduceMotion) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          aria-hidden
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-ink"
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={index}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.35, ease: EASE }}
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
