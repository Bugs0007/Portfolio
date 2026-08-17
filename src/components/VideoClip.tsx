"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";

// Poster first, always. Video is swapped in only once this element is in
// view, and only if the visitor hasn't asked for reduced motion. Never more
// than one video decoding at a time on this page. Used by Music, Riding and
// Travel, nothing about it is section-specific.
//
// useReducedMotion is null until measured on the client, and that null is
// treated the same as "reduce": the poster renders on the server and for
// anyone who asked for less motion, and only a confirmed false swaps in video.
export function VideoClip({
  poster,
  src,
  alt,
  width,
  height,
}: {
  poster: string;
  src: string;
  alt: string;
  width: number;
  height: number;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion !== false) return;
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

  if (reduceMotion !== false) {
    return (
      <Image
        src={poster}
        alt={alt}
        fill
        sizes="100vw"
        className="object-contain"
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
      className="absolute inset-0 h-full w-full object-contain"
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}
