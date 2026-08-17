"use client";

import { ReactLenis } from "lenis/react";
import { useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

// Lenis is skipped entirely under prefers-reduced-motion. Native scroll takes
// over, not a "smoothed down" version of the same motion. useReducedMotion is
// null until measured, and that null behaves like "reduce", so the server and
// the first client render both go without Lenis and hydration matches.
export function SmoothScroll({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion !== false) return <>{children}</>;

  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.2, smoothWheel: true }}>
      {children}
    </ReactLenis>
  );
}
