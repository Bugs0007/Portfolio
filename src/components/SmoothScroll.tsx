"use client";

import { ReactLenis } from "lenis/react";
import type { ReactNode } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

// Lenis is skipped entirely under prefers-reduced-motion. Native scroll takes
// over, not a "smoothed down" version of the same motion.
export function SmoothScroll({ children }: { children: ReactNode }) {
  const reduceMotion = usePrefersReducedMotion();

  if (reduceMotion) return <>{children}</>;

  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.2, smoothWheel: true }}>
      {children}
    </ReactLenis>
  );
}
