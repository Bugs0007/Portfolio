import { lazy } from "react";
import type { TravelMode } from "@/lib/travel-mode";
import type { TravelModeDef } from "./types";
import {
  chaptersSpec,
  cinemaSpec,
  columnsSpec,
  directionalSpec,
  filmstripSpec,
  focusSpec,
  maskSpec,
  mosaicSpec,
  radialSpec,
  routeSpec,
  scatterSpec,
  stackSpec,
  streamSpec,
  tunnelSpec,
  typeSpec,
} from "./specs";

// Each mode's component is its own chunk, fetched only once that mode is
// actually selected. Fifteen gallery treatments is far more code than any one
// visitor will ever see, and eagerly importing them all also meant the modes
// that exist purely for this comparison rig were riding along in the
// production bundle.
//
// Only the Component is lazy. The specs are imported eagerly and on purpose:
// TravelChapter needs getSpan to give the scroll container its height and
// getSizes to issue the image request, both before the chunk has arrived.
// That is the whole reason the two halves live in separate modules.
export const TRAVEL_MODE_DEFS: Record<TravelMode, TravelModeDef> = {
  stream: { ...streamSpec, Component: lazy(() => import("./StreamMode")) },
  scatter: { ...scatterSpec, Component: lazy(() => import("./ScatterMode")) },
  chapters: { ...chaptersSpec, Component: lazy(() => import("./ChaptersMode")) },
  filmstrip: { ...filmstripSpec, Component: lazy(() => import("./FilmstripMode")) },
  directional: { ...directionalSpec, Component: lazy(() => import("./DirectionalMode")) },
  stack: { ...stackSpec, Component: lazy(() => import("./StackMode")) },
  mask: { ...maskSpec, Component: lazy(() => import("./MaskMode")) },
  tunnel: { ...tunnelSpec, Component: lazy(() => import("./TunnelMode")) },
  route: { ...routeSpec, Component: lazy(() => import("./RouteMode")) },
  mosaic: { ...mosaicSpec, Component: lazy(() => import("./MosaicMode")) },
  focus: { ...focusSpec, Component: lazy(() => import("./FocusMode")) },
  columns: { ...columnsSpec, Component: lazy(() => import("./ColumnsMode")) },
  radial: { ...radialSpec, Component: lazy(() => import("./RadialMode")) },
  cinema: { ...cinemaSpec, Component: lazy(() => import("./CinemaMode")) },
  type: { ...typeSpec, Component: lazy(() => import("./TypeMode")) },
};

export type { TravelModeDef, TravelModeProps, TravelModeSpec } from "./types";
