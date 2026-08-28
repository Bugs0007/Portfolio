// How much scroll one diagram gets, derived from how much diagram there is.
//
// Deliberately not an import of src/lib/travel-beats.ts. Travel's curve is
// tuned for skimmable photographs; a diagram node is read, not glanced at, and
// needs dwell time, so the two grow at different rates and sharing a function
// would only couple them.

import { lanesOf, type DiagramSpec } from "./diagram-spec";

const PER_BEAT_VH = 0.16;
const BASE_VH = 1.6;
const MIN_SPAN = 2.8;
// Longer than this stops being a section and starts being a scroll trap.
const MAX_SPAN = 6.5;
// Absolute rather than proportional. A fraction of the span would mean the
// lead-in silently doubles in real scroll distance as a diagram grows.
const LEAD_VH = 0.25;
// Proportional is right at the tail: with offset ["start start", "end end"],
// progress 1 lands exactly at the sticky release, so holding the last tenth
// keeps the finished diagram on screen at any span.
const DRAW_END = 0.9;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function diagramBeats(spec: DiagramSpec): number {
  const lanes = lanesOf(spec);
  const slots = lanes.reduce(
    (n, lane) => n + lane.rows.reduce((r, row) => r + row.items.length, 0),
    0,
  );
  return lanes.length + slots;
}

// Deliberately not a function of orientation. A diagram decides for itself,
// after measuring, whether it can lay out across the frame or has to run down
// it, so the chapter that sizes the scroll does not know which it will be. The
// draw and pan windows are proportional, so the same span works for either.
export function pinSpanFor(beats: number): number {
  return clamp(BASE_VH + beats * PER_BEAT_VH, MIN_SPAN, MAX_SPAN);
}

// The window of scroll progress the draw occupies, inside a pin of `span`
// viewport-heights. The container is `span` tall and one viewport of it is the
// sticky child, so `span - 1` viewport-heights of scroll map to 0 -> 1.
export function drawWindow(span: number): [number, number] {
  return [clamp(LEAD_VH / Math.max(0.5, span - 1), 0, 0.3), DRAW_END];
}
