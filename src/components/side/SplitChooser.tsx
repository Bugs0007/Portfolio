"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { sides, type Side } from "@/content/site";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useSide } from "./SideContext";
import "./split-chooser.css";

// The door after the greeting: the screen cut on a diagonal. Work sits in the
// light half on an engineer's grid, Off the Clock in the dark half over the
// Jispa night sky, in the same type and colours as the rest of the site.
//
// One number pair drives everything: the light half is
// polygon(0 0, 100% 0, 100% a%, 0 b%), so the cut runs from (0, b) on the
// left to (100%, a) on the right. `a` and `b` ease toward a target every frame
// and also place the accent hairline on the cut, so the two never disagree.
//
//   enter:  a = b = 0 (no light) -> the resting cut, the light half slides in
//   hover:  the hovered half grows a little
//   choose: the chosen half takes the whole screen, then the overlay fades

const REST = { a: 18, b: 90 };
const GROW = 8;
const TARGET = {
  rest: REST,
  work: { a: REST.a + GROW, b: REST.b + GROW },
  life: { a: REST.a - GROW, b: REST.b - GROW },
  takeWork: { a: 115, b: 190 },
  takeLife: { a: -80, b: -8 },
};

type Phase = "waiting" | "enter" | "idle" | "leaving" | "gone";

// The Work half's picture: a terminal that types out real numbers from the
// résumé, one command at a time. Nothing here is a new claim.
const TERMINAL: { cmd: string; out: string }[] = [
  { cmd: "whoami", out: "bhagath · python backend engineer" },
  { cmd: "tail notifications.log", out: "1000+ events/day · email, whatsapp, in-app" },
  { cmd: "open caseintel.in", out: "live · used by practicing advocates" },
  { cmd: "./deploy.sh ec2", out: "shipped in under 15 min (was hours)" },
  { cmd: "eval court-order-extractor", out: "valid JSON 17.9% → 98.7%" },
];

export function SplitChooser() {
  const { side, resolved, greeted, commit } = useSide();
  const reduceMotion = usePrefersReducedMotion();
  const [rawPhase, setPhase] = useState<Phase>("waiting");
  const [chosenSide, setChosenSide] = useState<Side | null>(null);
  const [hover, setHover] = useState<Side | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const light = useRef<HTMLDivElement>(null);
  const line = useRef<HTMLDivElement>(null);
  const cut = useRef({ a: 0, b: 0 });
  const target = useRef<{ a: number; b: number }>({ a: 0, b: 0 });
  const chosen = useRef<Side | null>(null);
  const phaseRef = useRef<Phase>("waiting");

  // The greeting finishing is what moves "waiting" to "enter".
  const phase: Phase = rawPhase === "waiting" && greeted ? "enter" : rawPhase;
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  // Only a visit with no side yet ever sees the chooser.
  const needed = resolved && (side === null || phase === "leaving");
  const visible = needed && phase !== "gone";
  const running = visible && phase !== "waiting";

  useEffect(() => {
    if (phase === "enter") target.current = TARGET.rest;
  }, [phase]);

  // While open: no page scroll behind it, and the page is inert.
  useEffect(() => {
    if (!running) return;
    const html = document.documentElement;
    const page = document.getElementById("portfolio-page");
    html.classList.add("side-locked");
    if (page) page.inert = true;
    root.current?.focus({ preventScroll: true });
    return () => {
      html.classList.remove("side-locked");
      if (page) page.inert = false;
    };
  }, [running]);

  useEffect(() => {
    if (!hover || chosen.current) return;
    target.current = TARGET[hover];
  }, [hover]);

  // The frame loop: ease the cut, clip the light half, place the hairline.
  // Nothing runs while the greeting is still on screen above it.
  useEffect(() => {
    if (!running) return;
    let last = performance.now();
    let raf = 0;
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const c = cut.current;
      const t = target.current;
      const tau = reduceMotion ? 0 : chosen.current ? 0.16 : 0.14;
      const k = tau === 0 ? 1 : 1 - Math.exp(-dt / tau);
      c.a += (t.a - c.a) * k;
      c.b += (t.b - c.b) * k;
      if (light.current) {
        light.current.style.clipPath = `polygon(0% 0%, 100% 0%, 100% ${c.a}%, 0% ${c.b}%)`;
      }
      if (line.current) {
        line.current.style.clipPath = `polygon(0% ${c.b}%, 100% ${c.a}%, 100% calc(${c.a}% + 1.5px), 0% calc(${c.b}% + 1.5px))`;
      }
      root.current?.style.setProperty("--cut-mid", `${(c.a + c.b) / 2}%`);
      root.current?.style.setProperty(
        "--cut-angle",
        `${Math.atan2(((c.a - c.b) / 100) * window.innerHeight, window.innerWidth)}rad`,
      );
      if (!chosen.current && phaseRef.current === "enter" && Math.abs(t.a - c.a) < 0.3) {
        phaseRef.current = "idle";
        setPhase("idle");
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [running, reduceMotion]);

  const choose = (next: Side) => {
    if (chosen.current || phase === "waiting") return;
    chosen.current = next;
    setChosenSide(next);
    target.current = next === "work" ? TARGET.takeWork : TARGET.takeLife;
    setHover(next);
    // The chosen colour fills the screen first; the side commits under it and
    // the overlay fades to reveal the page.
    window.setTimeout(() => {
      commit(next);
      setPhase("leaving");
    }, reduceMotion ? 0 : 640);
  };

  const sideAt = (x: number, y: number): Side => {
    const c = cut.current;
    const yl = (c.b / 100) * window.innerHeight;
    const yr = (c.a / 100) * window.innerHeight;
    return y < yl + ((yr - yl) * x) / window.innerWidth ? "work" : "life";
  };

  const onPointerMove = (e: PointerEvent) => {
    if (e.pointerType === "touch" || chosen.current) return;
    setHover(sideAt(e.clientX, e.clientY));
  };

  const onKey = (e: KeyboardEvent) => {
    if (chosen.current) return;
    const key = e.key.toLowerCase();
    if (key === "arrowup" || key === "arrowleft") {
      e.preventDefault();
      setHover("work");
    } else if (key === "arrowdown" || key === "arrowright") {
      e.preventDefault();
      setHover("life");
    } else if (key === "w") choose("work");
    else if (key === "o") choose("life");
    else if (key === "enter" && hover) {
      e.preventDefault();
      choose(hover);
    } else if (key === "escape") choose("work");
  };

  if (!visible) return null;

  const cls = [
    "split-chooser",
    `is-${phase}`,
    hover ? `hover-${hover}` : "",
    chosenSide ? `chose-${chosenSide}` : "",
  ].join(" ");

  return (
    <div
      ref={root}
      className={cls}
      role="dialog"
      aria-modal="true"
      aria-label="Choose a side of the site"
      tabIndex={-1}
      onPointerMove={onPointerMove}
      onPointerLeave={() => !chosen.current && setHover(null)}
      onClick={(e) => choose(sideAt(e.clientX, e.clientY))}
      onKeyDown={onKey}
      onTransitionEnd={(e) => {
        if (e.target === e.currentTarget && phase === "leaving") setPhase("gone");
      }}
    >
      <div className="split-dark">
        <Image
          src="/media/travel/jispa-stargazing.jpg"
          alt=""
          fill
          sizes="100vw"
          className="split-photo"
          priority
        />
      </div>
      <div ref={light} className="split-light" style={{ clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)" }} />
      <div ref={line} className="split-line" aria-hidden />

      <button
        type="button"
        className="split-option split-option-work"
        onFocus={() => setHover("work")}
        onClick={(e) => {
          e.stopPropagation();
          choose("work");
        }}
      >
        <span className="split-eyebrow">{sides.work.eyebrow}</span>
        <span className="split-title">Work<i aria-hidden>.</i></span>
        <span className="split-blurb">{sides.work.blurb} <span aria-hidden>↗</span></span>
      </button>

      <button
        type="button"
        className="split-option split-option-life"
        onFocus={() => setHover("life")}
        onClick={(e) => {
          e.stopPropagation();
          choose("life");
        }}
      >
        <span className="split-eyebrow">{sides.life.eyebrow}</span>
        <span className="split-title">Off the <em>clock.</em></span>
        <span className="split-blurb"><span aria-hidden>↙</span> {sides.life.blurb}</span>
      </button>

      <div className="split-terminal" aria-hidden>
        <div className="split-terminal-bar"><i /><i /><i /><span>~/work</span></div>
        <ol>
          {TERMINAL.map((row, i) => (
            <li key={row.cmd} style={{ "--i": i, "--n": row.cmd.length + 2 } as CSSProperties}>
              <span className="split-terminal-cmd"><b>$</b> {row.cmd}</span>
              <span className="split-terminal-out">{row.out}</span>
            </li>
          ))}
        </ol>
        <span className="split-terminal-caret" />
      </div>

      <span className="split-signature" aria-hidden>BHAGATH SAMALLA</span>
    </div>
  );
}
