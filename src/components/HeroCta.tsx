"use client";

import { useSide } from "./side/SideContext";

// The hero's call to action points into whichever side is showing.
export function HeroCta() {
  const { side } = useSide();
  const life = side === "life";
  return (
    <a className="hero-work-link" href={life ? "#music" : "#work"}>
      <span>{life ? "Explore off the clock" : "Explore my work"}</span>
      <span className="hero-link-arrow" aria-hidden>↓</span>
    </a>
  );
}
