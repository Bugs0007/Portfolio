"use client";

import { AnimatePresence, motion, useScroll } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { focusSection, useSiteScroll } from "@/hooks/useSiteScroll";
import { EASE } from "@/lib/motion";

// Appears once the reader is a full viewport past the bottom of the hero, and
// leaves only once they are back within this fraction of a viewport of the top.
// The distance between the two is deliberate: a single threshold would flicker
// the button in and out for anyone reading right at it, and "near the top" is
// the one place where a way back to the top has nothing left to do. It also
// means that after a click the button bows out right as the page arrives.
const HIDE_WITHIN_VH = 0.3;

// Bottom-left, opposite SectionNav's right-hand rail and corner button, so the
// two never meet. From lg up it sits inside the 64px gutter every section keeps
// (20px in, 36px wide), clear of content. Also clear of Music's mute toggle,
// which is anchored bottom-right inside that section.
export function BackToTop() {
  const reduceMotion = usePrefersReducedMotion();
  const scroll = useSiteScroll();
  // The same shared scroll tracker ScrollProgress already subscribes to, so
  // this adds a listener, not another source of scroll reads.
  const { scrollY } = useScroll();
  const [visible, setVisible] = useState(false);
  const visibleRef = useRef(false);

  useEffect(() => {
    let showAt = Infinity;
    let hideAt = 0;

    // Measured on mount and resize only, never per scroll frame. The hero is
    // min-h-[72vh] but can run taller when its type wraps on a narrow screen.
    const measure = () => {
      const vh = window.innerHeight;
      const hero = document.getElementById("intro");
      showAt = (hero?.offsetHeight ?? 0) + vh;
      hideAt = vh * HIDE_WITHIN_VH;
    };

    const update = (y: number) => {
      const next = visibleRef.current ? y > hideAt : y > showAt;
      if (next === visibleRef.current) return;
      visibleRef.current = next;
      setVisible(next);
    };

    const onResize = () => {
      measure();
      update(window.scrollY);
    };

    measure();
    // window.scrollY rather than the motion value: on a reload that restores a
    // mid-page position, the tracker may not have measured yet.
    update(window.scrollY);
    window.addEventListener("resize", onResize);
    const unsubscribe = scrollY.on("change", update);
    return () => {
      window.removeEventListener("resize", onResize);
      unsubscribe();
    };
  }, [scrollY]);

  const toTop = () => {
    // Focus goes to the top of the content first. The button is about to leave,
    // and a focused element that unmounts drops keyboard focus to <body>.
    const intro = document.getElementById("intro");
    if (intro) focusSection(intro);
    scroll(0);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          aria-label="Back to top"
          onClick={toTop}
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={
            reduceMotion
              ? { opacity: 0, transition: { duration: 0 } }
              : { opacity: 0, y: 12, transition: { duration: 0.35, ease: EASE } }
          }
          transition={{ duration: reduceMotion ? 0 : 0.5, ease: EASE }}
          className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-4 z-50 flex size-11 items-center justify-center rounded-full border border-mist/15 bg-ink/75 text-mist/85 backdrop-blur-md transition-colors hover:text-jacket-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jacket-bright lg:bottom-5 lg:left-5 lg:size-9 print:hidden"
        >
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M12 19V5M6 11l6-6 6 6" />
          </svg>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
