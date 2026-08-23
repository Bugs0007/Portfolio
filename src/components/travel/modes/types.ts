import type { ComponentType } from "react";
import type { MotionValue } from "motion/react";
import type { Journey } from "@/content/site";
import type { TravelMode } from "@/lib/travel-mode";

export type TravelModeProps = {
  journey: Journey;
  // 0 -> 1 across this journey's rail portion only (the intro title beat has
  // already been consumed upstream). Every mode derives all of its motion
  // from this single value, so every mode stays reversible on scroll-up.
  progress: MotionValue<number>;
  vw: number;
  vh: number;
  isNarrow: boolean;
  // The mode's own `getSizes(isNarrow)` result, resolved upstream and handed
  // down so a mode never has to reach back into its own spec. Passed straight
  // to next/image via MediaFrame.
  sizes: string;
};

// The eager half of a mode: everything TravelChapter needs *before* the mode's
// own chunk has loaded. getSpan sets the scroll container's height and getSizes
// sets the image request, both of which have to be known at first paint, so
// neither can live inside the lazily-imported component module.
export type TravelModeSpec = {
  id: TravelMode;
  label: string;
  // Rail span in viewport-heights, as a function of raw media count. Each
  // mode compresses this independently via its own beat count and cap.
  getSpan: (mediaCount: number, isNarrow: boolean) => number;
  // The widest this mode ever renders a single tile, as a CSS length. Modes
  // differ by more than 3x here (cinema is full bleed, route markers are
  // small), so one shared string made the small-tile modes over-fetch and
  // skewed every perf comparison run on this rig.
  getSizes: (isNarrow: boolean) => string;
};

export type TravelModeDef = TravelModeSpec & {
  Component: ComponentType<TravelModeProps>;
};
