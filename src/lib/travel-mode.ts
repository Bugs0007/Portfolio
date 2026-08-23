// The interchangeable Travel gallery modes. Order is the registry order: the
// original five come first so the dev number keys 1-5 keep their original
// meaning, and [ / ] step through this whole array.
export const TRAVEL_MODES = [
  "stream",
  "scatter",
  "chapters",
  "filmstrip",
  "directional",
  "stack",
  "mask",
  "tunnel",
  "route",
  "mosaic",
  "focus",
  "columns",
  "radial",
  "cinema",
  "type",
] as const;

export type TravelMode = (typeof TRAVEL_MODES)[number];

export const DEFAULT_TRAVEL_MODE: TravelMode = "stream";

export const TRAVEL_MODE_LABELS: Record<TravelMode, string> = {
  stream: "Stream",
  scatter: "Scatter",
  chapters: "Chapters",
  filmstrip: "Filmstrip",
  directional: "Directional",
  stack: "Deck",
  mask: "Clip",
  tunnel: "Tunnel",
  route: "Route",
  mosaic: "Mosaic",
  focus: "Focus",
  columns: "Columns",
  radial: "Ring",
  cinema: "Cinema",
  type: "Type",
};

// Grouping for the dev switcher only: fifteen pills in one flat row doesn't
// fit, and the families are also how they're worth comparing (a rail mode
// against another rail mode, not against a full-bleed one).
export const TRAVEL_MODE_FAMILIES = [
  { label: "Rail", modes: ["stream", "filmstrip", "columns"] },
  { label: "Spatial", modes: ["scatter", "tunnel", "radial"] },
  { label: "Discrete", modes: ["chapters", "stack", "focus", "cinema"] },
  { label: "Reveal", modes: ["mask", "mosaic", "directional"] },
  { label: "Themed", modes: ["route", "type"] },
] as const satisfies readonly { label: string; modes: readonly TravelMode[] }[];

export function isTravelMode(value: string | null | undefined): value is TravelMode {
  return !!value && (TRAVEL_MODES as readonly string[]).includes(value);
}
