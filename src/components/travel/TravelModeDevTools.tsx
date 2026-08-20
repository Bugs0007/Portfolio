"use client";

import { useEffect } from "react";
import { setTravelMode, useTravelMode } from "@/hooks/useTravelMode";
import { TRAVEL_MODE_LABELS, TRAVEL_MODES } from "@/lib/travel-mode";

const isDev = process.env.NODE_ENV !== "production";

// Dev-only comparison aid: a persistent, always-visible switcher so the five
// modes can be flipped through without knowing the query param or the number
// keys exist. Number keys 1-5 still work as a shortcut (order matches
// TRAVEL_MODES). Gated on NODE_ENV so none of this ships to production.
export function TravelModeDevTools() {
  const mode = useTravelMode();

  useEffect(() => {
    if (!isDev) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      const digit = Number(event.key);
      if (Number.isInteger(digit) && digit >= 1 && digit <= TRAVEL_MODES.length) {
        setTravelMode(TRAVEL_MODES[digit - 1]);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  if (!isDev) return null;

  return (
    <div
      className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-full border border-mist/15 bg-ink/90 p-1 shadow-lg backdrop-blur-sm"
      role="group"
      aria-label="Travel gallery mode switcher (dev only)"
    >
      {TRAVEL_MODES.map((m, i) => {
        const active = m === mode;
        return (
          <button
            key={m}
            type="button"
            onClick={() => setTravelMode(m)}
            className={`rounded-full px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-colors ${
              active
                ? "bg-jacket-bright text-ink"
                : "text-stone hover:text-mist"
            }`}
          >
            {String(i + 1).padStart(2, "0")} {TRAVEL_MODE_LABELS[m]}
          </button>
        );
      })}
    </div>
  );
}
