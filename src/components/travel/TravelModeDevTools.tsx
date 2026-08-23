"use client";

import { useEffect } from "react";
import { setTravelMode, useTravelMode } from "@/hooks/useTravelMode";
import {
  TRAVEL_MODES,
  TRAVEL_MODE_FAMILIES,
  TRAVEL_MODE_LABELS,
} from "@/lib/travel-mode";

const isDev = process.env.NODE_ENV !== "production";

// Dev-only comparison aid. Fifteen modes no longer fit in a flat row, so the
// pills are grouped by family (see TRAVEL_MODE_FAMILIES): comparing a rail
// treatment against another rail treatment is the useful comparison, against
// a full-bleed one it mostly isn't.
//
// Keys: [ and ] step through every mode in registry order. 1-5 still jump to
// the original five, unchanged, because that muscle memory is worth more than
// the consistency of extending the digits to 6-9 for modes that have no
// established position. Gated on NODE_ENV so none of this ships.
export function TravelModeDevTools() {
  const mode = useTravelMode();

  useEffect(() => {
    if (!isDev) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;

      if (event.key === "[" || event.key === "]") {
        event.preventDefault();
        const step = event.key === "]" ? 1 : -1;
        const at = TRAVEL_MODES.indexOf(mode);
        const next = (at + step + TRAVEL_MODES.length) % TRAVEL_MODES.length;
        setTravelMode(TRAVEL_MODES[next]);
        return;
      }

      const digit = Number(event.key);
      if (Number.isInteger(digit) && digit >= 1 && digit <= 5) {
        setTravelMode(TRAVEL_MODES[digit - 1]);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mode]);

  if (!isDev) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4"
      role="group"
      aria-label="Travel gallery mode switcher (dev only)"
    >
      <div className="pointer-events-auto flex max-w-full flex-wrap items-center justify-center gap-x-3 gap-y-1.5 rounded-2xl border border-mist/15 bg-ink/90 px-3 py-2 shadow-lg backdrop-blur-sm">
        {TRAVEL_MODE_FAMILIES.map((family) => (
          <div key={family.label} className="flex items-center gap-1">
            <span className="font-mono text-[9px] uppercase tracking-wider text-stone/50">
              {family.label}
            </span>
            {family.modes.map((m) => {
              const active = m === mode;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setTravelMode(m)}
                  className={`rounded-full px-2 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors ${
                    active ? "bg-jacket-bright text-ink" : "text-stone hover:text-mist"
                  }`}
                >
                  {TRAVEL_MODE_LABELS[m]}
                </button>
              );
            })}
          </div>
        ))}

        {/* The live mode id, so a screenshot of this rig says which mode it
            is without anyone having to remember what was selected. */}
        <span className="ml-1 rounded-full bg-mist/10 px-2 py-1 font-mono text-[10px] tracking-wider text-mist/80">
          ?travelMode={mode}
        </span>
        <span className="font-mono text-[9px] uppercase tracking-wider text-stone/40">
          [ ] step
        </span>
      </div>
    </div>
  );
}
