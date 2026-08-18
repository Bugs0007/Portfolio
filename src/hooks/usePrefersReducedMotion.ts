"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

/**
 * Hydration-safe reduced-motion check.
 *
 * Motion's own useReducedMotion reads matchMedia synchronously during render,
 * so it returns null on the server and the real value during hydration. Any
 * component that picks a branch from it renders two different trees and React
 * throws a hydration mismatch. useSyncExternalStore is the supported way round
 * this: React hydrates with the server snapshot, then re-renders once with the
 * real client value.
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}
