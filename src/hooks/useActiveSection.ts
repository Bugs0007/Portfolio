"use client";

import { useEffect, useState } from "react";

// Where on screen a section counts as the one being read, as a percentage of
// the viewport height from the top. A little above centre, where the eye sits.
// Whole percent on purpose: (1 - 0.4) * 100 is 60.00000000000001 in floating
// point, and that is not something to hand a rootMargin string.
const READING_LINE_PCT = 40;

// The last section (the contact footer) is shorter than the space under the
// reading line on most screens, so at the very bottom of the page its top never
// reaches the line. It also counts as active once at least this much of it is
// on screen.
const TAIL_VISIBLE = 0.5;

/**
 * The id of the section currently being read.
 *
 * Driven entirely by IntersectionObserver, with no per-frame scroll work. That
 * is the cheaper option even with Lenis already emitting scroll events: a
 * position-based check would have to cache every section's offset and
 * invalidate that cache whenever Work re-measures its diagrams or Travel swaps
 * its static render for the pinned one, all of which the observer sees for
 * free because it works on real layout. The observers are only a trigger. When
 * one fires, `pick` reads the section tops once and applies a single rule: the
 * active section is the last one whose top has crossed the reading line. That
 * rule gives the Seam (which has no entry) to Work, and holds in both scroll
 * directions.
 */
export function useActiveSection(ids: readonly string[]): string {
  const [active, setActive] = useState(ids[0]);

  useEffect(() => {
    const first = ids[0];
    const lastId = ids[ids.length - 1];

    const pick = () => {
      const vh = window.innerHeight;
      const line = (vh * READING_LINE_PCT) / 100;
      let next = first;
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= line) next = id;
      }
      const last = document.getElementById(lastId);
      if (last) {
        const r = last.getBoundingClientRect();
        const visible = Math.min(r.bottom, vh) - Math.max(r.top, 0);
        // 1px of slack so a ratio that lands a hair under the observer's
        // threshold after rounding still counts.
        if (visible >= r.height * TAIL_VISIBLE - 1) next = lastId;
      }
      setActive(next);
    };

    let lineObserver: IntersectionObserver | null = null;
    let tailObserver: IntersectionObserver | null = null;

    const observe = () => {
      lineObserver?.disconnect();
      tailObserver?.disconnect();
      // A zero-height root at the reading line: an entry fires exactly when a
      // section boundary crosses it.
      lineObserver = new IntersectionObserver(pick, {
        rootMargin: `-${READING_LINE_PCT}% 0px -${100 - READING_LINE_PCT}% 0px`,
      });
      tailObserver = new IntersectionObserver(pick, {
        threshold: TAIL_VISIBLE,
      });
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el) lineObserver.observe(el);
      }
      const last = document.getElementById(lastId);
      if (last) tailObserver.observe(last);
    };

    observe();

    // Work and Travel both replace their root element after hydration (static
    // fallback out, pinned version in), and Work does it again if the viewport
    // crosses its narrow breakpoint. An observer holding the old node would go
    // silent, so re-attach whenever main's direct children change. That is
    // rare, and it is never per frame.
    const main = document.querySelector("main");
    const mutations = main ? new MutationObserver(observe) : null;
    if (main && mutations) mutations.observe(main, { childList: true });

    return () => {
      lineObserver?.disconnect();
      tailObserver?.disconnect();
      mutations?.disconnect();
    };
  }, [ids]);

  return active;
}
