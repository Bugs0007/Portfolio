"use client";

import { useCallback } from "react";

export function useSiteScroll() {
  return useCallback((target: HTMLElement | 0) => {
    const padding = Number.parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    const top = target === 0 ? 0 : target.getBoundingClientRect().top + window.scrollY - padding;
    window.scrollTo({
      top: Math.max(0, top),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
  }, []);
}

export function focusSection(el: HTMLElement) {
  if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
  el.setAttribute("data-scroll-target", "");
  el.focus({ preventScroll: true });
}
