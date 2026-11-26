"use client";

import { sides, type Side } from "@/content/site";
import { useSide } from "./SideContext";

// The nav's way across: two halves of one pill, the current side filled.
export function SideSwitch() {
  const { side, switchTo } = useSide();
  if (!side) return null;
  return (
    <div className="side-switch" role="group" aria-label="Choose a side of the site">
      {(Object.keys(sides) as Side[]).map((key) => (
        <button
          key={key}
          type="button"
          aria-pressed={side === key}
          onClick={() => switchTo(key)}
          className={side === key ? "is-on" : undefined}
        >
          <span className="side-switch-label">{sides[key].label}</span>
        </button>
      ))}
    </div>
  );
}
