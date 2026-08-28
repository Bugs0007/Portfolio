// The shape of an architecture diagram, and the reveal timing derived from it.
//
// Geometry is deliberately absent. A spec says what the boxes are, which lane
// and row they sit in, and what connects to what; where any of it lands on
// screen is decided by diagram-layout.ts from the browser's own measurements.
// That split is the whole point of the rebuild: nothing here can encode a
// width, so nothing here can clip its own text.

export type NodeKind = "node" | "chip" | "sink" | "build" | "infra";

// Which side of a box an edge leaves from or arrives at. "auto" picks the side
// from the gap between the two measured rects.
export type Port = "l" | "r" | "t" | "b" | "auto";

export type NodeSpec = {
  id: string;
  label: string;
  sub?: string;
  kind?: NodeKind;
  // Anchored nodes leave the flow: they are positioned off another node's
  // measured rect, consume no slot, and add no height to their band. They only
  // extend the content bounding box, which the fit absorbs.
  anchor?: { to: string; side: "top" | "bottom" | "left" | "right" };
  // Explicit depth, in slot units, overriding the position-derived one.
  order?: number;
};

// A vertical group filling one flow slot: the notification fan-out, the two
// terminal states of the hearing machine.
export type StackSpec = {
  id: string;
  stack: NodeSpec[];
  align?: "start" | "center";
};

export type FlowSlot = NodeSpec | StackSpec;

export function isStack(slot: FlowSlot): slot is StackSpec {
  return "stack" in slot;
}

export type RowSpec = {
  id: string;
  items: FlowSlot[];
  // Shifts every slot in the row later in the reveal, in slot units. Used for a
  // second track that consumes what the first track built.
  depthOffset?: number;
};

// A labelled boundary drawn around a set of nodes so they read as one named
// component. The rect is derived from the members' measured rects, never
// authored, so it cannot drift out of sync with them.
export type GroupSpec = {
  id: string;
  label: string;
  members: string[];
};

export type LaneSpec = {
  id: string;
  label: string;
  // "dim" is build-time or infrastructure rather than request-time: dimmer
  // stroke, smaller nodes, dashed rails.
  tone?: "primary" | "dim";
  rows: RowSpec[];
  groups?: GroupSpec[];
  // Overrides the slot-count-derived share of the scroll.
  weight?: number;
};

export type EdgeEnd =
  | { node: string; port?: Port }
  // Terminate on another edge's curve rather than on a box. This is what lets
  // the auth gate draw into the edge before the API instead of floating beside
  // it disconnected.
  | { onEdge: string; t: number };

export type EdgeSpec = {
  id: string;
  from: EdgeEnd | string;
  to: EdgeEnd | string;
  kind?: "flow" | "aside" | "build" | "infra";
  arrow?: boolean;
  // text is written here; metric is a key looked up in the WorkItem's own
  // metrics[] by label, so a number can never be retyped out of sync.
  label?: { text?: string; metric?: string };
};

export type RailSpec = {
  id: string;
  label: string;
  items: NodeSpec[];
  badge?: NodeSpec;
};

export type DiagramSpec = {
  id: string;
  lanes: LaneSpec[];
  edges: EdgeSpec[];
  rail?: RailSpec;
  headline?: { value: string; label: string };
  // Index-aligned with the item's bullets: which node each bullet describes, so
  // the bullet brightens as the flow reaches it.
  bulletNodes?: string[];
};

// --- timing ----------------------------------------------------------------

// Lanes overlap slightly so there is no dead air between one finishing and the
// next starting.
const LANE_OVERLAP = 0.035;
// Stack members cascade rather than arriving together.
const STACK_STAGGER = 0.35;
// A path starts drawing this far (in slot units) before its source lit, so it
// finishes exactly as its destination lights.
const EDGE_LEAD = 0.55;
const ANCHOR_LEAD = 0.5;
const GROUP_LEAD = 0.02;
const RAIL_WEIGHT = 2;

export type Timing = {
  node: Map<string, number>;
  edge: Map<string, [number, number]>;
  lane: Map<string, [number, number]>;
  group: Map<string, number>;
};

export function edgeEnd(end: EdgeEnd | string): EdgeEnd {
  return typeof end === "string" ? { node: end } : end;
}

// Every lane in draw order, with the rail folded in as the last one so it draws
// beneath the lanes it carries.
export function lanesOf(spec: DiagramSpec): LaneSpec[] {
  if (!spec.rail) return spec.lanes;
  // The badge rides the same row as the rail's stops rather than getting a row
  // of its own. A row costs the whole diagram its height, and the rail row is
  // not the widest one, so there is room for it on the end.
  const railRows: RowSpec[] = [
    {
      id: `${spec.rail.id}-items`,
      items: spec.rail.badge ? [...spec.rail.items, spec.rail.badge] : spec.rail.items,
    },
  ];
  return [
    ...spec.lanes,
    {
      id: spec.rail.id,
      label: spec.rail.label,
      tone: "dim",
      rows: railRows,
      weight: RAIL_WEIGHT,
    },
  ];
}

function laneSlotCount(lane: LaneSpec): number {
  return lane.rows.reduce((n, row) => n + row.items.length, 0);
}

// Slot positions along a row, skipping anchored entries. An anchored node hangs
// off another node's rect rather than occupying a place in the sequence, so
// letting it consume a depth index would push everything after it one beat late
// depending on where in the list it happened to be written.
function* flowDepths(row: RowSpec): Generator<{ slot: FlowSlot; depth: number }> {
  const off = row.depthOffset ?? 0;
  let j = 0;
  for (const slot of row.items) {
    if (!isStack(slot) && slot.anchor) continue;
    yield { slot, depth: (isStack(slot) ? j : (slot.order ?? j)) + off };
    j += 1;
  }
}

// Reveal times for every node, edge, lane and group, derived from lane order
// and slot position rather than hand-tuned. With roughly forty nodes across the
// two diagrams, hand-tuning would be forty numbers that silently rot the moment
// a step is inserted.
export function deriveTiming(spec: DiagramSpec): Timing {
  const lanes = lanesOf(spec);
  const node = new Map<string, number>();
  const edge = new Map<string, [number, number]>();
  const lane = new Map<string, [number, number]>();
  const group = new Map<string, number>();
  // Slot duration of the lane each node belongs to, so an edge's lead-in is
  // scaled to the pace of its own lane rather than the diagram average.
  const stepOf = new Map<string, number>();

  const weights = lanes.map((l) => l.weight ?? Math.max(1, laneSlotCount(l)));
  const total = weights.reduce((a, b) => a + b, 0) || 1;

  const pending: NodeSpec[] = []; // anchored nodes, resolved after the flow

  let cursor = 0;
  lanes.forEach((l, li) => {
    const span = weights[li] / total;
    const start = li > 0 ? cursor - LANE_OVERLAP : 0;
    const end = cursor + span;
    cursor = end;
    lane.set(l.id, [start, end]);

    let maxDepth = 0;
    for (const row of l.rows) {
      for (const { depth } of flowDepths(row)) if (depth > maxDepth) maxDepth = depth;
    }
    // The +1 leaves the lane a tail beat after its last node, so the lane is
    // fully lit for a moment before it starts dimming.
    const step = (end - start) / (maxDepth + 1);

    for (const row of l.rows) {
      for (const { slot, depth } of flowDepths(row)) {
        if (isStack(slot)) {
          slot.stack.forEach((n, i) => {
            node.set(n.id, start + (depth + i * STACK_STAGGER) * step);
            stepOf.set(n.id, step);
          });
        } else {
          node.set(slot.id, start + depth * step);
          stepOf.set(slot.id, step);
        }
      }
      for (const slot of row.items) {
        if (!isStack(slot) && slot.anchor) {
          pending.push(slot);
          stepOf.set(slot.id, step);
        }
      }
    }

    for (const g of l.groups ?? []) {
      const ats = g.members.map((id) => node.get(id)).filter((v): v is number => v != null);
      group.set(g.id, (ats.length ? Math.min(...ats) : start) - GROUP_LEAD);
    }
  });

  // Anchored nodes light just ahead of what they attach to, so the gate is
  // already there when the edge it guards arrives.
  for (const n of pending) {
    const base = node.get(n.anchor!.to);
    const step = stepOf.get(n.id) ?? 0.05;
    node.set(n.id, Math.max(0, (base ?? 0.5) - ANCHOR_LEAD * step));
  }
  // Groups whose members were all anchored resolve on the second look.
  for (const l of lanes) {
    for (const g of l.groups ?? []) {
      const ats = g.members.map((id) => node.get(id)).filter((v): v is number => v != null);
      if (ats.length) group.set(g.id, Math.min(...ats) - GROUP_LEAD);
    }
  }

  const atOf = (end: EdgeEnd): number | undefined => {
    if ("node" in end) return node.get(end.node);
    const target = edge.get(end.onEdge);
    return target ? target[1] : undefined;
  };

  // Node-to-node edges first, then the edges that terminate on them, so an
  // onEdge end always has a resolved target to read.
  const ordered = [...spec.edges].sort((a, b) => {
    const av = "onEdge" in edgeEnd(a.to) || "onEdge" in edgeEnd(a.from) ? 1 : 0;
    const bv = "onEdge" in edgeEnd(b.to) || "onEdge" in edgeEnd(b.from) ? 1 : 0;
    return av - bv;
  });

  for (const e of ordered) {
    const from = edgeEnd(e.from);
    const to = edgeEnd(e.to);
    const a = atOf(from);
    const b = atOf(to);
    if (a == null || b == null) continue;
    const step = "node" in from ? (stepOf.get(from.node) ?? 0.05) : 0.05;
    edge.set(e.id, [Math.max(0, a - EDGE_LEAD * step), Math.max(a, b)]);
  }

  return { node, edge, lane, group };
}
