"use client";

import { useEffect } from "react";
import { motion, useTransform, type MotionValue } from "motion/react";
import type { Journey, JourneyMedia } from "@/content/site";
import { chunkMedia } from "@/lib/travel-beats";
import { routeBeats } from "./specs";
import { MediaTile, fitByHeight } from "./shared";
import type { TravelModeProps } from "./types";

// A trail drawn across the frame, with the photographs pinned along it. The
// line draws itself as scroll advances and each marker lights up as the line
// reaches it.
//
// The honest caveat, and the reason for the fallback below: only 5 of the 35
// media items carry GPS EXIF at all, and they are concentrated in one trip.
// Zanskar has 4 and gets a real projected route; Manali (2), Coimbatore (1)
// and Uttarakhand (0) fall below the three points a line needs and get a
// synthesised S-curve instead. Coordinates are never invented to fill the
// gap: a marker sitting on a real projected point is one that was really
// read off the photo, everywhere else the curve is openly decorative.

const MIN_REAL_POINTS = 3;

// Padding inside the 0-100 viewBox, so a route never runs into the frame edge.
const PAD = 14;

type Point = { x: number; y: number };

// Equirectangular, then each axis fitted to the frame independently.
//
// Preserving the true aspect was the first attempt and it does not work with
// this data: Zanskar's four points span 1.23 degrees of latitude against 0.37
// of longitude, so an aspect-true projection collapsed the whole route into a
// narrow vertical sliver down one side of the frame with every marker on top
// of its neighbour. Stretching each axis to the bounds keeps the sequence and
// the relative shape of the trail (which stop is north of which, where it
// doubles back) while making it legible. This is a diagram of a journey, not
// a map to navigate by, and the coordinates printed on the markers remain the
// real ones either way.
function projectCoords(coords: { lat: number; lon: number }[]): Point[] {
  const lons = coords.map((c) => c.lon);
  const lats = coords.map((c) => c.lat);
  const minLon = Math.min(...lons);
  const minLat = Math.min(...lats);
  // A journey that barely moves on one axis would otherwise divide by ~0.
  const spanLon = Math.max(Math.max(...lons) - minLon, 1e-6);
  const spanLat = Math.max(Math.max(...lats) - minLat, 1e-6);
  const inner = 100 - PAD * 2;

  return coords.map((c) => ({
    x: PAD + ((c.lon - minLon) / spanLon) * inner,
    // Latitude increases northward, the viewBox increases downward.
    y: PAD + (1 - (c.lat - minLat) / spanLat) * inner,
  }));
}

// The stand-in when a journey has too few real points: a gentle S across the
// frame. Deterministic, and visibly a drawn curve rather than a fake map.
function syntheticCurve(n: number): Point[] {
  const inner = 100 - PAD * 2;
  return Array.from({ length: Math.max(n, 2) }, (_, i) => {
    const t = i / Math.max(n - 1, 1);
    return {
      x: PAD + t * inner,
      y: PAD + inner * (0.5 + 0.34 * Math.sin(t * Math.PI * 1.6 - 0.4)),
    };
  });
}

// Catmull-Rom through the anchors, converted to cubic beziers, so the trail
// is a smooth line rather than a dogleg polyline at every stop.
function smoothPath(points: Point[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

function buildRoute(journey: Journey, beats: JourneyMedia[][]) {
  const withCoords = journey.media.filter((m) => m.coords);
  const usedFallback = withCoords.length < MIN_REAL_POINTS;

  const anchors = usedFallback
    ? syntheticCurve(Math.max(beats.length, 4))
    : projectCoords(withCoords.map((m) => m.coords!));

  // Markers sit at even intervals along the trail, except where a beat leads
  // with a photo that carries real GPS, which snaps to its own projected
  // point. So a real coordinate always means a real position on screen.
  const projectedBySrc = new Map<string, Point>();
  if (!usedFallback) {
    withCoords.forEach((m, i) => projectedBySrc.set(m.src, anchors[i]));
  }

  const markers = beats.map((items, i) => {
    const t = beats.length === 1 ? 0.5 : i / (beats.length - 1);
    const anchored = items.map((m) => projectedBySrc.get(m.src)).find(Boolean);
    const even = pointAlong(anchors, t);
    return { point: anchored ?? even, t };
  });

  return { anchors, markers: separate(markers), usedFallback };
}

// Two stops a few hundred metres apart project to almost the same pixel, and
// there are more beats than there are GPS points, so several markers can land
// on the same spot. Anything closer than MIN_SEPARATION to an already-placed
// marker gets pushed out along a fixed rotation of directions: deterministic,
// so the layout is identical on every load, and small enough that a marker
// never leaves the stop it belongs to.
const MIN_SEPARATION = 21;
const NUDGES = [
  { x: 1, y: -0.6 },
  { x: -1, y: 0.6 },
  { x: 0.4, y: 1 },
  { x: -0.5, y: -1 },
];

function separate<T extends { point: Point }>(markers: T[]): T[] {
  const placed: Point[] = [];
  return markers.map((m, i) => {
    let p = m.point;
    for (let attempt = 0; attempt < NUDGES.length; attempt++) {
      const clash = placed.some(
        (q) => Math.hypot(q.x - p.x, q.y - p.y) < MIN_SEPARATION,
      );
      if (!clash) break;
      const n = NUDGES[(i + attempt) % NUDGES.length];
      p = {
        x: clamp(p.x + n.x * MIN_SEPARATION, PAD * 0.5, 100 - PAD * 0.5),
        y: clamp(p.y + n.y * MIN_SEPARATION, PAD * 0.5, 100 - PAD * 0.5),
      };
    }
    placed.push(p);
    return { ...m, point: p };
  });
}

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}

// Linear walk along the anchor polyline. Close enough for marker placement:
// the smoothed curve never strays far from its own control points at this
// scale, and being exact would mean measuring the path in the DOM.
function pointAlong(points: Point[], t: number): Point {
  if (points.length === 0) return { x: 50, y: 50 };
  if (points.length === 1) return points[0];
  const scaled = t * (points.length - 1);
  const i = Math.min(Math.floor(scaled), points.length - 2);
  const f = scaled - i;
  return {
    x: points[i].x + (points[i + 1].x - points[i].x) * f,
    y: points[i].y + (points[i + 1].y - points[i].y) * f,
  };
}

export default function RouteMode({ journey, progress, vw, vh, isNarrow, sizes }: TravelModeProps) {
  const count = routeBeats(journey.media.length);
  const beats = chunkMedia(journey.media, count);
  const { anchors, markers, usedFallback } = buildRoute(journey, beats);
  // 1 leaves the whole trail hidden, 0 draws all of it.
  const strokeDashoffset = useTransform(progress, [0, 1], [1, 0]);

  useEffect(() => {
    if (process.env.NODE_ENV === "production" || !usedFallback) return;
    const real = journey.media.filter((m) => m.coords).length;
    console.info(
      `[travel:route] "${journey.title}" has ${real} GPS point(s), needs ${MIN_REAL_POINTS}. Drew a synthesised curve instead.`,
    );
  }, [journey.title, journey.media, usedFallback]);

  if (beats.length === 0) return null;

  const d = smoothPath(anchors);

  return (
    <div className="absolute inset-0">
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        // The markers are positioned in percentages of the same box, so the
        // line and the photographs have to stretch together, not letterbox
        // independently of each other.
        preserveAspectRatio="none"
        aria-hidden
      >
        {/* The untravelled route, faint, so the frame doesn't read as empty
            before the drawn line has reached across it. */}
        <path
          d={d}
          fill="none"
          stroke="currentColor"
          className="text-stone/20"
          strokeWidth={1}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        <motion.path
          d={d}
          fill="none"
          stroke="currentColor"
          className="text-jacket-bright"
          strokeWidth={1.6}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          // pathLength=1 renormalises the path's own length to 1 user unit, so
          // a dash of "1 1" is exactly one path-length on, one off, and the
          // offset below is a straight 1 -> 0 read of scroll. Handing Motion a
          // pathLength motion value instead left the dash pattern in user
          // units and drew the trail as a row of repeating ticks.
          pathLength={1}
          strokeDasharray="1 1"
          style={{ strokeDashoffset }}
        />
      </svg>

      {markers.map((marker, i) => (
        <RouteMarker
          key={i}
          items={beats[i]}
          progress={progress}
          point={marker.point}
          at={marker.t}
          vw={vw}
          vh={vh}
          isNarrow={isNarrow}
          sizes={sizes}
        />
      ))}

      {usedFallback && (
        <p className="absolute bottom-4 left-6 font-mono text-[10px] uppercase tracking-wider text-stone/40 sm:left-10 lg:left-16">
          Route drawn, no GPS on file
        </p>
      )}
    </div>
  );
}

function RouteMarker({
  items,
  progress,
  point,
  at,
  vw,
  vh,
  isNarrow,
  sizes,
}: {
  items: JourneyMedia[];
  progress: MotionValue<number>;
  point: Point;
  at: number;
  vw: number;
  vh: number;
  isNarrow: boolean;
  sizes: string;
}) {
  // One photo per stop: a marker is a pin on a line, and stacking two at the
  // same coordinate would misrepresent where they were taken.
  const media = items[0];
  const size = fitByHeight(media, vh * (isNarrow ? 0.16 : 0.19), vw, isNarrow ? 0.32 : 0.15);

  // Lands just before the drawn line arrives, so the line appears to pull the
  // photograph into place rather than trailing after it.
  const lead = 0.06;
  const opacity = useTransform(progress, [at - lead - 0.06, at - lead, 1], [0, 1, 1]);
  const scale = useTransform(progress, [at - lead - 0.06, at - lead], [0.72, 1]);

  return (
    <MediaTile
      media={media}
      sizes={sizes}
      captionOpacity={opacity}
      style={{
        left: `${point.x}%`,
        top: `${point.y}%`,
        width: size.width,
        height: size.height,
        x: -size.width / 2,
        y: -size.height / 2,
        scale,
        opacity,
      }}
    />
  );
}
