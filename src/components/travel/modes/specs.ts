import { beatCountFor, railSpanForBeats } from "@/lib/travel-beats";
import type { TravelModeSpec } from "./types";

// Every mode's eager half, in one module that imports no component code.
// TravelChapter needs getSpan to size the scroll container and getSizes to
// issue the image request, both before the selected mode's chunk has even
// been fetched, so pulling these out of the component files is what lets the
// components be lazy at all.
//
// Each mode's beat-count function is exported alongside its spec, because the
// component has to chunk the media exactly the way its own span was computed
// from. Keeping both here means the two can never drift apart.

// --- beat counts -----------------------------------------------------------

export const streamBeats = (n: number) =>
  beatCountFor(n, { base: 5, growth: 1.3, min: Math.min(5, n) || 1, max: 10 });

export const scatterBeats = (n: number) =>
  beatCountFor(n, { base: 5, growth: 1.2, min: Math.min(4, n) || 1, max: 8 });

export const chaptersBeats = (n: number) =>
  beatCountFor(n, { base: 3, growth: 1.4, min: Math.min(3, n) || 1, max: 5 });

export const filmstripBeats = (n: number) =>
  beatCountFor(n, { base: 6, growth: 1.3, min: Math.min(6, n) || 1, max: 12 });

export const directionalBeats = (n: number) =>
  beatCountFor(n, { base: 5, growth: 1.3, min: Math.min(5, n) || 1, max: 10 });

// A deck reads best with a card count you could actually imagine holding, so
// this caps lower than the rail modes.
export const stackBeats = (n: number) =>
  beatCountFor(n, { base: 5, growth: 1.2, min: Math.min(4, n) || 1, max: 9 });

// Clip and Focus both show one frame at a time and sub-divide a beat between
// its items, so they want many small beats rather than few large ones.
export const maskBeats = (n: number) =>
  beatCountFor(n, { base: 8, growth: 1.3, min: Math.min(6, n) || 1, max: 12 });

export const focusBeats = (n: number) =>
  beatCountFor(n, { base: 6, growth: 1.3, min: Math.min(5, n) || 1, max: 11 });

// Tunnel pays for every extra beat twice (a Z plane each, and a longer span),
// so it stays deliberately short.
export const tunnelBeats = (n: number) =>
  beatCountFor(n, { base: 4, growth: 1.1, min: Math.min(4, n) || 1, max: 7 });

// Capped low: a route reads as a handful of named stops, and eight markers on
// one line in a single viewport overlap each other however they're nudged.
export const routeBeats = (n: number) =>
  beatCountFor(n, { base: 4, growth: 1.1, min: Math.min(4, n) || 1, max: 6 });

export const mosaicBeats = (n: number) =>
  beatCountFor(n, { base: 5, growth: 1.3, min: Math.min(4, n) || 1, max: 9 });

export const columnsBeats = (n: number) =>
  beatCountFor(n, { base: 6, growth: 1.3, min: Math.min(6, n) || 1, max: 12 });

export const radialBeats = (n: number) =>
  beatCountFor(n, { base: 8, growth: 1.1, min: Math.min(5, n) || 1, max: 10 });

export const cinemaBeats = (n: number) =>
  beatCountFor(n, { base: 6, growth: 1.4, min: Math.min(5, n) || 1, max: 10 });

export const typeBeats = (n: number) =>
  beatCountFor(n, { base: 5, growth: 1.2, min: Math.min(4, n) || 1, max: 8 });

// --- specs -----------------------------------------------------------------

// Mosaic assembles a composition and then holds it still; the hold is a
// fraction of the mode's own span rather than extra scroll on top, so the
// section length stays predictable.
export const MOSAIC_HOLD = 0.15;

export const streamSpec: TravelModeSpec = {
  id: "stream",
  label: "Stream",
  getSpan: (n) => railSpanForBeats(streamBeats(n), 0.6),
  getSizes: (isNarrow) => (isNarrow ? "85vw" : "55vw"),
};

export const scatterSpec: TravelModeSpec = {
  id: "scatter",
  label: "Scatter",
  getSpan: (n) => railSpanForBeats(scatterBeats(n), 0.65),
  getSizes: (isNarrow) => (isNarrow ? "62vw" : "40vw"),
};

export const chaptersSpec: TravelModeSpec = {
  id: "chapters",
  label: "Chapters",
  getSpan: (n) => railSpanForBeats(chaptersBeats(n), 0.95),
  getSizes: (isNarrow) => (isNarrow ? "86vw" : "50vw"),
};

export const filmstripSpec: TravelModeSpec = {
  id: "filmstrip",
  label: "Filmstrip",
  getSpan: (n) => railSpanForBeats(filmstripBeats(n), 0.5),
  getSizes: (isNarrow) => (isNarrow ? "50vw" : "30vw"),
};

export const directionalSpec: TravelModeSpec = {
  id: "directional",
  label: "Directional",
  getSpan: (n) => railSpanForBeats(directionalBeats(n), 0.6),
  getSizes: (isNarrow) => (isNarrow ? "70vw" : "42vw"),
};

export const stackSpec: TravelModeSpec = {
  id: "stack",
  label: "Deck",
  getSpan: (n) => railSpanForBeats(stackBeats(n), 0.45),
  getSizes: (isNarrow) => (isNarrow ? "80vw" : "50vw"),
};

export const maskSpec: TravelModeSpec = {
  id: "mask",
  label: "Clip",
  getSpan: (n) => railSpanForBeats(maskBeats(n), 0.5),
  getSizes: (isNarrow) => (isNarrow ? "90vw" : "62vw"),
};

export const tunnelSpec: TravelModeSpec = {
  id: "tunnel",
  label: "Tunnel",
  getSpan: (n) => railSpanForBeats(tunnelBeats(n), 0.9),
  // Perspective scale means a tile near the camera plane genuinely fills the
  // viewport, so this has to request the large source even though the tile
  // spends most of its life small.
  getSizes: (isNarrow) => (isNarrow ? "95vw" : "75vw"),
};

export const routeSpec: TravelModeSpec = {
  id: "route",
  label: "Route",
  getSpan: (n) => railSpanForBeats(routeBeats(n), 0.7),
  getSizes: (isNarrow) => (isNarrow ? "40vw" : "24vw"),
};

export const mosaicSpec: TravelModeSpec = {
  id: "mosaic",
  label: "Mosaic",
  getSpan: (n) => railSpanForBeats(mosaicBeats(n), 0.4) / (1 - MOSAIC_HOLD),
  getSizes: (isNarrow) => (isNarrow ? "52vw" : "34vw"),
};

export const focusSpec: TravelModeSpec = {
  id: "focus",
  label: "Focus",
  getSpan: (n) => railSpanForBeats(focusBeats(n), 0.6),
  getSizes: (isNarrow) => (isNarrow ? "88vw" : "58vw"),
};

export const columnsSpec: TravelModeSpec = {
  id: "columns",
  label: "Columns",
  getSpan: (n) => railSpanForBeats(columnsBeats(n), 0.55),
  getSizes: (isNarrow) => (isNarrow ? "48vw" : "31vw"),
};

export const radialSpec: TravelModeSpec = {
  id: "radial",
  label: "Ring",
  getSpan: (n) => railSpanForBeats(radialBeats(n), 0.6),
  getSizes: (isNarrow) => (isNarrow ? "42vw" : "26vw"),
};

export const cinemaSpec: TravelModeSpec = {
  id: "cinema",
  label: "Cinema",
  getSpan: (n) => railSpanForBeats(cinemaBeats(n), 0.8),
  getSizes: () => "100vw",
};

export const typeSpec: TravelModeSpec = {
  id: "type",
  label: "Type",
  getSpan: (n) => railSpanForBeats(typeBeats(n), 0.5),
  getSizes: (isNarrow) => (isNarrow ? "72vw" : "46vw"),
};
