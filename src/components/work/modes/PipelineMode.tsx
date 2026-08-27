"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import type { WorkItem, WorkMetric } from "@/content/site";
import {
  PIPELINE_GRAPHS,
  type Graph,
  type GraphEdge,
  type GraphNode,
} from "./pipeline-graphs";
import { StackTags, SupportingCards, WorkSectionShell } from "./shared";

// Scroll-driven architecture diagrams. Each featured item pins for a few
// viewport-heights while its system draws itself: paths advance via a
// normalised pathLength and a strokeDashoffset read straight off scroll
// position, nodes fade and scale in as the line reaches them, and each metric
// rides the edge it actually describes.
//
// Nothing here runs on a timer and nothing accumulates state, so scrolling
// back up unwinds the diagram exactly the way it drew.

const PIN_SPAN = 3.4; // viewport-heights per featured item
const PIN_SPAN_NARROW = 3;

// Node box geometry, in viewBox units. Width tracks label length so a long
// label (Source-referenced answer) is not clipped by a fixed box.
function boxSize(node: GraphNode) {
  const scale = node.kind === "chip" ? 1.35 : 1.55;
  const pad = node.kind === "chip" ? 5 : 7;
  return {
    w: node.label.length * scale + pad,
    h: node.kind === "chip" ? 7.5 : 10,
  };
}

// A cubic from one box boundary to the next, leaving and entering along
// whichever axis dominates the gap. Straight runs stay straight (the control
// points collapse onto the line), so the main track reads as a track and only
// the fan-out and the edge concerns curve.
function edgePath(a: GraphNode, b: GraphNode): string {
  const av = boxSize(a);
  const bv = boxSize(b);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  // 1.2 rather than 1.0: an edge only counts as horizontal when it is
  // clearly more across than down. At 1.0 the scraping-technique chips, which
  // sit above the node they feed and about as far to the side, left through
  // their own sides and arrived at the scrape node next to its outgoing edge.
  // Above this ratio they drop in from the top, which is what they mean.
  const horizontal = Math.abs(dx) > Math.abs(dy) * 1.2;

  const sx = horizontal ? a.x + Math.sign(dx) * (av.w / 2) : a.x;
  const sy = horizontal ? a.y : a.y + Math.sign(dy) * (av.h / 2);
  const ex = horizontal ? b.x - Math.sign(dx) * (bv.w / 2) : b.x;
  const ey = horizontal ? b.y : b.y - Math.sign(dy) * (bv.h / 2);

  const bend = horizontal ? Math.abs(ex - sx) * 0.45 : Math.abs(ey - sy) * 0.45;
  const c1x = horizontal ? sx + Math.sign(dx) * bend : sx;
  const c1y = horizontal ? sy : sy + Math.sign(dy) * bend;
  const c2x = horizontal ? ex - Math.sign(dx) * bend : ex;
  const c2y = horizontal ? ey : ey - Math.sign(dy) * bend;

  return `M ${sx} ${sy} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${ex} ${ey}`;
}

function metricText(metric: WorkMetric) {
  return metric.from && metric.to ? `${metric.from} \u2192 ${metric.to}` : metric.value;
}

function Edge({
  graph,
  edge,
  metric,
  progress,
}: {
  graph: Graph;
  edge: GraphEdge;
  metric?: WorkMetric;
  progress: MotionValue<number>;
}) {
  const from = graph.nodes.find((n) => n.id === edge.from);
  const to = graph.nodes.find((n) => n.id === edge.to);

  // Hooks run unconditionally, so the missing-node guard comes after them.
  // A missing id is a typo in pipeline-graphs.ts, not a runtime condition.
  const [start, end] = edge.at;
  const offset = useTransform(progress, [start, end], [1, 0], { clamp: true });
  const railOpacity = useTransform(progress, [start - 0.04, start], [0, 1], {
    clamp: true,
  });
  const labelOpacity = useTransform(progress, [end - 0.02, end + 0.06], [0, 1], {
    clamp: true,
  });

  if (!from || !to) return null;

  const d = edgePath(from, to);
  const mid = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
  const sameRow = Math.abs(from.y - to.y) < 2;

  return (
    <g>
      {edge.dashed && (
        // A path cannot use its dash pattern for a visual style and for the
        // draw at the same time, so a dashed edge gets two: a static dashed
        // rail hinting the route, and the drawn stroke on top of it. Both run
        // off the same window, so both still reverse on scroll-up.
        <motion.path
          d={d}
          fill="none"
          strokeWidth={0.4}
          strokeDasharray="1.4 1.4"
          className="stroke-stone/25"
          style={{ opacity: railOpacity }}
        />
      )}
      <motion.path
        d={d}
        pathLength={1}
        fill="none"
        strokeWidth={edge.dashed ? 0.5 : 0.7}
        strokeDasharray="1 1"
        strokeLinecap="round"
        className={edge.dashed ? "stroke-stone/80" : "stroke-jacket-bright"}
        style={{ strokeDashoffset: offset }}
      />
      {metric && (
        <motion.text
          x={mid.x}
          y={sameRow ? mid.y - 3.4 : mid.y}
          textAnchor="middle"
          style={{ opacity: labelOpacity }}
          paintOrder="stroke"
          stroke="var(--ink)"
          strokeWidth={1.1}
          strokeLinejoin="round"
          className="font-mono"
          fontSize={3}
        >
          <tspan className="fill-mist">{metricText(metric)}</tspan>
          <tspan className="fill-stone" dx={1.4} fontSize={2.5}>
            {metric.label}
          </tspan>
        </motion.text>
      )}
    </g>
  );
}

function Node({ node, progress }: { node: GraphNode; progress: MotionValue<number> }) {
  const { w, h } = boxSize(node);
  const opacity = useTransform(progress, [node.at - 0.06, node.at + 0.02], [0, 1], {
    clamp: true,
  });
  const scale = useTransform(progress, [node.at - 0.06, node.at + 0.02], [0.88, 1], {
    clamp: true,
  });

  const fill =
    node.kind === "sink"
      ? "fill-jacket/25"
      : node.kind === "chip"
        ? "fill-ink"
        : "fill-ink-soft";
  const stroke = node.kind === "chip" ? "stroke-stone/45" : "stroke-mist/25";

  return (
    <motion.g style={{ opacity, scale, originX: `${node.x}px`, originY: `${node.y}px` }}>
      <rect
        x={node.x - w / 2}
        y={node.y - h / 2}
        width={w}
        height={h}
        rx={node.kind === "chip" ? 3.75 : 1.5}
        strokeWidth={0.5}
        className={`${fill} ${stroke}`}
      />
      <text
        x={node.x}
        y={node.y + (node.sub ? -0.4 : 1.1)}
        textAnchor="middle"
        className={`font-mono ${node.kind === "chip" ? "fill-stone" : "fill-mist"}`}
        fontSize={node.kind === "chip" ? 2.9 : 3.3}
      >
        {node.label}
      </text>
      {node.sub && (
        <text
          x={node.x}
          y={node.y + 3.4}
          textAnchor="middle"
          className="fill-stone/80 font-mono"
          fontSize={2.4}
        >
          {node.sub}
        </text>
      )}
    </motion.g>
  );
}

function Cluster({
  cluster,
  progress,
}: {
  cluster: NonNullable<Graph["cluster"]>;
  progress: MotionValue<number>;
}) {
  const opacity = useTransform(progress, [cluster.at - 0.06, cluster.at + 0.02], [0, 1], {
    clamp: true,
  });
  return (
    <motion.g style={{ opacity }}>
      <rect
        x={cluster.x}
        y={cluster.y}
        width={cluster.w}
        height={cluster.h}
        rx={2}
        fill="none"
        strokeWidth={0.4}
        strokeDasharray="1.4 1.4"
        className="stroke-moss/70"
      />
      <text
        x={cluster.x + 1.5}
        y={cluster.y - 1.6}
        className="fill-moss font-mono uppercase"
        fontSize={2.6}
        letterSpacing={0.3}
      >
        {cluster.label}
      </text>
    </motion.g>
  );
}

// One bullet, brightened as the line reaches the node it describes. The floor
// is 0.3 rather than 0, deliberately: no mode may make content that classic
// shows unreachable, and a bullet at zero opacity is content a reader scanning
// the page can miss even though find-in-page would still match it.
function PipelineBullet({
  text,
  nodeAt,
  progress,
  amplitude,
}: {
  text: string;
  nodeAt: number;
  progress: MotionValue<number>;
  amplitude: number;
}) {
  const opacity = useTransform(progress, [nodeAt - 0.08, nodeAt + 0.04], [0.3, 1], {
    clamp: true,
  });
  const x = useTransform(progress, [nodeAt - 0.08, nodeAt + 0.04], [8 * amplitude, 0], {
    clamp: true,
  });
  const barOpacity = useTransform(progress, [nodeAt - 0.08, nodeAt + 0.04], [0.08, 0.55], {
    clamp: true,
  });

  return (
    <motion.li
      style={{ opacity, x }}
      className="relative pl-4 text-sm leading-relaxed text-mist"
    >
      <motion.span
        aria-hidden
        style={{ opacity: barOpacity }}
        className="absolute left-0 top-1.5 h-[calc(100%-0.75rem)] w-px bg-jacket-bright"
      />
      {text}
    </motion.li>
  );
}

function PipelineChapter({ item, isNarrow }: { item: WorkItem; isNarrow: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const graph = PIPELINE_GRAPHS[item.id];

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Lead-in and hold: the diagram starts drawing once the pin has settled and
  // is complete before the pin releases, so the last edge is never still
  // mid-draw as the section scrolls away.
  const draw = useTransform(scrollYProgress, [0.08, 0.9], [0, 1], { clamp: true });
  const amplitude = isNarrow ? 0.4 : 1;
  const span = isNarrow ? PIN_SPAN_NARROW : PIN_SPAN;

  // Metrics looked up by label, so an edge naming a metric that was renamed in
  // site.ts simply stops drawing a label rather than printing a stale number.
  const metricsByLabel = new Map(item.metrics.map((m) => [m.label, m]));

  if (!graph) return null;

  return (
    <div ref={containerRef} style={{ height: `${span * 100}vh` }} className="relative">
      <div className="sticky top-0 flex h-screen flex-col overflow-hidden px-6 py-16 sm:px-10 lg:px-16">
        <header className="mx-auto w-full max-w-6xl shrink-0">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h3 className="font-display text-2xl font-medium text-mist sm:text-3xl">
              {item.title}
            </h3>
            {item.subtitle && (
              <span className="font-mono text-xs uppercase tracking-wider text-stone">
                {item.subtitle}
              </span>
            )}
            {item.when && (
              <span className="font-mono text-xs text-stone/70">{item.when}</span>
            )}
            {item.href && (
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-sm font-mono text-xs text-jacket-bright underline decoration-jacket-bright/40 underline-offset-4 hover:decoration-jacket-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jacket-bright"
              >
                {item.href.replace("https://", "")}
              </a>
            )}
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-mist/70">
            {item.summary}
          </p>
        </header>

        <div className="mx-auto mt-6 grid min-h-0 w-full max-w-6xl flex-1 grid-cols-1 gap-6 lg:grid-cols-[1.35fr_1fr] lg:gap-10">
          <div className="flex min-h-0 items-center">
            <svg
              viewBox={graph.viewBox}
              className="h-auto max-h-full w-full overflow-visible"
              role="img"
              aria-label={`${item.title} architecture diagram`}
            >
              {graph.cluster && <Cluster cluster={graph.cluster} progress={draw} />}
              {graph.edges.map((edge) => (
                <Edge
                  key={`${edge.from}-${edge.to}`}
                  graph={graph}
                  edge={edge}
                  metric={edge.metric ? metricsByLabel.get(edge.metric) : undefined}
                  progress={draw}
                />
              ))}
              {graph.nodes.map((node) => (
                <Node key={node.id} node={node} progress={draw} />
              ))}
            </svg>
          </div>

          <div className="flex min-h-0 flex-col overflow-y-auto">
            <ul className="space-y-3">
              {item.bullets.map((bullet, i) => {
                const node = graph.nodes.find((n) => n.id === graph.bulletNodes[i]);
                return (
                  <PipelineBullet
                    key={bullet}
                    text={bullet}
                    nodeAt={node?.at ?? 0.5}
                    progress={draw}
                    amplitude={amplitude}
                  />
                );
              })}
            </ul>
            <StackTags items={item.stack} className="mt-5" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function PipelineMode({
  featured,
  supporting,
  isNarrow,
}: {
  featured: WorkItem[];
  supporting: WorkItem[];
  isNarrow: boolean;
}) {
  return (
    <WorkSectionShell label="pipeline">
      <div className="mt-10">
        {featured.map((item) => (
          <PipelineChapter key={item.id} item={item} isNarrow={isNarrow} />
        ))}
      </div>
      <SupportingCards items={supporting} />
    </WorkSectionShell>
  );
}
