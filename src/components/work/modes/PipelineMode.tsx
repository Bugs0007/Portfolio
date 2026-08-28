"use client";

import { useMemo, useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import type { WorkItem } from "@/content/site";
import { deriveTiming, type DiagramSpec } from "./diagram-spec";
import type { Orientation } from "./diagram-layout";
import { Diagram } from "./Diagram";
import { brynklabsDiagram } from "./specs/brynklabs";
import { caseintelDiagram } from "./specs/caseintel";
import { diagramBeats, drawWindow, pinSpanFor } from "./work-beats";
import { StackTags, SupportingCards, WorkSectionShell } from "./shared";

// Scroll-driven architecture diagrams. Each featured item pins for a few
// viewport-heights while its system draws itself: paths advance via a
// normalised pathLength and a strokeDashoffset read straight off scroll
// position, nodes fade and scale in as the line reaches them, and each metric
// rides the edge it actually describes.
//
// Nothing here runs on a timer and nothing accumulates state, so scrolling back
// up unwinds the diagram exactly the way it drew.

const SPECS: Record<string, DiagramSpec> = {
  brynklabs: brynklabsDiagram,
  caseintel: caseintelDiagram,
};

// Below this many bullets, the side column is mostly empty and the diagram
// should have the width instead. Composition follows content rather than one
// template stretched over two very different items.
const SIDE_COLUMN_MIN_BULLETS = 3;

// One bullet, brightened as the line reaches the node it describes. The floor
// is 0.3 rather than 0, deliberately: no mode may make content that classic
// shows unreachable, and a bullet at zero opacity is content a reader scanning
// the page can miss even though find-in-page would still match it.
function PipelineBullet({
  text,
  nodeAt,
  progress,
}: {
  text: string;
  nodeAt: number;
  progress: MotionValue<number>;
}) {
  const opacity = useTransform(progress, [nodeAt - 0.08, nodeAt + 0.04], [0.3, 1], {
    clamp: true,
  });
  const x = useTransform(progress, [nodeAt - 0.08, nodeAt + 0.04], [8, 0], { clamp: true });
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

function PipelineChapter({
  item,
  orientation,
  allowSideColumn,
}: {
  item: WorkItem;
  orientation: Orientation;
  allowSideColumn: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const spec = SPECS[item.id];

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const span = spec ? pinSpanFor(diagramBeats(spec)) : 3;
  const [drawStart, drawEnd] = drawWindow(span);

  // Lead-in and hold: the diagram starts drawing once the pin has settled and
  // is complete before the pin releases, so the last edge is never still
  // mid-draw as the section scrolls away.
  const draw = useTransform(scrollYProgress, [drawStart, drawEnd], [0, 1], { clamp: true });
  // Only used when the composition is taller than the frame even at the
  // legibility floor. Starts after the first lane has drawn, ends before the
  // pin releases.
  const pan = useTransform(scrollYProgress, [0.3, drawEnd - 0.02], [0, 1], { clamp: true });

  // Metrics looked up by label, so an edge naming a metric that was renamed in
  // site.ts simply stops drawing a label rather than printing a stale number.
  const metrics = useMemo(
    () => new Map(item.metrics.map((m) => [m.label, m])),
    [item.metrics],
  );

  // Reveal times are derived, so a bullet reads them from the same place the
  // diagram does rather than the two drifting apart.
  const nodeTiming = useMemo(() => (spec ? deriveTiming(spec).node : null), [spec]);

  if (!spec) return null;

  const nodeAtFor = (i: number) => {
    const id = spec.bulletNodes?.[i];
    return (id ? nodeTiming?.get(id) : undefined) ?? 0.5;
  };

  // Two conditions, and both are about whether the column would earn its place:
  // enough bullets to fill it, and enough width that splitting leaves the
  // diagram a usable share. Otherwise the diagram takes the width and the
  // bullets get a capped, scrollable strip under it.
  const sideColumn = allowSideColumn && item.bullets.length >= SIDE_COLUMN_MIN_BULLETS;

  const bullets = (
    <ul className="space-y-3">
      {item.bullets.map((bullet, i) => (
        <PipelineBullet key={bullet} text={bullet} nodeAt={nodeAtFor(i)} progress={draw} />
      ))}
    </ul>
  );

  return (
    <div ref={containerRef} style={{ height: `${span * 100}vh` }} className="relative">
      {/* The full-width chapter runs tighter chrome than the two-column one:
          its diagram is the taller of the two and every row of padding it does
          not spend is a row the diagram does not have to pan past. */}
      <div
        className={`sticky top-0 flex h-screen flex-col overflow-hidden px-6 sm:px-10 lg:px-16 ${
          sideColumn ? "py-16" : "py-10"
        }`}
      >
        <header className="mx-auto flex w-full max-w-7xl shrink-0 items-start gap-6">
          <div className="min-w-0 flex-1">
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
          </div>
          {spec.headline && (
            <div className="shrink-0 text-right">
              <div className="font-display text-4xl font-medium leading-none text-jacket-bright sm:text-5xl">
                {spec.headline.value}
              </div>
              <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-stone">
                {spec.headline.label}
              </div>
            </div>
          )}
        </header>

        {sideColumn ? (
          <div className="mx-auto mt-6 grid min-h-0 w-full max-w-7xl flex-1 grid-cols-[1.7fr_1fr] gap-10">
            <div className="flex min-h-[200px] flex-col">
              <Diagram
                spec={spec}
                progress={draw}
                panProgress={pan}
                metrics={metrics}
                orientation={orientation}
                ariaLabel={`${item.title} architecture diagram`}
              />
            </div>
            <div className="flex min-h-0 flex-col overflow-y-auto">
              {bullets}
              <StackTags items={item.stack} className="mt-5" />
            </div>
          </div>
        ) : (
          <div className="mx-auto mt-6 flex min-h-0 w-full max-w-7xl flex-1 flex-col">
            <Diagram
              spec={spec}
              progress={draw}
              panProgress={pan}
              metrics={metrics}
              orientation={orientation}
              ariaLabel={`${item.title} architecture diagram`}
            />
            <div className="mt-5 max-h-[22vh] shrink-0 overflow-y-auto border-t border-mist/10 pt-4">
              {bullets}
              <StackTags items={item.stack} className="mt-3" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function PipelineMode({
  featured,
  supporting,
  orientation,
  allowSideColumn,
}: {
  featured: WorkItem[];
  supporting: WorkItem[];
  orientation: Orientation;
  allowSideColumn: boolean;
}) {
  return (
    <WorkSectionShell label="pipeline">
      <div className="mt-10">
        {featured.map((item) => (
          <PipelineChapter
            key={item.id}
            item={item}
            orientation={orientation}
            allowSideColumn={allowSideColumn}
          />
        ))}
      </div>
      <SupportingCards items={supporting} />
    </WorkSectionShell>
  );
}
