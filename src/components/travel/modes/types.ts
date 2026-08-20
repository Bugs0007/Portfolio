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
};

export type TravelModeDef = {
  id: TravelMode;
  label: string;
  // Rail span in viewport-heights, as a function of raw media count. Each
  // mode compresses this independently via its own beat count and cap.
  getSpan: (mediaCount: number, isNarrow: boolean) => number;
  Component: ComponentType<TravelModeProps>;
};
