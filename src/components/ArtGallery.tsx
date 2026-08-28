"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { art, type ArtPiece } from "@/content/site";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

// A plain justified gallery. The work carries this section, so the only motion
// is a one-shot fade-in as rows arrive and a small hover lift.
//
// Justified rows rather than a uniform grid because these pieces have genuinely
// different proportions (a 923x1389 canvas next to a 1500x1710 sketchbook page),
// and a grid would have to crop to hide that. Nothing here is ever cropped:
// each row picks a height that makes its items' natural widths add up to the
// container, so every piece shows whole and the variation becomes the
// composition.

const ROW_HEIGHT = "clamp(220px, 26vh, 380px)";
const GAP = "clamp(10px, 1.2vw, 20px)";
const STAGGER_MS = 40;

// Below this, a portrait piece in a two-up row gets too small to read and the
// row drops to a single item.
const MIN_ITEM_VW = 0.4;

type Row = { items: ArtPiece[]; stretch: boolean };

// Greedy justification: accumulate items until their combined aspect ratio
// would make the row shorter than the target height, then close the row.
// `stretch` is false for a trailing row so it keeps the natural height instead
// of blowing three items up to fill a width meant for five.
function buildRows(pieces: ArtPiece[], containerW: number, target: number, gap: number, maxPerRow: number): Row[] {
  const rows: Row[] = [];
  let current: ArtPiece[] = [];
  let ratioSum = 0;

  for (const piece of pieces) {
    const ratio = piece.width / piece.height;
    current.push(piece);
    ratioSum += ratio;
    const gaps = gap * (current.length - 1);
    const height = (containerW - gaps) / ratioSum;
    if (height <= target || current.length >= maxPerRow) {
      rows.push({ items: current, stretch: true });
      current = [];
      ratioSum = 0;
    }
  }
  if (current.length) rows.push({ items: current, stretch: false });
  return rows;
}

export function ArtGallery() {
  const paintings = art.pieces.filter((p) => p.medium === "painting");
  const sketches = art.pieces.filter((p) => p.medium === "sketch");
  const [lightbox, setLightbox] = useState<number | null>(null);
  // One flat sequence across both groups, so the lightbox arrows run from the
  // first painting straight through to the last sketch.
  const sequence = [...paintings, ...sketches];

  return (
    <>
      <ArtGroup
        heading="Paintings"
        pieces={paintings}
        offset={0}
        priorityRow
        onOpen={setLightbox}
      />
      <ArtGroup
        heading="Sketches"
        pieces={sketches}
        offset={paintings.length}
        onOpen={setLightbox}
      />
      {lightbox !== null && (
        <Lightbox
          pieces={sequence}
          index={lightbox}
          onIndex={setLightbox}
          onClose={() => setLightbox(null)}
        />
      )}
    </>
  );
}

function ArtGroup({
  heading,
  pieces,
  offset,
  priorityRow = false,
  onOpen,
}: {
  heading: string;
  pieces: ArtPiece[];
  offset: number;
  priorityRow?: boolean;
  onOpen: (index: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => {
      setWidth(el.clientWidth);
      setNarrow(window.innerWidth < 640);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Resolve the CSS clamps once so the row maths works in real pixels.
  const gap = width ? clampPx(10, 0.012 * window.innerWidth, 20) : 14;
  const target = width
    ? clampPx(220, 0.26 * window.innerHeight, 380)
    : 280;
  // Two per row minimum on mobile, dropping to one only when a portrait item
  // would fall under ~40vw.
  const maxPerRow = narrow
    ? (width - gap) / 2 >= window.innerWidth * MIN_ITEM_VW
      ? 2
      : 1
    : 5;

  const rows = width ? buildRows(pieces, width, target, gap, maxPerRow) : [];

  return (
    <section className="mt-14 first:mt-12">
      <h3 className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink/45">
        {heading}
        <span className="ml-2 text-ink/25">{pieces.length}</span>
      </h3>

      <div ref={containerRef} className="mt-4" style={{ display: "grid", gap: GAP }}>
        {rows.map((row, rowIndex) => {
          const ratioSum = row.items.reduce((s, p) => s + p.width / p.height, 0);
          const gaps = gap * (row.items.length - 1);
          // A stretched row solves for the height that exactly fills the
          // container; a trailing row just uses the target height and stops
          // wherever it stops.
          const height = row.stretch ? (width - gaps) / ratioSum : target;

          return (
            <div key={rowIndex} style={{ display: "flex", gap: GAP }}>
              {row.items.map((piece, i) => {
                const seqIndex =
                  offset +
                  rows.slice(0, rowIndex).reduce((s, r) => s + r.items.length, 0) +
                  i;
                return (
                  <ArtTile
                    key={piece.src}
                    piece={piece}
                    height={height}
                    delayMs={i * STAGGER_MS}
                    priority={priorityRow && rowIndex === 0}
                    onOpen={() => onOpen(seqIndex)}
                  />
                );
              })}
            </div>
          );
        })}
        {/* Pre-measurement pass: the rows above need a real container width,
            so the first paint renders nothing rather than a wrong layout that
            then reflows. One frame, and the section has a reserved height. */}
        {!width && <div style={{ height: ROW_HEIGHT }} />}
      </div>
    </section>
  );
}

function clampPx(min: number, preferred: number, max: number) {
  return Math.min(Math.max(min, preferred), max);
}

function ArtTile({
  piece,
  height,
  delayMs,
  priority,
  onOpen,
}: {
  piece: ArtPiece;
  height: number;
  delayMs: number;
  priority: boolean;
  onOpen: () => void;
}) {
  const reduceMotion = usePrefersReducedMotion();
  const ref = useRef<HTMLButtonElement>(null);
  const [entered, setEntered] = useState(false);
  // Derived rather than an effect that immediately setStates: under reduced
  // motion there is no entry animation at all, so the tile is simply shown.
  const shown = reduceMotion || entered;

  useEffect(() => {
    if (reduceMotion) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        // Once shown, stay shown. This is an arrival, not a scroll effect:
        // tying it to scroll position would make the section flicker on the
        // way back up, which is the opposite of what it is for.
        if (entry.isIntersecting) {
          setEntered(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduceMotion]);

  const width = height * (piece.width / piece.height);

  return (
    <button
      ref={ref}
      type="button"
      onClick={onOpen}
      aria-label={`View ${piece.caption} full size`}
      className="group relative block shrink-0 cursor-zoom-in overflow-hidden bg-ink/5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jacket focus-visible:ring-offset-2 focus-visible:ring-offset-mist"
      style={{
        height,
        width,
        opacity: shown ? 1 : 0,
        transform: shown ? "translateY(0)" : "translateY(12px)",
        transition: reduceMotion
          ? undefined
          : `opacity 700ms var(--ease-site) ${delayMs}ms, transform 700ms var(--ease-site) ${delayMs}ms`,
      }}
    >
      <Image
        src={piece.src}
        alt={piece.alt}
        fill
        // Rows are justified to the container, so a tile's real width tracks
        // its aspect ratio at the row height rather than a fixed column.
        // These cover the observed range: up to ~46vw for a wide piece in a
        // two-up row, down to ~20vw for a narrow one in a five-up row.
        sizes="(min-width: 1024px) 30vw, (min-width: 640px) 44vw, 48vw"
        priority={priority}
        loading={priority ? undefined : "lazy"}
        className={
          reduceMotion
            ? "object-cover"
            : "object-cover transition-transform duration-500 ease-[var(--ease-site)] group-hover:scale-[1.02]"
        }
      />
      {/* No caption plate over the artwork. The tiles carry their own titles
          nowhere on screen by design: the name is on the button as its
          accessible name, and it is shown in full in the lightbox, so nothing
          is lost by letting the pictures sit unadorned in the grid. */}
    </button>
  );
}

function Lightbox({
  pieces,
  index,
  onIndex,
  onClose,
}: {
  pieces: ArtPiece[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const piece = pieces[index];
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const restoreTo = useRef<HTMLElement | null>(null);

  const go = useCallback(
    (delta: number) => onIndex((index + delta + pieces.length) % pieces.length),
    [index, pieces.length, onIndex],
  );

  // Remember what opened this so focus can go back to exactly that tile.
  useEffect(() => {
    restoreTo.current = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    return () => restoreTo.current?.focus();
  }, []);

  // Scroll lock that Lenis can live with. overflow:hidden on html would stop
  // Lenis dead and is explicitly off the table site-wide, so this pins the
  // body at its current offset instead and puts it back on close. Lenis keeps
  // running against a document that simply is not moving.
  useEffect(() => {
    const y = window.scrollY;
    const body = document.body;
    const prev = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
    };
    body.style.position = "fixed";
    body.style.top = `-${y}px`;
    body.style.left = "0";
    body.style.right = "0";
    return () => {
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.left = prev.left;
      body.style.right = prev.right;
      window.scrollTo(0, y);
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        go(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(-1);
      } else if (e.key === "Tab") {
        // Focus trap: only three controls in here, so cycling them by hand is
        // simpler and more predictable than a generic tabbable query.
        const focusables = dialogRef.current?.querySelectorAll<HTMLElement>("button");
        if (!focusables || focusables.length === 0) return;
        const list = Array.from(focusables);
        const first = list[0];
        const last = list[list.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, onClose]);

  // Swipe between pieces on touch.
  const touchX = useRef(0);
  const onTouchStart = (e: React.TouchEvent) => {
    touchX.current = e.touches[0]?.clientX ?? 0;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const dx = (e.changedTouches[0]?.clientX ?? 0) - touchX.current;
    if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
  };

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`${piece.caption}, ${index + 1} of ${pieces.length}`}
      onClick={onClose}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-ink/95 p-6 sm:p-10"
    >
      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 rounded-full px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-mist/70 hover:text-mist focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jacket"
      >
        Esc
      </button>

      <div
        // The image itself is not a click-to-close target, or every attempt to
        // look closely would dismiss it.
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-full w-full max-w-5xl flex-col items-center gap-4"
      >
        <div
          className="relative w-full"
          style={{
            aspectRatio: `${piece.width} / ${piece.height}`,
            maxHeight: "78vh",
          }}
        >
          <Image
            src={piece.src}
            alt={piece.alt}
            fill
            sizes="(min-width: 1024px) 70vw, 90vw"
            className="object-contain"
          />
        </div>
        <figcaption className="flex items-baseline gap-3 font-mono text-[11px] uppercase tracking-wider text-mist/70">
          <span>{piece.caption}</span>
          <span className="text-mist/35">{piece.medium}</span>
          <span className="text-mist/35">
            {index + 1} / {pieces.length}
          </span>
        </figcaption>
      </div>

      <div className="absolute inset-x-0 bottom-6 flex justify-center gap-6">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            go(-1);
          }}
          aria-label="Previous piece"
          className="rounded-full px-4 py-2 font-mono text-[11px] uppercase tracking-wider text-mist/70 hover:text-mist focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jacket"
        >
          ← Prev
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            go(1);
          }}
          aria-label="Next piece"
          className="rounded-full px-4 py-2 font-mono text-[11px] uppercase tracking-wider text-mist/70 hover:text-mist focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jacket"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
