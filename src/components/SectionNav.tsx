"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type FocusEvent,
  type MouseEvent,
} from "react";
import { pageSections } from "@/content/site";
import { useActiveSection } from "@/hooks/useActiveSection";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { focusSection, useSiteScroll } from "@/hooks/useSiteScroll";
import { EASE } from "@/lib/motion";
import { introSplashDelay } from "./IntroSplash";

const SECTION_IDS = pageSections.map((s) => s.id);

// The same glass as PersistentNav, so all of the site's fixed chrome reads as
// one family. It is also what keeps the index legible over the Art section,
// the one light passage on the page, where bare hairlines would vanish.
const GLASS = "border border-mist/15 backdrop-blur-md";

// Grace period before hover-revealed labels close, so crossing the few pixels
// between a label and its tick doesn't flicker them shut.
const HOVER_CLOSE_MS = 160;

type Jump = (e: MouseEvent<HTMLAnchorElement>, id: string) => void;

const number = (i: number) => String(i + 1).padStart(2, "0");

// A persistent index of the page. Two layouts, one mounted per breakpoint by
// CSS alone:
//
//  - lg and up, a slim rail of ticks on the right edge. From 1024px every
//    section keeps at least a 64px side gutter (lg:px-16, or a narrower centred
//    container), and the rail is 34px wide at 20px in, so it lives entirely in
//    that gutter and never sits over content, Travel's columns included.
//  - Below lg the gutter is 24 to 40px and there is no room for a rail that
//    doesn't cover something, so it collapses to one button in the bottom-right
//    corner that opens the same list upward.
//
// Both are real in-page links: without JS the hrefs still jump. With JS the
// jump goes through Lenis instead, so it moves like every other scroll here.
export function SectionNav() {
  const reduceMotion = usePrefersReducedMotion();
  const active = useActiveSection(SECTION_IDS);
  const scroll = useSiteScroll();
  // Read once per mount: whether this entrance has a splash to wait behind.
  const [delay] = useState(introSplashDelay);

  const jump: Jump = (e, id) => {
    // Modified clicks keep their native meaning: new tab, new window, copy.
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
      return;
    }
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    focusSection(target);
    scroll(target);
  };

  const shared = { active, jump, reduceMotion, delay };

  return (
    <>
      <SectionRail {...shared} />
      <SectionMenu {...shared} />
    </>
  );
}

type LayoutProps = {
  active: string;
  jump: Jump;
  reduceMotion: boolean;
  delay: number;
};

function SectionRail({ active, jump, reduceMotion, delay }: LayoutProps) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  const show = () => {
    clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const hide = (after: number) => {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), after);
  };

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  // Labels revealed on hover or focus have to be dismissible without moving
  // either (WCAG 1.4.13).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const onBlur = (e: FocusEvent<HTMLOListElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) hide(0);
  };

  const fade = reduceMotion ? 0 : 0.35;

  return (
    <motion.nav
      aria-label="Sections"
      initial={reduceMotion ? false : { opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: reduceMotion ? 0 : 0.7,
        ease: EASE,
        delay: reduceMotion ? 0 : delay,
      }}
      // The fixed box is the full height of the viewport purely to centre the
      // list, so it must not catch a single click itself.
      className="pointer-events-none fixed inset-y-0 right-5 z-50 hidden items-center lg:flex print:hidden"
    >
      <ol
        // Touch has no hover: a tap on a tick should just go, not flash every
        // label open on the way.
        onPointerEnter={(e) => e.pointerType !== "touch" && show()}
        onPointerLeave={(e) => e.pointerType !== "touch" && hide(HOVER_CLOSE_MS)}
        onFocus={show}
        onBlur={onBlur}
        className={`pointer-events-auto relative flex flex-col rounded-full bg-ink/75 px-0.5 py-1.5 ${GLASS}`}
      >
        {/* One glass surface behind all eight labels, rather than a chip per
            label, so the open index reads as a single table of contents.
            Denser than the rail itself: over the light Art section an 80%
            panel lifts to about #383b3f and the stone numerals fall to 3:1. */}
        <AnimatePresence>
          {open && (
            <motion.div
              aria-hidden
              initial={{ opacity: 0, x: 6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 6 }}
              transition={{ duration: fade, ease: EASE }}
              className={`pointer-events-none absolute -bottom-px -top-px right-full mr-2 w-36 rounded-2xl bg-ink/95 ${GLASS}`}
            />
          )}
        </AnimatePresence>

        {pageSections.map((section, i) => {
          const isActive = section.id === active;
          return (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                aria-label={`Jump to ${section.label}`}
                aria-current={isActive ? "true" : undefined}
                onClick={(e) => jump(e, section.id)}
                className="group relative flex size-7 items-center justify-end rounded-full pr-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jacket-bright"
              >
                {/* Positioned outside the link's own box, so while hidden it
                    covers nothing on the page. Rows are flush, so while open
                    the labels form one continuous hover area with the rail. */}
                <motion.span
                  aria-hidden
                  initial={false}
                  animate={{ opacity: open ? 1 : 0, x: open ? 0 : 6 }}
                  transition={{
                    duration: fade,
                    ease: EASE,
                    delay: open && !reduceMotion ? i * 0.02 : 0,
                  }}
                  className={`absolute right-full top-0 flex h-full w-36 items-center justify-end gap-2 pr-5 font-mono text-[11px] uppercase tracking-wider ${
                    open ? "pointer-events-auto" : "pointer-events-none"
                  }`}
                >
                  <span className={isActive ? "text-jacket-bright" : "text-stone"}>
                    {number(i)}
                  </span>
                  <span
                    className={
                      isActive
                        ? "text-mist"
                        : "text-mist/70 transition-colors group-hover:text-mist"
                    }
                  >
                    {section.label}
                  </span>
                </motion.span>

                <Tick active={isActive} />
              </a>
            </li>
          );
        })}
      </ol>
    </motion.nav>
  );
}

function SectionMenu({ active, jump, reduceMotion, delay }: LayoutProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      if (rootRef.current?.contains(document.activeElement)) {
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const onBlur = (e: FocusEvent<HTMLElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
      setOpen(false);
    }
  };

  return (
    <motion.nav
      ref={rootRef}
      aria-label="Sections"
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduceMotion ? 0 : 0.7,
        ease: EASE,
        delay: reduceMotion ? 0 : delay,
      }}
      onBlur={onBlur}
      // Bottom-right, opposite BackToTop, so the list can open upward without
      // ever landing on it.
      className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-50 lg:hidden print:hidden"
    >
      {/* The button comes first in the DOM so Tab moves from it straight into
          the list it opened, even though the list is drawn above it. */}
      <button
        ref={buttonRef}
        type="button"
        aria-label="Sections"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((o) => !o)}
        className={`flex size-11 items-center justify-center rounded-full bg-ink/75 text-mist/85 transition-colors hover:text-mist focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jacket-bright ${GLASS}`}
      >
        <IndexGlyph open={open} reduceMotion={reduceMotion} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id={menuId}
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduceMotion ? 0 : 6 }}
            transition={{ duration: reduceMotion ? 0 : 0.35, ease: EASE }}
            // Lenis owns wheel scrolling on the page; this lets the list
            // scroll natively on a screen too short to show it whole.
            data-lenis-prevent
            className={`absolute bottom-full right-0 mb-3 max-h-[calc(100dvh-6rem)] w-52 overflow-y-auto rounded-2xl bg-ink/95 p-1 ${GLASS}`}
          >
            <ol>
              {pageSections.map((section, i) => {
                const isActive = section.id === active;
                return (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      aria-label={`Jump to ${section.label}`}
                      aria-current={isActive ? "true" : undefined}
                      onClick={(e) => {
                        setOpen(false);
                        jump(e, section.id);
                      }}
                      className="group flex items-center gap-3 rounded-xl px-3 py-2.5 font-mono text-[11px] uppercase tracking-wider focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-jacket-bright"
                    >
                      <span className={isActive ? "text-jacket-bright" : "text-stone"}>
                        {number(i)}
                      </span>
                      <span
                        className={`flex-1 ${isActive ? "text-mist" : "text-mist/75"}`}
                      >
                        {section.label}
                      </span>
                      <Tick active={isActive} />
                    </a>
                  </li>
                );
              })}
            </ol>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

// A hairline that grows toward its label. Scale rather than width, so the
// change never touches layout; the transition uses the same curve as the rest
// of the site, via the CSS-side --ease-site token.
function Tick({ active }: { active: boolean }) {
  return (
    <span
      aria-hidden
      className={`block h-px w-3.5 shrink-0 origin-right transition-[scale,background-color] duration-500 ease-site ${
        active
          ? "scale-x-100 bg-jacket-bright"
          : "scale-x-50 bg-mist/60 group-hover:scale-x-75 group-hover:bg-mist group-focus-visible:bg-mist"
      }`}
    />
  );
}

// The rail in miniature (short, long, short, the long one lit) so the button
// reads as "this page's index" rather than as a generic hamburger. Crossfades
// to a close mark while the list is open.
function IndexGlyph({
  open,
  reduceMotion,
}: {
  open: boolean;
  reduceMotion: boolean;
}) {
  const transition = { duration: reduceMotion ? 0 : 0.25, ease: EASE };
  return (
    <svg viewBox="0 0 18 18" width="18" height="18" fill="none" aria-hidden>
      <motion.g
        initial={false}
        animate={{ opacity: open ? 0 : 1 }}
        transition={transition}
        strokeLinecap="round"
        strokeWidth="1.5"
      >
        <path d="M9.5 5h5" stroke="currentColor" />
        <path d="M3.5 9h11" stroke="var(--jacket-bright)" />
        <path d="M9.5 13h5" stroke="currentColor" />
      </motion.g>
      <motion.g
        initial={false}
        animate={{ opacity: open ? 1 : 0 }}
        transition={transition}
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      >
        <path d="M5 5l8 8M13 5l-8 8" />
      </motion.g>
    </svg>
  );
}
