"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import "./opening-greeting.css";

// A welcome, not a loading gate: the page and original hero video load beneath
// this short sequence. It never waits for an asset or a network request.
export function OpeningGreeting() {
  const [finished, setFinished] = useState(false);
  const screen = useRef<HTMLDivElement>(null);
  const finish = useCallback(() => setFinished(true), []);

  useEffect(() => {
    if (finished) return;
    const content = document.getElementById("portfolio-page");
    const previousOverflow = document.body.style.overflow;
    const previousInert = content?.inert ?? false;
    document.body.style.overflow = "hidden";
    if (content) content.inert = true;
    screen.current?.focus({ preventScroll: true });

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") finish();
    };
    document.addEventListener("keydown", onKey);
    // Hydration can arrive partway through the CSS sequence. Only wait for
    // what remains, so a slow connection never adds an invisible second gate.
    const departure = screen.current?.getAnimations()[0];
    const duration = Number(departure?.effect?.getComputedTiming().endTime ?? 1800);
    const elapsed = Number(departure?.currentTime ?? 0);
    const fallback = window.setTimeout(finish, Math.max(0, duration - elapsed) + 25);
    return () => {
      window.clearTimeout(fallback);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      if (content) content.inert = previousInert;
    };
  }, [finished, finish]);

  if (finished) return null;

  return (
    <>
      <noscript><style>{".opening-greeting { display: none !important; }"}</style></noscript>
      <div
        ref={screen}
        className="opening-greeting"
        role="dialog"
        aria-modal="true"
        aria-label="Welcome to Bhagath Samalla’s portfolio"
        tabIndex={-1}
        onAnimationEnd={(event) => {
          if (event.target === event.currentTarget) finish();
        }}
      >
        <span className="opening-greeting-signature" aria-hidden="true">BHAGATH SAMALLA</span>
        <p className="sr-only">Hello. नमस्ते. నమస్తే. Welcome.</p>
        <div className="opening-greeting-words" aria-hidden="true">
          <span className="opening-greeting-word opening-greeting-english" lang="en">Hello</span>
          <span className="opening-greeting-word opening-greeting-hindi" lang="hi">नमस्ते</span>
          <span className="opening-greeting-word opening-greeting-telugu" lang="te">నమస్తే</span>
        </div>
        <div className="opening-greeting-footer">
          <span className="opening-greeting-indicators" aria-hidden="true"><i /><i /><i /></span>
          <button type="button" onClick={finish}>Skip intro <span aria-hidden="true">↗</span></button>
        </div>
      </div>
    </>
  );
}
