"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

// The deliberate gear-change: color bleeds from ink (work) toward jacket and
// moss (the personal half) as this section crosses the viewport. Section 2
// of the brief calls for this to be a moment, not just another boundary.
export function Seam() {
  const ref = useRef<HTMLElement>(null);
  const reduceMotion = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const backgroundColor = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    ["#0d1219", "#2f6e80", "#77864a"],
  );

  return (
    <motion.section
      ref={ref}
      aria-label="Transition"
      style={reduceMotion ? undefined : { backgroundColor }}
      className={`relative flex min-h-[65vh] items-center justify-center px-6 text-center ${
        reduceMotion ? "bg-jacket" : ""
      }`}
    >
      <p className="max-w-3xl font-display text-3xl font-medium italic text-mist sm:text-5xl">
        Everything below this line, no one&rsquo;s paying me for.
      </p>
    </motion.section>
  );
}
