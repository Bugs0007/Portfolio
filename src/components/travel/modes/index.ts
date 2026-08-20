import type { TravelMode } from "@/lib/travel-mode";
import type { TravelModeDef } from "./types";
import { streamMode } from "./StreamMode";
import { scatterMode } from "./ScatterMode";
import { chaptersMode } from "./ChaptersMode";
import { filmstripMode } from "./FilmstripMode";
import { directionalMode } from "./DirectionalMode";

export const TRAVEL_MODE_DEFS: Record<TravelMode, TravelModeDef> = {
  stream: streamMode,
  scatter: scatterMode,
  chapters: chaptersMode,
  filmstrip: filmstripMode,
  directional: directionalMode,
};

export type { TravelModeDef, TravelModeProps } from "./types";
