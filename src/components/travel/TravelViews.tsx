"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type FocusEvent, type KeyboardEvent, type RefObject } from "react";
import type { Journey, JourneyMedia } from "@/content/site";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

const number = (value: number) => String(value).padStart(2, "0");
const posterFor = (media: JourneyMedia) => media.poster ?? media.src;
const coordinates = (media: JourneyMedia, region: string) => media.coords ? `${media.coords.lat.toFixed(3)}° N / ${media.coords.lon.toFixed(3)}° E` : region;

function usePageVisible() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const update = () => setVisible(!document.hidden);
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);
  return visible;
}

function useInView(ref: RefObject<HTMLElement | null>, ratio = .15) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[entries.length - 1];
      setVisible(entry.isIntersecting && entry.intersectionRatio >= ratio);
    }, { threshold: [0, ratio] });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, ratio]);
  return visible;
}

// Display the supplied file directly. The filmstrip never crops, filters, resizes or
// re-encodes an asset; a visible video decodes only while it is being viewed.
type PlaybackMedia = JourneyMedia & { sources?: { src: string; type: string }[] };
function OriginalMedia({ media, suspended = false, large = false, decorative = false }: { media: PlaybackMedia; suspended?: boolean; large?: boolean; decorative?: boolean }) {
  const frame = useRef<HTMLSpanElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  // Every visible clip plays, including the partially revealed edge cards.
  const inView = useInView(frame, 0);
  const pageVisible = usePageVisible();
  const reduceMotion = usePrefersReducedMotion();
  const playing = media.kind === "video" && !suspended && inView && pageVisible && !reduceMotion;
  const [armed, setArmed] = useState(large);
  const [hasFrame, setHasFrame] = useState(false);
  const [compatibleOnly, setCompatibleOnly] = useState(false);
  const sources = useMemo(() => compatibleOnly
    ? media.sources?.filter((source) => source.src === media.src)
    : media.sources, [compatibleOnly, media.sources, media.src]);
  const loadedFor = useRef("");

  // Latch the first playback request without an extra effect after paint.
  if (playing && !armed) setArmed(true);

  useEffect(() => {
    const element = video.current;
    if (!element) return;
    const sourceKey = `${media.src}:${compatibleOnly}`;
    if (armed && loadedFor.current !== sourceKey) {
      loadedFor.current = sourceKey;
      if (sources?.length) element.load();
    }
    if (playing && armed) element.play().catch(() => {});
    else element.pause();
    return () => element.pause();
  }, [playing, armed, media.src, sources, compatibleOnly]);

  return (
    <span className="travel-original-media" ref={frame}>
      <Image src={posterFor(media)} alt={decorative || media.kind === "video" ? "" : media.alt} fill sizes={large ? "96vw" : "(min-width: 1000px) 65vw, 100vw"} unoptimized draggable={false} className="travel-original-image" />
      {media.kind === "video" && (
        <video ref={video} src={armed && !sources?.length ? media.src : undefined} aria-label={decorative ? undefined : media.alt} aria-hidden={decorative || undefined} muted playsInline loop autoPlay={playing} controls={large} preload={playing ? "auto" : "none"} onLoadedData={() => setHasFrame(true)} onPlaying={() => setHasFrame(true)} onError={() => {
          if (!compatibleOnly && media.sources?.some((source) => source.src !== media.src)) {
            setHasFrame(false);
            setCompatibleOnly(true);
          }
        }} className={`travel-original-video ${hasFrame ? "has-frame" : ""}`}>
          {armed && sources?.map((source) => <source key={source.src} src={source.src} type={source.type} />)}
        </video>
      )}
    </span>
  );
}

type ViewProps = { album: JourneyMedia[]; journey: Journey; active: number; automatic: boolean; suspended: boolean; onActive: (index: number) => void; onOpen: (index: number) => void; onManual: () => void };

function Frame({ item, index, region, suspended, onOpen, copy = 0, className = "" }: { item: JourneyMedia; index: number; region: string; suspended: boolean; onOpen: (index: number) => void; copy?: number; className?: string }) {
  return (
    <figure className={`travel-album-frame ${className}`} data-frame={index} data-copy={copy} style={{ "--media-ratio": item.width / item.height } as CSSProperties} aria-label={copy ? undefined : `${index + 1}: ${item.caption}`}>
      <button type="button" className="travel-frame-open" tabIndex={copy ? -1 : undefined} aria-label={`Enlarge ${item.caption}, frame ${index + 1}`} onClick={() => onOpen(index)}>
        <span className="travel-card-visual">
          <OriginalMedia media={item} suspended={suspended} decorative={copy > 0} />
          <span className="travel-frame-label">{number(index + 1)} / {item.kind === "video" ? "FILM" : "PHOTO"}</span>
          <span className="travel-frame-expand" aria-hidden>↗</span>
        </span>
      </button>
      <figcaption><strong>{item.caption}</strong><span>{coordinates(item, region)}</span></figcaption>
    </figure>
  );
}

function Filmstrip({ album, journey, active, automatic, suspended, onActive, onOpen, onManual }: ViewProps) {
  const track = useRef<HTMLDivElement>(null);
  const width = useRef(0);
  const [copies, setCopies] = useState(2);
  const visible = useInView(track);
  const pageVisible = usePageVisible();
  const reduceMotion = usePrefersReducedMotion();
  const running = automatic && visible && pageVisible && !suspended && !reduceMotion;

  useEffect(() => {
    const element = track.current;
    if (!element) return;
    const measure = () => {
      const cycle = element.firstElementChild as HTMLElement | null;
      if (!cycle) return;
      const measured = cycle.offsetWidth + (Number.parseFloat(getComputedStyle(element).columnGap) || 0);
      if (measured <= 0) return;
      if (width.current > 0 && measured !== width.current) element.scrollLeft = element.scrollLeft / width.current * measured;
      width.current = measured;
      setCopies(Math.max(2, Math.ceil(element.clientWidth / measured) + 1));
    };
    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(element);
    if (element.firstElementChild) resize.observe(element.firstElementChild);
    return () => resize.disconnect();
  }, []);

  useEffect(() => {
    const element = track.current;
    if (!element) return;
    const ratios = new Map<Element, number>();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => ratios.set(entry.target, entry.intersectionRatio));
      const center = element.getBoundingClientRect().left + element.clientWidth / 2;
      let best = active;
      let distance = Infinity;
      ratios.forEach((ratio, card) => {
        if (ratio <= .05) return;
        const box = card.getBoundingClientRect();
        const candidate = Math.abs(box.left + box.width / 2 - center);
        if (candidate < distance) { best = Number((card as HTMLElement).dataset.frame); distance = candidate; }
      });
      if (distance < Infinity) onActive(best);
    }, { root: element, threshold: [0, .15, .5, .9, 1] });
    element.querySelectorAll(".travel-album-frame").forEach((card) => observer.observe(card));
    return () => observer.disconnect();
    // Selection is observer-driven, not a per-frame React state update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [copies, onActive]);

  useEffect(() => {
    const element = track.current;
    if (!element || !running) return;
    let frame = 0;
    let previous = 0;
    let position = element.scrollLeft;
    let cycleWidth = width.current;
    const tick = (time: number) => {
      if (previous) {
        if (cycleWidth > 0 && width.current !== cycleWidth) position = position / cycleWidth * width.current;
        cycleWidth = width.current;
        position += Math.min(time - previous, 64) * .05;
        if (cycleWidth > 0 && position >= cycleWidth) position %= cycleWidth;
        element.scrollLeft = position;
      }
      previous = time;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running]);

  return (
    <div ref={track} className="travel-reel-track" role="region" aria-label={`${journey.title} continuous filmstrip`} onPointerDown={onManual} onWheel={(event) => { if (Math.abs(event.deltaX) > Math.abs(event.deltaY) || event.shiftKey) onManual(); }}>
      {Array.from({ length: reduceMotion ? 1 : copies }, (_, copy) => <div className="travel-reel-cycle" key={copy} aria-hidden={copy > 0 || undefined}>{album.map((item, index) => <Frame key={item.src} item={item} index={index} region={journey.region} suspended={suspended} copy={copy} onOpen={onOpen} className={active === index ? "is-active" : ""} />)}</div>)}
    </div>
  );
}

function TravelLightbox({ album, journey, index, onChange, onClose }: { album: JourneyMedia[]; journey: Journey; index: number; onChange: (index: number) => void; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const item = album[index];
  useEffect(() => {
    const element = dialog.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element?.showModal();
    return () => { element?.close(); document.body.style.overflow = previousOverflow; };
  }, []);
  const step = (delta: number) => onChange((index + delta + album.length) % album.length);
  const onKey = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.target instanceof HTMLVideoElement) return;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); event.stopPropagation(); step(event.key === "ArrowRight" ? 1 : -1); }
  };
  return (
    <dialog ref={dialog} className="travel-journal-dialog" aria-label={`${journey.title}: ${item.caption}`} onKeyDown={onKey} onCancel={(event) => { event.preventDefault(); onClose(); }}>
      <div className="travel-journal-dialog-bar"><span>{journey.title} / {item.caption}</span><button type="button" onClick={onClose} aria-label="Close travel photo">Close <span aria-hidden>×</span></button></div>
      <div className="travel-journal-dialog-stage"><OriginalMedia key={item.src} media={item} large /></div>
      <div className="travel-journal-dialog-pager"><button type="button" onClick={() => step(-1)} aria-label="Previous enlarged travel frame">← Previous</button><span>{number(index + 1)} / {number(album.length)}</span><button type="button" onClick={() => step(1)} aria-label="Next enlarged travel frame">Next →</button></div>
    </dialog>
  );
}

export function TravelAlbum({ journey, album }: { journey: Journey; album: JourneyMedia[] }) {
  const [active, setActive] = useState(0);
  const [automatic, setAutomatic] = useState(true);
  const [focusPaused, setFocusPaused] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const reduceMotion = usePrefersReducedMotion();
  const onActive = useCallback((index: number) => setActive(index), []);
  const onOpen = useCallback((index: number) => setExpanded(index), []);
  const onManual = useCallback(() => setAutomatic(false), []);
  const select = (index: number) => {
    const next = (index + album.length) % album.length;
    setAutomatic(false);
    setActive(next);
    root.current?.querySelector<HTMLElement>(`[data-copy="0"][data-frame="${next}"]`)?.scrollIntoView({ block: "nearest", inline: "center", behavior: reduceMotion ? "instant" : "smooth" });
  };
  const onKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (expanded !== null || event.target instanceof HTMLVideoElement) return;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); select(active + (event.key === "ArrowRight" ? 1 : -1)); }
  };
  const onFocus = (event: FocusEvent<HTMLElement>) => {
    if (event.target instanceof HTMLElement && event.target.matches(":focus-visible") && !event.currentTarget.contains(event.relatedTarget as Node | null)) setFocusPaused(true);
  };
  const onBlur = (event: FocusEvent<HTMLElement>) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocusPaused(false); };
  const props: ViewProps = { album, journey, active, automatic: automatic && !focusPaused, suspended: expanded !== null, onActive, onOpen, onManual };
  return (
    <div ref={root} id="travel-album" className="travel-album travel-layout-filmstrip" onKeyDown={onKey} onFocusCapture={onFocus} onBlurCapture={onBlur}>
      <div className="travel-reel-caption-bar"><div><strong>{journey.title}</strong><span>{journey.region} / {journey.when}</span></div><span>{number(album.length)} FRAMES / ORIGINAL MEDIA</span></div>
      <Filmstrip {...props} />
      <div className="travel-reel-controls">
        <div className="travel-reel-playback"><button type="button" onClick={() => { setAutomatic(!automatic || focusPaused); setFocusPaused(false); }} aria-label={!automatic || focusPaused ? "Resume travel carousel" : "Pause travel carousel"}><span aria-hidden>{!automatic || focusPaused ? "▶" : "Ⅱ"}</span>{!automatic || focusPaused ? "Play" : "Pause"} the reel</button><span>{reduceMotion ? "MANUAL EXPLORATION" : "SCROLL TO EXPLORE / OPEN A FRAME TO LINGER"}</span></div>
        <div className="travel-reel-counter"><span>{number(active + 1)} <i>/ {number(album.length)}</i></span><button type="button" onClick={() => select(active - 1)} aria-label="Previous travel frame">←</button><button type="button" onClick={() => select(active + 1)} aria-label="Next travel frame">→</button></div>
      </div>
      <div className="travel-reel-index" role="group" aria-label={`${journey.title} frame index`}>{album.map((item, index) => <button key={item.src} type="button" onClick={() => select(index)} aria-label={`Show ${item.caption}, frame ${index + 1}`} aria-pressed={index === active}>{number(index + 1)}</button>)}</div>
      {expanded !== null && <TravelLightbox album={album} journey={journey} index={expanded} onChange={setExpanded} onClose={() => setExpanded(null)} />}
    </div>
  );
}
