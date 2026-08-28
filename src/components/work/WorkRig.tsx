"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { featuredWorkItems, supportingWorkItems } from "@/content/site";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { Work } from "@/components/Work";
import { PipelineMode } from "./modes/PipelineMode";

// Work renders as scroll-driven architecture diagrams (PipelineMode), falling
// back to the plain stacked layout in Work.tsx.
//
// Work.tsx is the fallback rather than a separate simplified copy: it is the
// server render, the reduced-motion branch, and what search engines and no-JS
// visitors get. Two reasons to fall back, both landing there:
//   - reduced motion, where a pinned scroll-scrubbed diagram is exactly the
//     kind of thing that setting asks to be spared;
//   - not yet hydrated, so the server and first client render agree.
//
// This used to sit behind a ?workMode switch with five alternatives. The
// comparison is over; the switch, the dev tools and the per-mode registry are
// gone.

const noopSubscribe = () => () => {};

// True only after hydration, via an explicit server snapshot, so this is a
// clean two-pass render rather than a setState fired from an effect.
function useIsMounted() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

// Four bands. Under 640px, or under 640px tall, a pinned diagram has nothing to
// offer that the stacked layout does not, so classic takes over entirely rather
// than the diagram being shrunk past reading. The height bound matters most
// under browser zoom, which shrinks the CSS viewport in both directions.
//
// Between 640 and 900 the flow reorients top to bottom instead of scaling its
// text into illegibility. The side column is a separate question from the
// orientation and needs more room than the reorientation does: a diagram and a
// bullet list splitting 1000px leaves neither enough, so below 1280 the diagram
// takes the full width and the bullets sit under it.
type ViewportClass = "narrow" | "compact" | "wide" | "roomy";

function useViewportClass(): ViewportClass {
  const [klass, setKlass] = useState<ViewportClass>("roomy");
  useEffect(() => {
    const queries = [
      ["narrow", window.matchMedia("(max-width: 639px), (max-height: 639px)")],
      ["compact", window.matchMedia("(max-width: 899px)")],
      ["wide", window.matchMedia("(max-width: 1279px)")],
    ] as const;
    const update = () =>
      setKlass(queries.find(([, q]) => q.matches)?.[0] ?? "roomy");
    update();
    for (const [, q] of queries) q.addEventListener("change", update);
    return () => {
      for (const [, q] of queries) q.removeEventListener("change", update);
    };
  }, []);
  return klass;
}

export function WorkRig() {
  const reduceMotion = usePrefersReducedMotion();
  const mounted = useIsMounted();
  const viewport = useViewportClass();

  if (reduceMotion || !mounted || viewport === "narrow") return <Work />;

  return (
    <PipelineMode
      featured={featuredWorkItems}
      supporting={supportingWorkItems}
      orientation={viewport === "compact" ? "column" : "row"}
      allowSideColumn={viewport === "roomy"}
    />
  );
}
