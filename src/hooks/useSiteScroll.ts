"use client";

import { useCallback } from "react";
import { useLenis } from "lenis/react";
import { cubicBezier } from "motion/react";
import { EASE } from "@/lib/motion";

// Lenis's own default is an exponential ease-out that is close to the site
// curve but not the same one. Passing the site curve keeps "one easing curve"
// true for programmatic scrolls as well; the duration stays whatever
// SmoothScroll configured the instance with.
const siteEase = cubicBezier(...EASE);

/**
 * Scroll the page to an element or to the very top, through the page's Lenis
 * instance when there is one.
 *
 * There is no instance under reduced motion (SmoothScroll skips Lenis
 * entirely), and there the jump is instant: an animated scroll is exactly what
 * that setting asks to be spared.
 */
export function useSiteScroll() {
  const lenis = useLenis();

  return useCallback(
    (target: HTMLElement | 0) => {
      if (lenis) {
        lenis.scrollTo(target, { easing: siteEase });
        return;
      }
      const top =
        target === 0 ? 0 : target.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top, behavior: "instant" });
    },
    [lenis],
  );
}

/**
 * Move keyboard and screen-reader focus to a section without scrolling to it.
 *
 * A native in-page link moves the focus starting point to its target, so the
 * next Tab continues from there. Scrolling with Lenis instead of following the
 * href loses that, so it is put back by hand. Sections are not focusable on
 * their own, hence the tabindex; `data-scroll-target` is what globals.css keys
 * the outline suppression off, since a ring around an entire section is not a
 * focus indicator anyone needs.
 *
 * Attributes are set at call time rather than rendered, because Work and Travel
 * both swap their root element after hydration.
 */
export function focusSection(el: HTMLElement) {
  if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
  el.setAttribute("data-scroll-target", "");
  el.focus({ preventScroll: true });
}
