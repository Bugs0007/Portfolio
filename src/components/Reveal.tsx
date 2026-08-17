"use client";

import { motion, useReducedMotion, type Transition } from "motion/react";
import type { ReactNode } from "react";

const EASE_SITE: Transition["ease"] = [0.16, 1, 0.3, 1];

// One entry animation, used everywhere: fade + small upward translation.
// If a reader would notice this as animation, it's doing too much.
export function Reveal({
  children,
  delay = 0,
  className,
  y = 16,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  y?: number;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px -10% 0px" }}
      transition={{ duration: reduceMotion ? 0 : 0.7, ease: EASE_SITE, delay }}
    >
      {children}
    </motion.div>
  );
}
