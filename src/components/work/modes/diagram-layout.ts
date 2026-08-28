// Pure geometry for an architecture diagram: measured box sizes in, positions
// and paths out. No React, no DOM, no side effects, so it can be reasoned about
// (and run under plain node) on its own.
//
// The contract that kills the old bug class: this file never invents a box
// size. Every width and height here came from the browser measuring real text,
// so a node cannot end up narrower than its own label, and a label cannot end
// up on top of a node because labels live in bands that node bands never enter.

import {
  edgeEnd,
  isStack,
  lanesOf,
  type DiagramSpec,
  type EdgeSpec,
  type FlowSlot,
  type LaneSpec,
  type RowSpec,
} from "./diagram-spec";

export type Pt = { x: number; y: number };
export type Size = { w: number; h: number };
export type Rect = { x: number; y: number; w: number; h: number };
export type Measured = ReadonlyMap<string, Size>;

type Side = "l" | "r" | "t" | "b";
type AnchorSide = "top" | "bottom" | "left" | "right";

export type EdgeGeom = {
  id: string;
  d: string;
  p0: Pt;
  c1: Pt;
  c2: Pt;
  p3: Pt;
  mid: Pt;
  tipDeg: number;
};

export type LabelGeom = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  leader: { x1: number; y1: number; x2: number; y2: number };
};

export type LaneGeom = { rect: Rect; label: Rect | null };

export type LayoutResult = {
  nodes: Map<string, Rect>;
  groups: Map<string, Rect>;
  lanes: Map<string, LaneGeom>;
  edges: Map<string, EdgeGeom>;
  labels: Map<string, LabelGeom>;
  rail: { y: number; x1: number; x2: number } | null;
  content: Rect;
};

export type Orientation = "row" | "column";

export type LayoutOptions = {
  orientation: Orientation;
  gapMain: number;
  gapCross: number;
  rowGap: number;
  laneGap: number;
  stackGap: number;
  labelRowGap: number;
  labelPad: number;
  labelRowH: number;
  anchorGap: number;
  groupHead: number;
  groupPad: number;
  laneLabelGap: number;
  pad: number;
};

export function layoutOptions(orientation: Orientation): LayoutOptions {
  const row = orientation === "row";
  return {
    orientation,
    gapMain: row ? 46 : 26,
    gapCross: 18,
    rowGap: row ? 30 : 26,
    laneGap: row ? 46 : 40,
    stackGap: 12,
    labelRowGap: 6,
    labelPad: 14,
    labelRowH: 18,
    anchorGap: 16,
    groupHead: 16,
    groupPad: 12,
    laneLabelGap: row ? 18 : 10,
    pad: 10,
  };
}

const MIN_BEND = 18;
const MAX_BEND = 90;
const BEND_RATIO = 0.42;
const LEADER_GAP = 5;
const PORT_SPREAD = 16;
const RAIL_OVERHANG = 26;

// The label band height depends on the sweep, the sweep depends on the edge
// midpoints, and those depend on the band positions. For a purely horizontal or
// purely vertical edge the midpoint's cross coordinate drops out of the algebra
// and one pass would settle it, but an edge leaving a bottom port and arriving
// at a left port does carry the dependency through. So: iterate, stop as soon
// as the row counts repeat, and cap it. In practice this settles on pass two.
const MAX_PASSES = 3;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const r2 = (n: number) => Math.round(n * 100) / 100;

const NORMAL: Record<Side, Pt> = {
  l: { x: -1, y: 0 },
  r: { x: 1, y: 0 },
  t: { x: 0, y: -1 },
  b: { x: 0, y: 1 },
};

function portPoint(r: Rect, side: Side, offset: number): Pt {
  switch (side) {
    case "l":
      return { x: r.x, y: r.y + r.h / 2 + offset };
    case "r":
      return { x: r.x + r.w, y: r.y + r.h / 2 + offset };
    case "t":
      return { x: r.x + r.w / 2 + offset, y: r.y };
    default:
      return { x: r.x + r.w / 2 + offset, y: r.y + r.h };
  }
}

// Pick the sides an edge leaves and arrives on from the GAP between the two
// measured rects, not from the delta between their centres. When the boxes
// overlap on one axis, that axis is unavailable and the choice is forced rather
// than guessed. The old centre-delta version needed a 1.2 fudge factor for
// exactly the cases this handles outright.
function sidesFor(a: Rect, b: Rect): [Side, Side] {
  const gapX = Math.max(b.x - (a.x + a.w), a.x - (b.x + b.w), 0);
  const gapY = Math.max(b.y - (a.y + a.h), a.y - (b.y + b.h), 0);
  const dx = b.x + b.w / 2 - (a.x + a.w / 2);
  const dy = b.y + b.h / 2 - (a.y + a.h / 2);

  let horizontal: boolean;
  if (gapX === 0 && gapY === 0) horizontal = Math.abs(dx) >= Math.abs(dy);
  else if (gapX === 0) horizontal = false;
  else if (gapY === 0) horizontal = true;
  else horizontal = gapX >= gapY;

  if (horizontal) return dx >= 0 ? ["r", "l"] : ["l", "r"];
  return dy >= 0 ? ["b", "t"] : ["t", "b"];
}

function cubic(p0: Pt, sa: Side, p3: Pt, sb: Side): Omit<EdgeGeom, "id"> {
  const dist = Math.hypot(p3.x - p0.x, p3.y - p0.y);
  const bend = clamp(dist * BEND_RATIO, MIN_BEND, MAX_BEND);
  const na = NORMAL[sa];
  const nb = NORMAL[sb];
  const c1 = { x: p0.x + na.x * bend, y: p0.y + na.y * bend };
  const c2 = { x: p3.x + nb.x * bend, y: p3.y + nb.y * bend };
  // B(0.5) in closed form. The midpoint of two node centres, which is what the
  // old code used, sits well off the curve for exactly the edges that carry
  // labels: the drops between lanes and every fan-out arm.
  const mid = {
    x: (p0.x + 3 * c1.x + 3 * c2.x + p3.x) / 8,
    y: (p0.y + 3 * c1.y + 3 * c2.y + p3.y) / 8,
  };
  // Tangent at t=1 is 3*(P3-C2). A degenerate control point falls back to the
  // chord, so a very short connector still points somewhere sane.
  let tx = p3.x - c2.x;
  let ty = p3.y - c2.y;
  if (Math.abs(tx) < 0.01 && Math.abs(ty) < 0.01) {
    tx = p3.x - p0.x;
    ty = p3.y - p0.y;
  }
  return {
    d: `M ${r2(p0.x)} ${r2(p0.y)} C ${r2(c1.x)} ${r2(c1.y)}, ${r2(c2.x)} ${r2(c2.y)}, ${r2(p3.x)} ${r2(p3.y)}`,
    p0,
    c1,
    c2,
    p3,
    mid,
    tipDeg: (Math.atan2(ty, tx) * 180) / Math.PI,
  };
}

// Point on a cubic at parameter t, for an edge that terminates on another edge.
function bezierAt(g: { p0: Pt; c1: Pt; c2: Pt; p3: Pt }, t: number): Pt {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return {
    x: a * g.p0.x + b * g.c1.x + c * g.c2.x + d * g.p3.x,
    y: a * g.p0.y + b * g.c1.y + c * g.c2.y + d * g.p3.y,
  };
}

// Greedy interval colouring, sorted by left endpoint. Optimal for interval
// graphs, and it is the whole of the "labels never collide" guarantee: a label
// that would touch its neighbour drops to the next row of its band rather than
// being nudged into place by hand.
export function sweepRows(items: { lo: number; hi: number }[]): number[] {
  const order = items.map((_, i) => i).sort((a, b) => items[a].lo - items[b].lo);
  const rowEnd: number[] = [];
  const row = new Array<number>(items.length).fill(0);
  for (const i of order) {
    let r = rowEnd.findIndex((end) => end < items[i].lo);
    if (r === -1) r = rowEnd.length;
    rowEnd[r] = items[i].hi;
    row[i] = r;
  }
  return row;
}

function push<T>(map: Map<string, T[]>, key: string, value: T) {
  const list = map.get(key);
  if (list) list.push(value);
  else map.set(key, [value]);
}

type FlowRow = { lane: LaneSpec; row: RowSpec; slots: FlowSlot[]; index: number };

export function layoutDiagram(spec: DiagramSpec, m: Measured, o: LayoutOptions): LayoutResult {
  const horizontal = o.orientation === "row";
  const lanes = lanesOf(spec);
  const size = (id: string): Size => m.get(id) ?? { w: 0, h: 0 };

  const flowRows: FlowRow[] = [];
  for (const lane of lanes) {
    for (const row of lane.rows) {
      flowRows.push({
        lane,
        row,
        index: flowRows.length,
        slots: row.items.filter((s) => isStack(s) || !s.anchor),
      });
    }
  }

  // A slot is one node or one stack. In row orientation a stack runs down, so
  // it is as wide as its widest member and as tall as all of them; in column
  // orientation it runs across instead.
  function slotSize(slot: FlowSlot): Size {
    if (!isStack(slot)) return size(slot.id);
    let w = 0;
    let h = 0;
    slot.stack.forEach((n, i) => {
      const s = size(n.id);
      if (horizontal) {
        w = Math.max(w, s.w);
        h += s.h + (i ? o.stackGap : 0);
      } else {
        w += s.w + (i ? o.stackGap : 0);
        h = Math.max(h, s.h);
      }
    });
    return { w, h };
  }

  const mainOf = (s: Size) => (horizontal ? s.w : s.h);
  const crossOf = (s: Size) => (horizontal ? s.h : s.w);

  const rowMain = (fr: FlowRow) => {
    const sizes = fr.slots.map(slotSize);
    if (sizes.length === 0) return 0;
    return sizes.reduce((a, s) => a + mainOf(s), 0) + o.gapMain * (sizes.length - 1);
  };

  const groupMembers = new Set<string>();
  for (const lane of lanes) {
    for (const g of lane.groups ?? []) for (const id of g.members) groupMembers.add(id);
  }
  const rowHasGroup = (fr: FlowRow) =>
    fr.slots.some((s) => (isStack(s) ? s.stack : [s]).some((n) => groupMembers.has(n.id)));

  // An anchor side is written for the horizontal flow. When the flow reorients
  // top to bottom, the anchor has to turn with it: a gate written as sitting
  // "above" a step belongs beside it once the step is in a vertical chain, or
  // it would land on the step before it.
  const turned = (side: AnchorSide): AnchorSide => {
    if (horizontal) return side;
    return side === "top" ? "left" : side === "bottom" ? "right" : side === "left" ? "top" : "bottom";
  };

  // How far this row's anchored nodes stick out past its own boxes, before and
  // after it along the cross axis.
  const anchorOverhang = (fr: FlowRow) => {
    let head = 0;
    let foot = 0;
    for (const slot of fr.row.items) {
      if (isStack(slot) || !slot.anchor) continue;
      const reach = o.anchorGap + crossOf(size(slot.id));
      const side = turned(slot.anchor.side);
      const before = horizontal ? side === "top" : side === "left";
      const after = horizontal ? side === "bottom" : side === "right";
      if (before) head = Math.max(head, reach);
      else if (after) foot = Math.max(foot, reach);
    }
    return { head, foot };
  };

  const contentMain = Math.max(1, ...flowRows.map(rowMain));
  // The other axis: how wide the widest single box is, plus anything anchored
  // beside it. Only column orientation centres on this.
  const contentCross = Math.max(
    1,
    ...flowRows.map((fr) => {
      const over = anchorOverhang(fr);
      return over.head + Math.max(0, ...fr.slots.map((s) => crossOf(slotSize(s)))) + over.foot;
    }),
  );

  // Which flow row owns each node, so an edge's label knows which band it goes
  // in. Anchored nodes inherit the row of whatever they anchor to.
  const rowOfNode = new Map<string, number>();
  for (const fr of flowRows) {
    for (const slot of fr.slots) {
      for (const n of isStack(slot) ? slot.stack : [slot]) rowOfNode.set(n.id, fr.index);
    }
  }
  for (const lane of lanes) {
    for (const row of lane.rows) {
      for (const slot of row.items) {
        if (isStack(slot) || !slot.anchor) continue;
        const owner = rowOfNode.get(slot.anchor.to);
        if (owner != null) rowOfNode.set(slot.id, owner);
      }
    }
  }

  const labelRowH = Math.max(
    o.labelRowH,
    ...spec.edges.filter((e) => e.label).map((e) => size(`label:${e.id}`).h),
  );

  function place(counts: Map<number, number>): {
    result: LayoutResult;
    rowCounts: Map<number, number>;
  } {
    const nodes = new Map<string, Rect>();
    const bandStart: number[] = [];
    const bandExtent: number[] = [];
    const bandHead: number[] = [];
    const bandFoot: number[] = [];
    const labelBand: number[] = [];

    if (horizontal) {
      // --- cross axis: bands, strictly alternating node band / label band --
      // This alternation is the structural half of the fix. A label band is a
      // strip of the diagram no node ever enters, so a label cannot land on a
      // box no matter what the text turns out to measure.
      let cursor = 0;
      flowRows.forEach((fr, i) => {
        const head = rowHasGroup(fr) ? o.groupHead : 0;
        // Anchored nodes hang off a rect rather than sitting in the sequence,
        // but they still take up room. Counting their overhang in the band's
        // extent is what stops a gate above one lane hitting the lane above it.
        const over = anchorOverhang(fr);
        const extent =
          over.head + head + Math.max(0, ...fr.slots.map((s) => crossOf(slotSize(s)))) + over.foot;
        bandStart[i] = cursor;
        bandExtent[i] = extent;
        bandHead[i] = over.head;
        bandFoot[i] = over.foot;
        cursor += extent;

        const rows = counts.get(i) ?? 0;
        const h = rows > 0 ? rows * labelRowH + (rows - 1) * o.labelRowGap : 0;
        labelBand[i] = cursor + o.gapCross;
        if (h > 0) cursor += o.gapCross + h;

        const last = i + 1 >= flowRows.length || flowRows[i + 1].lane.id !== fr.lane.id;
        cursor += last ? o.laneGap : o.rowGap;
      });

      // --- main axis: measured extents plus a constant gap, row centred ----
      // Not even distribution. A five-slot row and a seven-slot row would end
      // up with different gaps, the connectors between lanes would slant at
      // arbitrary angles, and the eye would read the uneven spacing as meaning.
      flowRows.forEach((fr, i) => {
        const head = (rowHasGroup(fr) ? o.groupHead : 0) + bandHead[i];
        const inner = bandExtent[i] - head - bandFoot[i];
        let x = (contentMain - rowMain(fr)) / 2;
        for (const slot of fr.slots) {
          const s = slotSize(slot);
          const y = bandStart[i] + head + (inner - s.h) / 2;
          if (!isStack(slot)) {
            nodes.set(slot.id, { x, y, w: s.w, h: s.h });
          } else {
            let run = y;
            for (const n of slot.stack) {
              const ns = size(n.id);
              const nx = slot.align === "start" ? x : x + (s.w - ns.w) / 2;
              nodes.set(n.id, { x: nx, y: run, w: ns.w, h: ns.h });
              run += ns.h + o.stackGap;
            }
          }
          x += s.w + o.gapMain;
        }
      });
    } else {
      // Column orientation: every row is a continuation of one vertical chain
      // rather than a band beside the last one, because a narrow viewport has
      // height to spend and no width. Labels move to a gutter on the right and
      // the same interval sweep pushes collisions into further gutter columns.
      let y = 0;
      flowRows.forEach((fr, i) => {
        bandStart[i] = y;
        const over = anchorOverhang(fr);
        bandHead[i] = over.head;
        bandFoot[i] = over.foot;
        for (const slot of fr.slots) {
          const s = slotSize(slot);
          const x = over.head + (contentCross - over.head - over.foot - s.w) / 2;
          if (!isStack(slot)) {
            nodes.set(slot.id, { x, y, w: s.w, h: s.h });
          } else {
            let run = x;
            for (const n of slot.stack) {
              const ns = size(n.id);
              const ny = slot.align === "start" ? y : y + (s.h - ns.h) / 2;
              nodes.set(n.id, { x: run, y: ny, w: ns.w, h: ns.h });
              run += ns.w + o.stackGap;
            }
          }
          y += s.h + o.gapMain;
        }
        y -= o.gapMain;
        bandExtent[i] = y - bandStart[i];
        labelBand[i] = y;
        const last = i + 1 >= flowRows.length || flowRows[i + 1].lane.id !== fr.lane.id;
        y += last ? o.laneGap : o.rowGap;
      });
    }

    // --- anchored nodes, once every flow rect exists -----------------------
    for (const lane of lanes) {
      for (const row of lane.rows) {
        for (const slot of row.items) {
          if (isStack(slot) || !slot.anchor) continue;
          const host = nodes.get(slot.anchor.to);
          if (!host) continue;
          const s = size(slot.id);
          const side = turned(slot.anchor.side);
          const x =
            side === "left"
              ? host.x - o.anchorGap - s.w
              : side === "right"
                ? host.x + host.w + o.anchorGap
                : host.x + host.w / 2 - s.w / 2;
          const y =
            side === "top"
              ? host.y - o.anchorGap - s.h
              : side === "bottom"
                ? host.y + host.h + o.anchorGap
                : host.y + host.h / 2 - s.h / 2;
          nodes.set(slot.id, { x, y, w: s.w, h: s.h });
        }
      }
    }

    // --- groups: derived from member rects, never authored -----------------
    const groups = new Map<string, Rect>();
    for (const lane of lanes) {
      for (const g of lane.groups ?? []) {
        const rects = g.members.map((id) => nodes.get(id)).filter((r): r is Rect => !!r);
        if (!rects.length) continue;
        const x = Math.min(...rects.map((r) => r.x)) - o.groupPad;
        const y = Math.min(...rects.map((r) => r.y)) - o.groupPad;
        const right = Math.max(...rects.map((r) => r.x + r.w)) + o.groupPad;
        const bottom = Math.max(...rects.map((r) => r.y + r.h)) + o.groupPad;
        groups.set(g.id, { x, y, w: right - x, h: bottom - y });
      }
    }

    // --- edges -------------------------------------------------------------
    const edges = new Map<string, EdgeGeom>();
    const sideOf = new Map<string, [Side, Side]>();
    const portUse = new Map<string, string[]>();

    const nodeEnd = (e: EdgeSpec, which: "from" | "to") => {
      const end = edgeEnd(e[which]);
      return "node" in end ? end : null;
    };

    // Decide sides for every node-to-node edge first, then hand out offsets, so
    // three edges arriving on one side fan across it instead of stacking on a
    // single point.
    for (const e of spec.edges) {
      const a = nodeEnd(e, "from");
      const b = nodeEnd(e, "to");
      if (!a || !b) continue;
      const ra = nodes.get(a.node);
      const rb = nodes.get(b.node);
      if (!ra || !rb) continue;
      const auto = sidesFor(ra, rb);
      const sa = a.port && a.port !== "auto" ? (a.port as Side) : auto[0];
      const sb = b.port && b.port !== "auto" ? (b.port as Side) : auto[1];
      sideOf.set(e.id, [sa, sb]);
      push(portUse, `${a.node}:${sa}`, e.id);
      push(portUse, `${b.node}:${sb}`, e.id);
    }

    const offsetFor = (nodeId: string, side: Side, edgeId: string): number => {
      const users = portUse.get(`${nodeId}:${side}`) ?? [];
      const rect = nodes.get(nodeId);
      if (users.length < 2 || !rect) return 0;
      const sideLen = side === "l" || side === "r" ? rect.h : rect.w;
      const spread = Math.min(sideLen / (users.length + 1), PORT_SPREAD);
      return (users.indexOf(edgeId) - (users.length - 1) / 2) * spread;
    };

    for (const e of spec.edges) {
      const a = nodeEnd(e, "from");
      const b = nodeEnd(e, "to");
      const sides = sideOf.get(e.id);
      if (!a || !b || !sides) continue;
      const ra = nodes.get(a.node);
      const rb = nodes.get(b.node);
      if (!ra || !rb) continue;
      const p0 = portPoint(ra, sides[0], offsetFor(a.node, sides[0], e.id));
      const p3 = portPoint(rb, sides[1], offsetFor(b.node, sides[1], e.id));
      edges.set(e.id, { id: e.id, ...cubic(p0, sides[0], p3, sides[1]) });
    }

    // Edges terminating on another edge, resolved second so their target
    // already exists. A target that is itself an onEdge is a spec typo, not a
    // runtime condition, so it simply does not draw.
    for (const e of spec.edges) {
      if (edges.has(e.id)) continue;
      const from = edgeEnd(e.from);
      const to = edgeEnd(e.to);
      if (!("node" in from) || !("onEdge" in to)) continue;
      const host = edges.get(to.onEdge);
      const ra = nodes.get(from.node);
      if (!host || !ra) continue;
      const target = bezierAt(host, to.t);
      const sa: Side =
        target.y >= ra.y + ra.h
          ? "b"
          : target.y <= ra.y
            ? "t"
            : target.x >= ra.x + ra.w
              ? "r"
              : "l";
      const sb: Side = sa === "b" ? "t" : sa === "t" ? "b" : sa === "r" ? "l" : "r";
      edges.set(e.id, { id: e.id, ...cubic(portPoint(ra, sa, 0), sa, target, sb) });
    }

    // --- labels: one band per node band, collisions swept into extra rows --
    const labels = new Map<string, LabelGeom>();
    const nextCounts = new Map<number, number>();
    const byBand = new Map<number, EdgeSpec[]>();
    for (const e of spec.edges) {
      if (!e.label || !edges.has(e.id)) continue;
      const from = edgeEnd(e.from);
      const band = "node" in from ? (rowOfNode.get(from.node) ?? 0) : 0;
      const list = byBand.get(band);
      if (list) list.push(e);
      else byBand.set(band, [e]);
    }

    const gutter = (horizontal ? contentMain : contentCross) + o.laneLabelGap * 2;

    for (const [band, list] of byBand) {
      const sizes = list.map((e) => size(`label:${e.id}`));
      const mids = list.map((e) => edges.get(e.id)!.mid);
      const intervals = list.map((e, i) =>
        horizontal
          ? {
              lo: mids[i].x - sizes[i].w / 2 - o.labelPad,
              hi: mids[i].x + sizes[i].w / 2 + o.labelPad,
            }
          : {
              lo: mids[i].y - sizes[i].h / 2 - o.labelPad,
              hi: mids[i].y + sizes[i].h / 2 + o.labelPad,
            },
      );
      const rows = sweepRows(intervals);
      nextCounts.set(band, Math.max(...rows) + 1);

      list.forEach((e, i) => {
        const s = sizes[i];
        const mid = mids[i];
        if (horizontal) {
          const x = clamp(mid.x - s.w / 2, 0, Math.max(0, contentMain - s.w));
          const y = labelBand[band] + rows[i] * (labelRowH + o.labelRowGap);
          const below = y > mid.y;
          labels.set(e.id, {
            id: e.id,
            x,
            y,
            w: s.w,
            h: s.h,
            leader: {
              x1: mid.x,
              y1: mid.y + (below ? LEADER_GAP : -LEADER_GAP),
              x2: x + s.w / 2,
              y2: below ? y - 2 : y + s.h + 2,
            },
          });
        } else {
          const x = gutter + rows[i] * 8;
          const y = mid.y - s.h / 2;
          labels.set(e.id, {
            id: e.id,
            x,
            y,
            w: s.w,
            h: s.h,
            leader: { x1: mid.x + LEADER_GAP, y1: mid.y, x2: x - 3, y2: y + s.h / 2 },
          });
        }
      });
    }

    // --- lane labels and the infra rail ------------------------------------
    const laneGeom = new Map<string, LaneGeom>();
    const flowMinMain = Math.min(0, ...flowRows.map((fr) => (contentMain - rowMain(fr)) / 2));

    for (const lane of lanes) {
      const own = flowRows.filter((fr) => fr.lane.id === lane.id);
      const rects = own
        .flatMap((fr) => fr.slots.flatMap((s) => (isStack(s) ? s.stack : [s])))
        .map((n) => nodes.get(n.id))
        .filter((r): r is Rect => !!r);
      if (!rects.length) continue;
      const x = Math.min(...rects.map((r) => r.x));
      const y = Math.min(...rects.map((r) => r.y));
      const right = Math.max(...rects.map((r) => r.x + r.w));
      const bottom = Math.max(...rects.map((r) => r.y + r.h));
      const rect = { x, y, w: right - x, h: bottom - y };
      const ls = size(`lane:${lane.id}`);
      const label: Rect | null = ls.w
        ? horizontal
          ? {
              x: flowMinMain - o.laneLabelGap - ls.w,
              y: y + rect.h / 2 - ls.h / 2,
              w: ls.w,
              h: ls.h,
            }
          : { x: x + rect.w / 2 - ls.w / 2, y: y - o.laneLabelGap - ls.h, w: ls.w, h: ls.h }
        : null;
      laneGeom.set(lane.id, { rect, label });
    }

    let rail: LayoutResult["rail"] = null;
    if (spec.rail && horizontal) {
      const items = spec.rail.items.map((n) => nodes.get(n.id)).filter((r): r is Rect => !!r);
      if (items.length) {
        rail = {
          y: items[0].y + items[0].h / 2,
          x1: Math.min(...items.map((r) => r.x)) - RAIL_OVERHANG,
          x2: Math.max(...items.map((r) => r.x + r.w)) + RAIL_OVERHANG,
        };
      }
    }

    // --- content bounding box ----------------------------------------------
    // Everything drawn, including the control hull of each curve (a cubic is
    // always inside its own hull), so the fit centres on real content rather
    // than on an authored viewBox that was only ever a guess.
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    const eat = (x: number, y: number, w = 0, h = 0) => {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x + w > maxX) maxX = x + w;
      if (y + h > maxY) maxY = y + h;
    };
    for (const r of nodes.values()) eat(r.x, r.y, r.w, r.h);
    for (const r of groups.values()) eat(r.x, r.y - o.groupHead, r.w, r.h + o.groupHead);
    for (const l of laneGeom.values()) if (l.label) eat(l.label.x, l.label.y, l.label.w, l.label.h);
    for (const l of labels.values()) eat(l.x, l.y, l.w, l.h);
    for (const g of edges.values()) for (const p of [g.p0, g.c1, g.c2, g.p3]) eat(p.x, p.y);
    if (rail) {
      eat(rail.x1, rail.y);
      eat(rail.x2, rail.y);
    }
    if (!Number.isFinite(minX)) {
      minX = 0;
      minY = 0;
      maxX = 1;
      maxY = 1;
    }

    const content = {
      x: minX - o.pad,
      y: minY - o.pad,
      w: maxX - minX + o.pad * 2,
      h: maxY - minY + o.pad * 2,
    };

    return {
      result: { nodes, groups, lanes: laneGeom, edges, labels, rail, content },
      rowCounts: nextCounts,
    };
  }

  let rowCounts = new Map<number, number>();
  let out = place(rowCounts).result;
  for (let pass = 0; pass < MAX_PASSES; pass++) {
    const placed = place(rowCounts);
    const next = placed.rowCounts;
    const settled =
      next.size === rowCounts.size && [...next].every(([k, v]) => rowCounts.get(k) === v);
    rowCounts = next;
    out = placed.result;
    if (settled) break;
  }
  return out;
}

// --- fit -------------------------------------------------------------------

export type Fit = { k: number; tx: number; ty: number; overflow: number };

// Below this the node label drops under about ten pixels, which is where a mono
// caption stops being readable. The fit stops shrinking there and the frame
// pans down the composition instead of scaling text into illegibility.
const K_MIN = 0.78;
const K_MAX = 1;

// Past this much overflow, in frame-heights, the composition is something the
// reader travels through rather than something that nearly fits.
const SCROLL_THROUGH = 2;

// The scale the stage will run at.
//
// Two regimes, and the distinction matters. When the composition nearly fits,
// holding the legibility floor keeps the pan short, which is what keeps every
// lane on screen together. When it is several frames tall the pan is the mode
// rather than the exception, and shrinking below what the width allows buys
// nothing: it does not remove the pan, it only makes the type smaller and
// leaves the width empty. Reorientation has already ruled out the case where
// the width itself cannot be satisfied.
export function fitScale(content: Rect, frame: Size): number {
  const widthFit = frame.w / content.w;
  const raw = Math.min(widthFit, frame.h / content.h);
  if (raw >= K_MIN) return Math.min(raw, K_MAX);
  const scrollThrough = content.h * K_MIN > frame.h * SCROLL_THROUGH;
  return clamp(scrollThrough ? widthFit : K_MIN, K_MIN, K_MAX);
}

// One corrective pass on the band gaps, so the composition ends up shaped like
// the box it has to live in rather than being centred in a lot of nothing.
//
// A diagram is almost always width-bound, so the height it happens to come out
// at is whatever the band count gave it. This asks: at the scale the width
// implies, how much taller or shorter would the content have to be to fill the
// frame, and spreads that difference across the gaps between bands. Bounded in
// both directions, and run exactly once: the second layout is not re-tuned, so
// there is no loop to converge.
const GAP_MIN_FACTOR = 0.6;
const GAP_MAX_FACTOR = 2.2;

export function tuneGaps(
  base: LayoutOptions,
  first: Rect,
  frame: Size,
  spec: DiagramSpec,
): LayoutOptions {
  if (frame.w <= 0 || frame.h <= 0 || first.w <= 0 || first.h <= 0) return base;
  if (base.orientation !== "row") return base;

  const bands = Math.max(1, bandCount(spec) - 1);
  const widthScale = clamp(frame.w / first.w, K_MIN, K_MAX);
  const perBand = (frame.h / widthScale - first.h) / bands;


  // When the fit has already bottomed out at the legibility floor, the scale
  // will not shrink further and the width simply goes unused. Spending it on
  // the gaps between steps fills the frame without touching type size, and it
  // cannot feed back: the width-bound scale it produces is the floor again.
  const spareMain = frame.w / fitScale(first, frame) - first.w;
  const steps = Math.max(
    1,
    Math.max(...lanesOf(spec).flatMap((l) => l.rows.map((r) => r.items.length))) - 1,
  );
  const perStep = spareMain > 24 ? spareMain / steps : 0;

  if (Math.abs(perBand) < 4 && perStep < 4) return base;

  const flex = (v: number, delta: number) =>
    Math.round(clamp(v + delta, v * GAP_MIN_FACTOR, v * GAP_MAX_FACTOR));

  return {
    ...base,
    gapMain: flex(base.gapMain, perStep),
    laneGap: flex(base.laneGap, perBand),
    rowGap: flex(base.rowGap, perBand),
    gapCross: flex(base.gapCross, perBand),
  };
}

// True when a left-to-right flow cannot be made to fit across the frame without
// dropping below the legibility floor. This is the condition a width breakpoint
// is standing in for, asked directly: the two diagrams have very different
// natural widths, so the width at which one of them has to reorient is not the
// width at which the other does.
export function needsReorient(content: Rect, frame: Size): boolean {
  return frame.w > 0 && content.w * K_MIN > frame.w;
}

export function computeFit(content: Rect, frame: Size): Fit {
  if (content.w <= 0 || content.h <= 0 || frame.w <= 0 || frame.h <= 0) {
    return { k: 1, tx: 0, ty: 0, overflow: 0 };
  }
  // Quantised because the fit feeds a computed transform that the scroll-purity
  // check hashes: a half-pixel remeasure must not change the string.
  const k = Math.round(fitScale(content, frame) * 1000) / 1000;
  const sw = content.w * k;
  const sh = content.h * k;
  const overflow = Math.max(0, sh - frame.h);
  return {
    k,
    tx: (frame.w - sw) / 2 - content.x * k,
    ty: overflow > 0 ? -content.y * k : (frame.h - sh) / 2 - content.y * k,
    overflow,
  };
}

// Node bands in the diagram, which is what the gaps sit between.
export function bandCount(spec: DiagramSpec): number {
  return lanesOf(spec).reduce((n, lane) => n + lane.rows.length, 0);
}
