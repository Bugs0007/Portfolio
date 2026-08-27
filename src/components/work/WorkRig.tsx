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

function useIsNarrow() {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 639px)");
    const update = () => setNarrow(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return narrow;
}

export function WorkRig() {
  const reduceMotion = usePrefersReducedMotion();
  const mounted = useIsMounted();
  const isNarrow = useIsNarrow();

  if (reduceMotion || !mounted) return <Work />;

  return (
    <PipelineMode
      featured={featuredWorkItems}
      supporting={supportingWorkItems}
      isNarrow={isNarrow}
    />
  );
}
