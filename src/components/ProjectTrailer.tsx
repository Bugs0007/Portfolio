"use client";

import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import "./project-trailer.css";

type ProjectTrailerProps = {
  name: string;
  src: string;
  poster: string;
  width: number;
  height: number;
};

/** The supplied MP4 is the only video source: no resized or recompressed tier. */
export function ProjectTrailer({ name, src, poster, width, height }: ProjectTrailerProps) {
  const frame = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const userPaused = useRef(false);
  const wantsPlayback = useRef(false);
  const reduceMotion = usePrefersReducedMotion();
  const [armed, setArmed] = useState(false);
  const [inView, setInView] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const element = frame.current;
    if (!element) return;
    let arrival: ReturnType<typeof setTimeout> | undefined;
    let visible: ReturnType<typeof setTimeout> | undefined;
    const near = new IntersectionObserver((entries) => {
      clearTimeout(arrival);
      if (entries[entries.length - 1].isIntersecting) {
        arrival = setTimeout(() => setArmed(true), 150);
      }
    }, { rootMargin: "400px 0px" });
    const onScreen = new IntersectionObserver((entries) => {
      clearTimeout(visible);
      const entry = entries[entries.length - 1];
      if (entry.isIntersecting && entry.intersectionRatio >= .35) {
        visible = setTimeout(() => setInView(true), 150);
      } else {
        wantsPlayback.current = false;
        video.current?.pause();
        setInView(false);
      }
    }, { threshold: [0, .35] });
    near.observe(element);
    onScreen.observe(element);
    return () => {
      clearTimeout(arrival);
      clearTimeout(visible);
      near.disconnect();
      onScreen.disconnect();
    };
  }, []);

  useEffect(() => {
    const element = video.current;
    if (!element) return;
    const update = () => {
      wantsPlayback.current = armed && inView && !document.hidden && !reduceMotion && !userPaused.current;
      if (wantsPlayback.current) {
        // Muted inline playback is allowed without a gesture. Native controls
        // remain available if the browser or a motion preference prevents it.
        void element.play().catch(() => {});
      } else {
        element.pause();
      }
    };
    update();
    document.addEventListener("visibilitychange", update);
    return () => {
      document.removeEventListener("visibilitychange", update);
      wantsPlayback.current = false;
      element.pause();
    };
  }, [armed, inView, reduceMotion]);

  const fullscreen = () => {
    const element = video.current;
    if (!element) return;
    if (element.requestFullscreen) void element.requestFullscreen().catch(() => {});
    else (element as HTMLVideoElement & { webkitEnterFullscreen?: () => void }).webkitEnterFullscreen?.();
  };

  return (
    <figure ref={frame} className="project-trailer" aria-label={`${name} launch film`}>
      <div className="project-trailer-screen" style={{ aspectRatio: `${width} / ${height}` }}>
        <video
          ref={video}
          src={armed ? src : undefined}
          poster={poster}
          width={width}
          height={height}
          muted
          playsInline
          loop
          controls
          preload={armed && inView ? "auto" : "none"}
          aria-label={`${name} motion trailer`}
          onPlay={() => { userPaused.current = false; }}
          onPause={() => {
            if (wantsPlayback.current && !document.hidden) userPaused.current = true;
          }}
          onError={() => setFailed(true)}
        />
        {failed && <p className="project-trailer-error">Open the film to watch it in your browser. <a href={src}>Watch {name} ↗</a></p>}
      </div>
      <figcaption>
        <span>{name} <i aria-hidden>/</i> Launch film</span>
        <button type="button" onClick={fullscreen} aria-label={`View ${name} trailer fullscreen`}>Fullscreen <span aria-hidden>↗</span></button>
      </figcaption>
    </figure>
  );
}
