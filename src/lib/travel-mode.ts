// The five interchangeable Travel gallery modes. Order matters: dev keyboard
// shortcuts 1-5 map directly to this array's index.
export const TRAVEL_MODES = [
  "stream",
  "scatter",
  "chapters",
  "filmstrip",
  "directional",
] as const;

export type TravelMode = (typeof TRAVEL_MODES)[number];

export const DEFAULT_TRAVEL_MODE: TravelMode = "stream";

export const TRAVEL_MODE_LABELS: Record<TravelMode, string> = {
  stream: "Stream",
  scatter: "Scatter",
  chapters: "Chapters",
  filmstrip: "Filmstrip",
  directional: "Directional",
};

export function isTravelMode(value: string | null | undefined): value is TravelMode {
  return !!value && (TRAVEL_MODES as readonly string[]).includes(value);
}
