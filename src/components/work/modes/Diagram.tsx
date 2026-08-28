"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { motion, useTransform, type MotionValue } from "motion/react";
import type { WorkMetric } from "@/content/site";
import {
  deriveTiming,
  isStack,
  lanesOf,
  type DiagramSpec,
  type EdgeSpec,
  type LaneSpec,
  type NodeKind,
  type NodeSpec,
  type Timing,
} from "./diagram-spec";
import {

  computeFit,
  layoutDiagram,
  layoutOptions,
  needsReorient,
  tuneGaps,
  type EdgeGeom,
  type Fit,
  type LabelGeom,
  type LayoutResult,
  type Measured,
  type Orientation,
  type Rect,
  type Size,
} from "./diagram-layout";

// The hybrid renderer. Nodes are HTML, so the browser sizes them from their own
// text and a box can never be narrower than its label. Edges are one SVG layer
// behind the nodes, drawn from the measured rects rather than from anything
// authored. Labels are HTML too, and they live in bands that node bands never
// enter, which is why nothing here can render on top of anything else.
//
// Everything visible is a pure function of one scroll MotionValue: no timers,
// no accumulated state, so scrolling back up unwinds it exactly.

const IDENTITY_FIT: Fit = { k: 1, tx: 0, ty: 0, overflow: 0 };
const EMPTY_RECT: Rect = { x: 0, y: 0, w: 0, h: 0 };

// A lane that has handed off dims rather than disappears, and dims only
// slightly: the runtime flow is still the headline when the build track lights
// up beneath it. Comfortably above the 0.3 floor PipelineBullet already sets,
// for the same stated reason: no mode may make content that classic shows
// unreachable.
const LANE_DIM = 0.5;

const NODE_SKIN: Record<NodeKind, string> = {
  node: "rounded-sm border-mist/25 bg-ink-soft text-mist",
  chip: "rounded-md border-stone/45 bg-ink text-mist/90",
  sink: "rounded-sm border-jacket-bright/50 bg-jacket/25 text-mist",
  build: "rounded-md border-stone/30 border-dashed bg-ink text-stone",
  infra: "rounded-md border-stone/25 bg-ink text-stone",
};

const NODE_METRICS: Record<NodeKind, string> = {
  node: "min-w-[96px] max-w-[190px] px-3.5 py-2 text-[13px]",
  chip: "min-w-[84px] max-w-[176px] px-3 py-1.5 text-[12px]",
  sink: "min-w-[92px] max-w-[180px] px-3.5 py-2 text-[13px]",
  build: "min-w-[80px] max-w-[168px] px-3 py-1.5 text-[12px]",
  infra: "min-w-[76px] max-w-[160px] px-2.5 py-1 text-[11px]",
};

const EDGE_SKIN = {
  flow: { stroke: "stroke-jacket-bright", width: 1.6, dashed: false },
  aside: { stroke: "stroke-stone/80", width: 1.2, dashed: true },
  build: { stroke: "stroke-stone/70", width: 1.2, dashed: true },
  infra: { stroke: "stroke-stone/50", width: 1, dashed: true },
} as const;

function metricText(metric: WorkMetric) {
  return metric.from && metric.to ? `${metric.from} → ${metric.to}` : metric.value;
}

// --- measurement -----------------------------------------------------------

// Read offsetWidth/offsetHeight, never getBoundingClientRect. These come from
// the layout box, and a CSS transform is a paint operation that never re-enters
// layout, so the fit scale sitting on an ancestor cannot contaminate the read.
// getBoundingClientRect would return the scaled box, which would feed a smaller
// content size back into the fit and oscillate.
function useMeasuredLayout(spec: DiagramSpec, orientation: Orientation) {
  const frameRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const signature = useRef("");
  const [state, setState] = useState<{ layout: LayoutResult; fit: Fit } | null>(null);

  useLayoutEffect(() => {
    const frame = frameRef.current;
    const stage = stageRef.current;
    if (!frame || !stage) return;
    let cancelled = false;

    const run = () => {
      if (cancelled) return;
      // One read loop into a map, then one write. Interleaving reads and writes
      // would force a reflow per node instead of one for the whole pass.
      const measured: Measured = new Map(
        [...stage.querySelectorAll<HTMLElement>("[data-mid]")].map((el) => [
          el.dataset.mid ?? "",
          { w: el.offsetWidth, h: el.offsetHeight } as Size,
        ]),
      );
      const frameSize = { w: frame.clientWidth, h: frame.clientHeight };

      // The guard that makes this effect idempotent: under StrictMode's double
      // invoke, under a resize that changed nothing, and under fonts.ready
      // firing when the fonts were already there.
      let sig = `${orientation}|${frameSize.w}x${frameSize.h}`;
      for (const [id, s] of measured) sig += `|${id}:${s.w}:${s.h}`;
      if (sig === signature.current) return;
      signature.current = sig;

      // Lay out once with the base gaps, then once more with gaps corrected for
      // the shape of the frame. The second pass is not re-tuned, so this is two
      // passes and not an iteration looking for a fixed point.
      const lay = (o: Orientation) => {
        const base = layoutOptions(o);
        const first = layoutDiagram(spec, measured, base);
        const tuned = tuneGaps(base, first.content, frameSize, spec);
        return tuned === base ? first : layoutDiagram(spec, measured, tuned);
      };

      // The caller states a preference; the measurements settle it. A flow that
      // cannot fit across the frame at a readable size runs down it instead,
      // which is a per-diagram answer rather than one breakpoint for both.
      let layout = lay(orientation);
      if (orientation === "row" && needsReorient(layout.content, frameSize)) {
        layout = lay("column");
      }
      setState({ layout, fit: computeFit(layout.content, frameSize) });
    };

    const observer = new ResizeObserver(run);
    observer.observe(frame);
    // A swapped web font changes intrinsic widths after first paint. The
    // signature guard makes this a no-op when nothing moved.
    document.fonts?.ready.then(run).catch(() => {});

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [spec, orientation]);

  return {
    frameRef,
    stageRef,
    layout: state?.layout ?? null,
    fit: state?.fit ?? IDENTITY_FIT,
  };
}

// --- pieces ----------------------------------------------------------------

function NodeBox({
  node,
  rect,
  at,
  progress,
}: {
  node: NodeSpec;
  rect: Rect;
  at: number;
  progress: MotionValue<number>;
}) {
  const opacity = useTransform(progress, [at - 0.05, at + 0.015], [0, 1], { clamp: true });
  const scale = useTransform(progress, [at - 0.05, at + 0.015], [0.9, 1], { clamp: true });
  const kind = node.kind ?? "node";

  return (
    <motion.div
      data-mid={node.id}
      style={{ x: rect.x, y: rect.y, scale, opacity }}
      className={`absolute left-0 top-0 flex w-max flex-col items-center justify-center gap-0.5 border text-center font-mono leading-tight ${NODE_SKIN[kind]} ${NODE_METRICS[kind]}`}
    >
      <span className="block">{node.label}</span>
      {/* A separate element with its own line-height, not a second text
          baseline offset inside a fixed box. Its presence is what makes a node
          with a sublabel taller than one without. */}
      {node.sub && (
        <span className="block text-[10px] leading-snug text-stone/80">{node.sub}</span>
      )}
    </motion.div>
  );
}

function EdgeLines({
  edge,
  geom,
  label,
  window: at,
  progress,
}: {
  edge: EdgeSpec;
  geom: EdgeGeom | null;
  label: LabelGeom | null;
  window: [number, number];
  progress: MotionValue<number>;
}) {
  // Hooks run unconditionally, so the missing-geometry guard comes after them.
  // Geometry is absent only on the first render, before anything is measured.
  const [start, end] = at;
  const offset = useTransform(progress, [start, end], [1, 0], { clamp: true });
  const railOpacity = useTransform(progress, [start - 0.04, start], [0, 1], { clamp: true });
  const tipOpacity = useTransform(progress, [end - 0.015, end + 0.01], [0, 1], { clamp: true });
  const leadOpacity = useTransform(progress, [end - 0.015, end + 0.05], [0, 1], { clamp: true });

  if (!geom) return null;
  const skin = EDGE_SKIN[edge.kind ?? "flow"];

  return (
    <g>
      {skin.dashed && (
        // A path cannot use its dash pattern for a visual style and for the
        // draw at the same time, so a dashed edge gets two: a static dashed
        // rail hinting the route, and the drawn stroke over it. Both run off
        // the same window, so both still reverse on scroll-up.
        <motion.path
          d={geom.d}
          fill="none"
          strokeWidth={skin.width * 0.8}
          strokeDasharray="3 3"
          className="stroke-stone/25"
          style={{ opacity: railOpacity }}
        />
      )}
      <motion.path
        d={geom.d}
        pathLength={1}
        fill="none"
        strokeWidth={skin.width}
        strokeDasharray="1 1"
        strokeLinecap="round"
        className={skin.stroke}
        style={{ strokeDashoffset: offset }}
      />
      {edge.arrow !== false && (
        // Not marker-end: a marker is placed by path geometry rather than by
        // stroke visibility, so it would sit at full opacity on its destination
        // for the whole draw, pointing at a line that is not there yet.
        <motion.path
          d="M -7 -4.5 L 0 0 L -7 4.5"
          fill="none"
          strokeWidth={skin.width}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={skin.stroke}
          transform={`translate(${geom.p3.x} ${geom.p3.y}) rotate(${geom.tipDeg})`}
          style={{ opacity: tipOpacity }}
        />
      )}
      {label && (
        <motion.line
          x1={label.leader.x1}
          y1={label.leader.y1}
          x2={label.leader.x2}
          y2={label.leader.y2}
          strokeWidth={0.75}
          className="stroke-stone/45"
          style={{ opacity: leadOpacity }}
        />
      )}
    </g>
  );
}

function EdgeLabel({
  edge,
  geom,
  metric,
  end,
  progress,
}: {
  edge: EdgeSpec;
  geom: LabelGeom | null;
  metric?: WorkMetric;
  end: number;
  progress: MotionValue<number>;
}) {
  const opacity = useTransform(progress, [end - 0.015, end + 0.05], [0, 1], { clamp: true });
  const text = edge.label?.text;

  return (
    <motion.div
      data-mid={`label:${edge.id}`}
      style={{ x: geom?.x ?? 0, y: geom?.y ?? 0, opacity }}
      className="absolute left-0 top-0 w-max max-w-[260px] font-mono text-[11px] leading-snug"
    >
      {metric ? (
        <>
          <span className="text-mist">{metricText(metric)}</span>{" "}
          <span className="text-stone">{metric.label}</span>
        </>
      ) : (
        <span className="text-stone">{text}</span>
      )}
    </motion.div>
  );
}

function laneWindow(timing: Timing, lane: LaneSpec): [number, number] {
  return timing.lane.get(lane.id) ?? [0, 1];
}

// The lane's dim, and only its dim. It never reaches 0, because the nodes
// inside carry the 0 -> 1 reveal and CSS opacity nests multiplicatively: a lane
// fading in at the same time as its nodes would sit at 0.04 halfway through and
// arrive late and abruptly.
//
// A lane only steps back for a later lane of the same standing. A build track
// or an infrastructure rail is supporting by construction, drawn dimmer and
// smaller, so dimming the runtime flow underneath one would invert the very
// hierarchy those styles exist to state.
function useLaneDim(
  progress: MotionValue<number>,
  window: [number, number],
  dimsAtEnd: boolean,
) {
  const [start, end] = window;
  return useTransform(
    progress,
    [start - 0.05, start, end, end + 0.12],
    [LANE_DIM, 1, 1, dimsAtEnd ? LANE_DIM : 1],
    { clamp: true },
  );
}

function LaneNodes({
  lane,
  layout,
  timing,
  progress,
  dimsAtEnd,
}: {
  lane: LaneSpec;
  layout: LayoutResult | null;
  timing: Timing;
  progress: MotionValue<number>;
  dimsAtEnd: boolean;
}) {
  const dim = useLaneDim(progress, laneWindow(timing, lane), dimsAtEnd);
  const nodes = useMemo(
    () => lane.rows.flatMap((row) => row.items.flatMap((s) => (isStack(s) ? s.stack : [s]))),
    [lane],
  );
  const laneLabel = layout?.lanes.get(lane.id)?.label ?? null;

  return (
    <motion.div style={{ opacity: dim }} className="absolute left-0 top-0">
      {/* Always rendered, so it is always measurable: its width is what sets
          the left margin the lanes are centred inside. */}
      <div
        data-mid={`lane:${lane.id}`}
        style={{ transform: `translate(${laneLabel?.x ?? 0}px, ${laneLabel?.y ?? 0}px)` }}
        className="absolute left-0 top-0 w-max font-mono text-[10px] uppercase tracking-[0.18em] text-stone/70"
      >
        {lane.label}
      </div>
      {(lane.groups ?? []).map((group) => {
        const rect = layout?.groups.get(group.id);
        return (
          <div
            key={group.id}
            style={{ transform: `translate(${(rect?.x ?? 0) + 2}px, ${(rect?.y ?? 0) - 16}px)` }}
            className="absolute left-0 top-0 w-max font-mono text-[10px] uppercase tracking-[0.18em] text-moss"
          >
            {group.label}
          </div>
        );
      })}
      {nodes.map((node) => (
        <NodeBox
          key={node.id}
          node={node}
          rect={layout?.nodes.get(node.id) ?? EMPTY_RECT}
          at={timing.node.get(node.id) ?? 0.5}
          progress={progress}
        />
      ))}
    </motion.div>
  );
}

function LaneEdges({
  lane,
  edges,
  layout,
  timing,
  progress,
  dimsAtEnd,
}: {
  lane: LaneSpec;
  edges: EdgeSpec[];
  layout: LayoutResult | null;
  timing: Timing;
  progress: MotionValue<number>;
  dimsAtEnd: boolean;
}) {
  const dim = useLaneDim(progress, laneWindow(timing, lane), dimsAtEnd);
  const groups = lane.groups ?? [];

  return (
    <motion.g style={{ opacity: dim }}>
      {groups.map((group) => {
        const rect = layout?.groups.get(group.id);
        if (!rect) return null;
        const at = timing.group.get(group.id) ?? 0.5;
        return <GroupBoundary key={group.id} rect={rect} at={at} progress={progress} />;
      })}
      {edges.map((edge) => (
        <EdgeLines
          key={edge.id}
          edge={edge}
          geom={layout?.edges.get(edge.id) ?? null}
          label={layout?.labels.get(edge.id) ?? null}
          window={timing.edge.get(edge.id) ?? [0, 1]}
          progress={progress}
        />
      ))}
    </motion.g>
  );
}

function GroupBoundary({
  rect,
  at,
  progress,
}: {
  rect: Rect;
  at: number;
  progress: MotionValue<number>;
}) {
  const opacity = useTransform(progress, [at - 0.05, at + 0.015], [0, 1], { clamp: true });
  return (
    <motion.rect
      x={rect.x}
      y={rect.y}
      width={rect.w}
      height={rect.h}
      rx={4}
      fill="none"
      strokeWidth={0.8}
      strokeDasharray="3 3"
      className="stroke-moss/70"
      style={{ opacity }}
    />
  );
}

function RailLine({
  rail,
  at,
  progress,
}: {
  rail: NonNullable<LayoutResult["rail"]>;
  at: number;
  progress: MotionValue<number>;
}) {
  const offset = useTransform(progress, [at - 0.06, at + 0.04], [1, 0], { clamp: true });
  return (
    <motion.line
      x1={rail.x1}
      y1={rail.y}
      x2={rail.x2}
      y2={rail.y}
      pathLength={1}
      strokeWidth={1}
      strokeDasharray="1 1"
      className="stroke-stone/40"
      style={{ strokeDashoffset: offset }}
    />
  );
}

// --- diagram ---------------------------------------------------------------

export function Diagram({
  spec,
  progress,
  panProgress,
  metrics,
  orientation,
  ariaLabel,
}: {
  spec: DiagramSpec;
  progress: MotionValue<number>;
  panProgress: MotionValue<number>;
  metrics: Map<string, WorkMetric>;
  orientation: Orientation;
  ariaLabel: string;
}) {
  const { frameRef, stageRef, layout, fit } = useMeasuredLayout(spec, orientation);
  const timing = useMemo(() => deriveTiming(spec), [spec]);
  const lanes = useMemo(() => lanesOf(spec), [spec]);

  // Which lane owns each edge, so an edge dims with the lane it belongs to.
  const edgesByLane = useMemo(() => {
    const owner = new Map<string, string>();
    for (const lane of lanes) {
      for (const row of lane.rows) {
        for (const slot of row.items) {
          for (const n of isStack(slot) ? slot.stack : [slot]) owner.set(n.id, lane.id);
        }
      }
    }
    const out = new Map<string, EdgeSpec[]>();
    for (const lane of lanes) out.set(lane.id, []);
    for (const edge of spec.edges) {
      const from = typeof edge.from === "string" ? edge.from : "node" in edge.from ? edge.from.node : "";
      const to = typeof edge.to === "string" ? edge.to : "node" in edge.to ? edge.to.node : "";
      const laneId = owner.get(to) ?? owner.get(from) ?? lanes[0]?.id;
      if (laneId) out.get(laneId)?.push(edge);
    }
    return out;
  }, [lanes, spec.edges]);

  const labelled = useMemo(() => spec.edges.filter((e) => e.label), [spec.edges]);
  // A lane steps back only for a later lane of equal standing.
  const dimsAtEnd = useMemo(
    () =>
      lanes.map((_, i) => lanes.slice(i + 1).some((l) => (l.tone ?? "primary") !== "dim")),
    [lanes],
  );
  const content = layout?.content ?? { x: 0, y: 0, w: 1, h: 1 };

  // Pan is a separate element from the fit so the two cannot fight. CSS applies
  // the outer transform first, so panY is in unscaled frame pixels while the
  // overflow it travels is already in scaled ones: no k correction anywhere.
  const panY = useTransform(panProgress, [0, 1], [0, -fit.overflow], { clamp: true });

  return (
    <div
      ref={frameRef}
      data-diagram-frame
      className="relative min-h-0 w-full flex-1 overflow-hidden"
      role="group"
      aria-label={ariaLabel}
    >
      <motion.div style={{ y: panY }} className="absolute inset-0">
        <div
          ref={stageRef}
          style={{
            transform: `translate(${fit.tx}px, ${fit.ty}px) scale(${fit.k})`,
            // Mandatory. The default 50% 50% would add a silent (1-k)*size/2
            // term on both axes and the centring maths would stop matching.
            transformOrigin: "0 0",
            willChange: "transform",
            opacity: layout ? 1 : 0,
          }}
          className="absolute left-0 top-0"
        >
          <svg
            aria-hidden
            viewBox={`${content.x} ${content.y} ${content.w} ${content.h}`}
            width={content.w}
            height={content.h}
            style={{ transform: `translate(${content.x}px, ${content.y}px)` }}
            className="pointer-events-none absolute left-0 top-0"
          >
            {layout?.rail && (
              <RailLine
                rail={layout.rail}
                at={timing.lane.get(spec.rail?.id ?? "")?.[0] ?? 0.9}
                progress={progress}
              />
            )}
            {lanes.map((lane, i) => (
              <LaneEdges
                key={lane.id}
                lane={lane}
                edges={edgesByLane.get(lane.id) ?? []}
                layout={layout}
                timing={timing}
                progress={progress}
                dimsAtEnd={dimsAtEnd[i]}
              />
            ))}
          </svg>

          {lanes.map((lane, i) => (
            <LaneNodes
              key={lane.id}
              lane={lane}
              layout={layout}
              timing={timing}
              progress={progress}
              dimsAtEnd={dimsAtEnd[i]}
            />
          ))}

          {labelled.map((edge) => (
            <EdgeLabel
              key={edge.id}
              edge={edge}
              geom={layout?.labels.get(edge.id) ?? null}
              metric={edge.label?.metric ? metrics.get(edge.label.metric) : undefined}
              end={(timing.edge.get(edge.id) ?? [0, 1])[1]}
              progress={progress}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
