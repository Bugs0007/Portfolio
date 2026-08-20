"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

function MuteIcon({ muted }: { muted: boolean }) {
  return muted ? (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 9v6h4l5 5V4L8 9H4Z" />
      <path d="M17 9l4 6M21 9l-4 6" strokeLinecap="round" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 9v6h4l5 5V4L8 9H4Z" />
      <path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" strokeLinecap="round" />
    </svg>
  );
}

const POSITION_CLASS = {
  center: "object-center",
  top: "object-top",
  bottom: "object-bottom",
} as const;

// Poster first, always: the video element carries a poster attribute and only
// preloads metadata, so nothing waits on video bytes to paint. Playback is
// driven by IntersectionObserver, so never more than one video decodes at a
// time. Under reduced motion the poster image is all that ever renders. Used
// by Hero, Music, Riding and Travel, nothing about it is section-specific.
export function VideoClip({
  poster,
  src,
  alt,
  width,
  height,
  fit = "contain",
  position = "center",
  boomerangAt,
  allowSound = false,
}: {
  poster: string;
  src: string;
  alt: string;
  width: number;
  height: number;
  fit?: "contain" | "cover";
  // Which edge of the frame object-cover keeps on screen when the source's
  // aspect ratio doesn't match its box. Only matters for fit="cover".
  position?: "center" | "top" | "bottom";
  // When set, playback ping-pongs between 0 and this timestamp (seconds)
  // instead of looping straight through: plays forward to the beat, reverses
  // back to the start via manually stepped currentTime (browsers don't
  // support native reverse playback for video), then forward again.
  boomerangAt?: number;
  // Shows a mute/unmute toggle. Playback still starts muted regardless
  // (autoplay triggered by IntersectionObserver, not a user gesture, so
  // browsers require it), unmuting only ever happens from the click itself.
  allowSound?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  // Whether the section is currently on screen, i.e. whether anything should
  // be animating at all right now, checked by the reverse-scrub loop before
  // it schedules its next frame.
  const inViewRef = useRef(false);
  const directionRef = useRef<"forward" | "reverse">("forward");
  const reverseRafRef = useRef<number | null>(null);
  const reduceMotion = usePrefersReducedMotion();
  const [muted, setMuted] = useState(true);
  const fitClass = fit === "cover" ? "object-cover" : "object-contain";
  const positionClass = fit === "cover" ? POSITION_CLASS[position] : "";

  const stepReverse = (video: HTMLVideoElement, lastTs: number) => {
    const tick = (ts: number) => {
      if (!inViewRef.current || directionRef.current !== "reverse") return;
      const dt = (ts - lastTs) / 1000;
      lastTs = ts;
      const next = video.currentTime - dt;
      if (next <= 0) {
        video.currentTime = 0;
        directionRef.current = "forward";
        video.play().catch(() => {});
        return;
      }
      video.currentTime = next;
      reverseRafRef.current = requestAnimationFrame(tick);
    };
    reverseRafRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    if (reduceMotion) return;
    const video = videoRef.current;
    if (!video) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        inViewRef.current = entry.isIntersecting;
        if (entry.isIntersecting) {
          if (directionRef.current === "forward") {
            video.play().catch(() => {});
          } else {
            stepReverse(video, performance.now());
          }
        } else {
          video.pause();
          if (reverseRafRef.current) cancelAnimationFrame(reverseRafRef.current);
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(video);
    return () => {
      observer.disconnect();
      if (reverseRafRef.current) cancelAnimationFrame(reverseRafRef.current);
    };
  }, [reduceMotion]);

  useEffect(() => {
    if (reduceMotion || boomerangAt === undefined) return;
    const video = videoRef.current;
    if (!video) return;
    const onTimeUpdate = () => {
      if (directionRef.current === "forward" && video.currentTime >= boomerangAt) {
        video.pause();
        directionRef.current = "reverse";
        if (inViewRef.current) stepReverse(video, performance.now());
      }
    };
    video.addEventListener("timeupdate", onTimeUpdate);
    return () => video.removeEventListener("timeupdate", onTimeUpdate);
  }, [reduceMotion, boomerangAt]);

  const toggleSound = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  };

  if (reduceMotion) {
    return (
      <Image
        src={poster}
        alt={alt}
        fill
        sizes="100vw"
        className={`${fitClass} ${positionClass}`}
      />
    );
  }

  return (
    <>
      <video
        ref={videoRef}
        muted
        playsInline
        loop={boomerangAt === undefined}
        preload="metadata"
        poster={poster}
        width={width}
        height={height}
        aria-label={alt}
        className={`absolute inset-0 h-full w-full ${fitClass} ${positionClass}`}
      >
        <source src={src} type="video/mp4" />
      </video>
      {allowSound && (
        <button
          type="button"
          onClick={toggleSound}
          aria-label={muted ? "Play sound" : "Mute sound"}
          className="absolute bottom-4 right-4 z-20 rounded-full bg-ink/70 p-2.5 text-mist/90 backdrop-blur-sm transition-colors hover:text-jacket-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jacket-bright"
        >
          <MuteIcon muted={muted} />
        </button>
      )}
    </>
  );
}
