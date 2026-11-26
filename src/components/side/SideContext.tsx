"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { sides, type Side } from "@/content/site";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import "./split-chooser.css";

// The site is two profiles behind one door: Work (the professional side) and
// Off the Clock (everything else). The opening greeting hands over to the
// diagonal chooser (SplitChooser), and the choice decides which sections
// render. Until a side is chosen, both render, so the server HTML, no-JS
// visitors and crawlers still get the whole site.
//
// `?side=work` or `?side=life` in the URL skips the chooser, so a link sent to
// a recruiter can open straight on Work. A client-side remount in the same
// visit (back from /resume) reuses the side from sessionStorage and skips both
// the greeting and the chooser.

const STORAGE_KEY = "portfolio-side";
const isSide = (v: unknown): v is Side => v === "work" || v === "life";

// Module scope on purpose: it survives a client-side remount of the page but
// not a full reload, which is exactly when the greeting should replay.
let greetedThisLoad = false;

type SideContextValue = {
  side: Side | null;
  /** The mount effect has read the URL and storage. */
  resolved: boolean;
  greeted: boolean;
  markGreeted: () => void;
  /** Commit a side from the chooser (no wipe, the chooser animates itself). */
  commit: (side: Side) => void;
  /** Switch sides from the nav, behind a diagonal wipe. */
  switchTo: (side: Side) => void;
};

const SideContext = createContext<SideContextValue | null>(null);

export function useSide() {
  const ctx = useContext(SideContext);
  if (!ctx) throw new Error("useSide must be used inside <SideProvider>");
  return ctx;
}

function persist(side: Side) {
  try {
    sessionStorage.setItem(STORAGE_KEY, side);
  } catch {}
  const url = new URL(window.location.href);
  url.searchParams.set("side", side);
  window.history.replaceState(window.history.state, "", url);
}

// What the visit starts with, read from the URL and storage. Returned as one
// primitive so useSyncExternalStore can compare snapshots; the server snapshot
// is undefined, so hydration matches the server HTML and the real value lands
// in the render right after.
function readStart(): string {
  const param = new URLSearchParams(window.location.search).get("side");
  let stored: string | null = null;
  try {
    stored = sessionStorage.getItem(STORAGE_KEY);
  } catch {}
  const side = isSide(param) ? param : greetedThisLoad && isSide(stored) ? stored : "";
  return `${side}|${greetedThisLoad ? 1 : 0}`;
}
const noSubscribe = () => () => {};

export function SideProvider({ children }: { children: ReactNode }) {
  const start = useSyncExternalStore(noSubscribe, readStart, () => undefined);
  const resolved = start !== undefined;
  const [startSide, startGreeted] = (start ?? "|0").split("|");
  const [picked, setSide] = useState<Side | null>(null);
  const side: Side | null = picked ?? (isSide(startSide) ? startSide : null);
  const [greetedNow, setGreeted] = useState(false);
  const greeted = greetedNow || startGreeted === "1";
  const wipeRef = useRef<HTMLDivElement>(null);
  const [wipeTarget, setWipeTarget] = useState<Side>("work");
  const busy = useRef(false);
  const reduceMotion = usePrefersReducedMotion();

  const markGreeted = useCallback(() => {
    greetedThisLoad = true;
    setGreeted(true);
  }, []);

  const commit = (next: Side) => {
    setSide(next);
    persist(next);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const switchTo = (next: Side) => {
      if (busy.current || next === side) return;
      const el = wipeRef.current;
      if (!el || reduceMotion) {
        commit(next);
        return;
      }
      busy.current = true;
      setWipeTarget(next);
      const ease = "cubic-bezier(0.16, 1, 0.3, 1)";
      // A band with a slanted leading edge sweeps right to left across the
      // screen, the same diagonal as the chooser. Its leading edge runs from
      // (x1, top) to (x2, bottom); x2 = x1 - 40% keeps the slant constant.
      const band = (l1: number, l2: number, r1: number, r2: number) =>
        `polygon(${l1}% 0%, ${r1}% 0%, ${r2}% 100%, ${l2}% 100%)`;
      el.style.visibility = "visible";
      const cover = el.animate(
        [{ clipPath: band(180, 140, 180, 140) }, { clipPath: band(0, -40, 180, 140) }],
        { duration: 650, easing: ease, fill: "forwards" },
      );
      cover.onfinish = () => {
        commit(next);
        // Two frames so the new side has painted under the band before it
        // leaves.
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            const leave = el.animate(
              [{ clipPath: band(0, -40, 180, 140) }, { clipPath: band(0, -40, 0, -40) }],
              { duration: 700, delay: 120, easing: ease, fill: "forwards" },
            );
            leave.onfinish = () => {
              el.style.visibility = "hidden";
              cover.cancel();
              leave.cancel();
              busy.current = false;
            };
          }),
        );
      };
  };

  const value = { side, resolved, greeted, markGreeted, commit, switchTo };

  const target = sides[wipeTarget];
  return (
    <SideContext.Provider value={value}>
      {children}
      <div
        ref={wipeRef}
        aria-hidden
        className={`side-wipe side-wipe-${wipeTarget}`}
        style={{ visibility: "hidden", clipPath: "polygon(180% 0%, 180% 0%, 140% 100%, 140% 100%)" }}
      >
        <span className="side-wipe-eyebrow">{target.eyebrow}</span>
        <span className="side-wipe-label">{wipeTarget === "life" ? <>Off the <em>clock.</em></> : <>Work<i>.</i></>}</span>
      </div>
    </SideContext.Provider>
  );
}

/** Renders its children only on its own side (or before a side is chosen). */
export function SidePane({ side, children }: { side: Side; children: ReactNode }) {
  const ctx = useSide();
  if (ctx.side && ctx.side !== side) return null;
  return <>{children}</>;
}
