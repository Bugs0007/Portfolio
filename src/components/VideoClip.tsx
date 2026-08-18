"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

// Poster first, always: the video element carries a poster attribute and only
// preloads metadata, so nothing waits on video bytes to paint. Playback is
// driven by IntersectionObserver, so never more than one video decodes at a
// time. Under reduced motion the poster image is all that ever renders. Used
// by Music, Riding and Travel, nothing about it is section-specific.
export function VideoClip({
  poster,
  src,
  alt,
  width,
  height,
  fit = "contain",
}: {
  poster: string;
  src: string;
  alt: string;
  width: number;
  height: number;
  fit?: "contain" | "cover";
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const reduceMotion = usePrefersReducedMotion();
  const fitClass = fit === "cover" ? "object-cover" : "object-contain";

  useEffect(() => {
    if (reduceMotion) return;
    const video = videoRef.current;
    if (!video) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [reduceMotion]);

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
    <video
      ref={videoRef}
      muted
      playsInline
      loop
      preload="metadata"
      poster={poster}
      width={width}
      height={height}
      aria-label={alt}
      className={`absolute inset-0 h-full w-full ${fitClass}`}
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}
