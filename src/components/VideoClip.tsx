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
  freezeAt,
  allowSound = false,
}: {
  poster: string;
  src: string;
  alt: string;
  width: number;
  height: number;
  fit?: "contain" | "cover";
  // When set, the clip plays once and holds on this frame (seconds) instead
  // of looping, landing on a specific beat rather than replaying the whole
  // clip or ending on whatever frame the source happens to stop on.
  freezeAt?: number;
  // Shows a mute/unmute toggle. Playback still starts muted regardless
  // (autoplay triggered by IntersectionObserver, not a user gesture, so
  // browsers require it), unmuting only ever happens from the click itself.
  allowSound?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const frozenRef = useRef(false);
  const reduceMotion = usePrefersReducedMotion();
  const [muted, setMuted] = useState(true);
  const fitClass = fit === "cover" ? "object-cover" : "object-contain";

  useEffect(() => {
    if (reduceMotion) return;
    const video = videoRef.current;
    if (!video) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!frozenRef.current) video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [reduceMotion]);

  useEffect(() => {
    if (reduceMotion || freezeAt === undefined) return;
    const video = videoRef.current;
    if (!video) return;
    const onTimeUpdate = () => {
      if (video.currentTime >= freezeAt) {
        video.pause();
        video.currentTime = freezeAt;
        frozenRef.current = true;
      }
    };
    video.addEventListener("timeupdate", onTimeUpdate);
    return () => video.removeEventListener("timeupdate", onTimeUpdate);
  }, [reduceMotion, freezeAt]);

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
        className={fitClass}
      />
    );
  }

  return (
    <>
      <video
        ref={videoRef}
        muted
        playsInline
        loop={freezeAt === undefined}
        preload="metadata"
        poster={poster}
        width={width}
        height={height}
        aria-label={alt}
        className={`absolute inset-0 h-full w-full ${fitClass}`}
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
