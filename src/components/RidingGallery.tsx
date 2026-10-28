"use client";

import Image from "next/image";
import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { riding, type RidingMedia } from "@/content/site";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import "./riding-gallery.css";

const media = riding.photos;

function PlayMark() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
      <path d="m8 5 11 7-11 7V5Z" />
    </svg>
  );
}

function RidingInlineVideo({ item, suspended }: { item: RidingMedia; suspended: boolean }) {
  const frame = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const reduceMotion = usePrefersReducedMotion();

  useEffect(() => {
    const element = frame.current;
    if (!element) return;
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[entries.length - 1];
      setVisible(entry.isIntersecting && entry.intersectionRatio >= 0.2);
    }, { threshold: [0, 0.2] });
    observer.observe(element);
    const onVisibility = () => setPageVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <span className="riding-inline-video" ref={frame}>
      <Image src={item.poster!} alt="" fill sizes="(min-width: 1100px) 25vw, 50vw" className="object-cover" />
      {visible && pageVisible && !reduceMotion && !suspended && (
        <video
          src={item.src}
          poster={item.poster}
          width={item.width}
          height={item.height}
          autoPlay
          muted
          playsInline
          loop
          preload="metadata"
          aria-hidden="true"
        />
      )}
    </span>
  );
}

function RidingThumbnail({ item, index, suspended, onOpen }: {
  item: RidingMedia;
  index: number;
  suspended: boolean;
  onOpen: (index: number) => void;
}) {
  const isVideo = item.kind === "video";
  return (
    <figure className="riding-gallery-card">
      <button
        type="button"
        className="riding-thumbnail"
        onClick={() => onOpen(index)}
        aria-label={`${isVideo ? "Open video" : "View photo"}: ${item.alt}`}
      >
        <span className="riding-thumbnail-image">
          {isVideo ? <RidingInlineVideo item={item} suspended={suspended} /> : (
            <Image
              src={item.src}
              alt={item.alt}
              fill
              sizes="(min-width: 1100px) 25vw, 50vw"
              className="object-cover"
            />
          )}
          {isVideo && <span className="riding-thumbnail-play"><PlayMark /><span>Film ↗</span></span>}
        </span>
        <span className="riding-thumbnail-meta">
          <span>{String(index + 1).padStart(2, "0")} / {isVideo ? "FILM" : "PHOTO"}</span>
          <span aria-hidden="true">FULL FRAME ↗</span>
        </span>
      </button>
    </figure>
  );
}

function RidingLightbox({ index, onChange, onClose }: {
  index: number;
  onChange: (index: number) => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const item = media[index];

  useEffect(() => {
    const element = dialog.current;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const scrollY = window.scrollY;
    const body = document.body;
    const bodyWidth = body.getBoundingClientRect().width;
    const previous = { position: body.style.position, top: body.style.top, left: body.style.left, right: body.style.right, width: body.style.width };
    body.style.position = "fixed";
    body.style.width = `${bodyWidth}px`;
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    element?.showModal();
    return () => {
      element?.close();
      Object.assign(body.style, previous);
      window.scrollTo({ top: scrollY, behavior: "instant" });
      previouslyFocused?.focus({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    const pauseWhenHidden = () => {
      if (document.hidden) video.current?.pause();
      else video.current?.play().catch(() => {});
    };
    document.addEventListener("visibilitychange", pauseWhenHidden);
    return () => document.removeEventListener("visibilitychange", pauseWhenHidden);
  }, []);

  const go = (direction: number) => onChange((index + direction + media.length) % media.length);
  const handleKey = (event: KeyboardEvent<HTMLDialogElement>) => {
    // Keep the native player's arrow-key seeking available while it has focus.
    if (event.target instanceof HTMLVideoElement) return;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      go(event.key === "ArrowRight" ? 1 : -1);
    }
  };

  return (
    <dialog
      ref={dialog}
      className="riding-lightbox"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      data-lenis-prevent
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onKeyDown={handleKey}
      onClick={(event) => { if (event.target === dialog.current) onClose(); }}
    >
      <div className="riding-lightbox-shell">
        <header className="riding-lightbox-header">
          <h3 id={titleId}>On the road.</h3>
          <p aria-live="polite">{String(index + 1).padStart(2, "0")} / {String(media.length).padStart(2, "0")} · {item.kind === "video" ? "FILM" : "PHOTO"}</p>
          <button type="button" onClick={onClose} aria-label="Close riding gallery">Close <span aria-hidden="true">×</span></button>
        </header>
        <div className="riding-lightbox-stage">
          {item.kind === "video" ? (
            <video
              key={item.src}
              ref={video}
              src={item.src}
              poster={item.poster}
              width={item.width}
              height={item.height}
              aria-label={item.alt}
              controls
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
            />
          ) : (
            <Image
              key={item.src}
              src={item.src}
              alt={item.alt}
              fill
              sizes="(min-width: 1440px) 1400px, 94vw"
              className="object-contain"
            />
          )}
        </div>
        <footer className="riding-lightbox-footer">
          <button type="button" onClick={() => go(-1)} aria-label="Previous riding item">← <span>Prev</span></button>
          <p id={descriptionId}>{item.alt}</p>
          <button type="button" onClick={() => go(1)} aria-label="Next riding item"><span>Next</span> →</button>
        </footer>
      </div>
    </dialog>
  );
}

export function RidingGallery() {
  const [selected, setSelected] = useState<number | null>(null);
  const close = useCallback(() => setSelected(null), []);

  return (
    <div className="riding-gallery">
      <div className="riding-gallery-heading"><p>A few moments between destinations.</p><span>{String(media.length).padStart(2, "0")} FRAMES / OPEN TO EXPLORE</span></div>
      <div className="riding-gallery-grid">
        {media.map((item, index) => <RidingThumbnail key={item.src} item={item} index={index} suspended={selected !== null} onOpen={setSelected} />)}
      </div>
      {selected !== null && <RidingLightbox index={selected} onChange={setSelected} onClose={close} />}
    </div>
  );
}
