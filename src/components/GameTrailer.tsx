"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { game } from "@/content/site";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useVideoSound } from "@/hooks/useVideoSound";
import { DWELL_MS, MuteIcon, VIDEO_LOOKAHEAD_PX, latest } from "./VideoClip";

// Share of the frame that must be on screen for the trailer to play. Same
// strict comparison and same reasoning as VideoClip: no tolerance.
const PLAY_RATIO = 0.4;

const BUTTON =
  "rounded-full bg-ink/70 text-mist/90 backdrop-blur-sm transition-colors hover:text-jacket-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jacket-bright";

function PlayGlyph({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden>
      <path d="M8 5.5v13a1 1 0 0 0 1.5.86l11-6.5a1 1 0 0 0 0-1.72l-11-6.5A1 1 0 0 0 8 5.5Z" />
    </svg>
  );
}

function PauseGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden>
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  );
}

// The trailer, shown large and inline. The frame is a fixed 16:9 box, so
// nothing moves while the poster or the video arrives.
//
// Loading, in order of cost:
//  1. The poster is a next/image and is all there is until the video is near.
//  2. Within VIDEO_LOOKAHEAD_PX of the viewport the <source>s are attached and
//     the browser reads the metadata (preload="metadata"). Before that the
//     video has no sources at all, so the 10MB file is never requested by a
//     reader who doesn't scroll this far.
//  3. At 40% visible, after a short dwell, it plays with sound and looped, and it
//     pauses the moment it drops below that again. The dwell is the same one
//     VideoClip uses: a section-nav jump flies past this section, and without
//     it every crossing would start a download that pause() doesn't cancel.
//
// Under reduced motion nothing autoplays. The poster stays, with a play
// control; pressing it is a deliberate act, so it plays once, with sound, and
// the sound toggle is there if that isn't wanted.
export function GameTrailer() {
  const { trailer } = game;
  const reduceMotion = usePrefersReducedMotion();
  const frameRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  // Set while playback is wanted but the sources may not be attached yet, so
  // the effect below can finish the job once they are.
  const wantsPlayRef = useRef(false);
  const loadedForRef = useRef<HTMLVideoElement | null>(null);

  const [armed, setArmed] = useState(false);
  const [userStarted, setUserStarted] = useState(false);
  const [hasFrame, setHasFrame] = useState(false);
  const [playing, setPlaying] = useState(false);
  const { muted, soundBlocked, play, toggleSound, onVolumeChange } = useVideoSound(videoRef, wantsPlayRef, false);

  const manual = reduceMotion;
  const showVideo = !manual || userStarted;

  // Arrive: attach the sources once the frame is within reach.
  useEffect(() => {
    if (manual) return;
    const frame = frameRef.current;
    if (!frame) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        clearTimeout(timer);
        if (latest(entries).isIntersecting) {
          timer = setTimeout(() => setArmed(true), DWELL_MS);
        }
      },
      { rootMargin: `${VIDEO_LOOKAHEAD_PX}px 0px` },
    );
    observer.observe(frame);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [manual]);

  // Play while on screen, pause while not. Under reduced motion this only
  // ever pauses: starting is the reader's call.
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = latest(entries);
        clearTimeout(timer);
        if (entry.isIntersecting && entry.intersectionRatio >= PLAY_RATIO) {
          if (manual) return;
          timer = setTimeout(() => {
            wantsPlayRef.current = true;
            setArmed(true);
            play();
          }, DWELL_MS);
        } else {
          wantsPlayRef.current = false;
          videoRef.current?.pause();
        }
      },
      { threshold: [0, PLAY_RATIO] },
    );
    observer.observe(frame);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [manual, play]);

  // The sources have just been attached to a video that was mounted without
  // them. Adding <source> children does not make the element reload by itself,
  // so ask it to, then start it if playback was already wanted.
  useEffect(() => {
    const video = videoRef.current;
    if (!armed || !showVideo || !video) return;
    if (loadedForRef.current !== video) {
      loadedForRef.current = video;
      video.load();
    }
    if (wantsPlayRef.current) play();
  }, [armed, showVideo, play]);

  const start = () => {
    wantsPlayRef.current = true;
    setUserStarted(true);
    setArmed(true);
    void play();
  };

  const pause = () => {
    wantsPlayRef.current = false;
    videoRef.current?.pause();
  };

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) videoRef.current?.pause();
      else if (wantsPlayRef.current) play();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [play]);

  return (
    <div
      ref={frameRef}
      className="game-trailer-frame relative aspect-video w-full overflow-hidden bg-ink-soft"
    >
      <Image
        src={trailer.poster}
        // The video carries the label once it is there. The poster only
        // speaks for itself when it is all there is.
        alt={showVideo ? "" : trailer.alt}
        fill
        sizes="(min-width: 1152px) 1072px, 100vw"
        className="object-contain"
      />
      {showVideo && (
        <video
          ref={videoRef}
          muted={muted}
          playsInline
          loop={!manual}
          preload="metadata"
          width={trailer.width}
          height={trailer.height}
          aria-label={trailer.alt}
          onVolumeChange={onVolumeChange}
          onLoadedData={() => setHasFrame(true)}
          onPlaying={() => setHasFrame(true)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-500 ease-site ${
            hasFrame ? "opacity-100" : "opacity-0"
          }`}
        >
          {/* MP4 first: H.264 is hardware decoded nearly everywhere, which
              matters for a 1080p60 clip on a phone. WebM is for browsers
              without it. */}
          {armed && (
            <>
              <source src={trailer.mp4} type="video/mp4" />
              <source src={trailer.webm} type="video/webm" />
            </>
          )}
        </video>
      )}

      {!playing && (
        <button
          type="button"
          onClick={start}
          aria-label={userStarted ? "Play trailer again" : "Play trailer"}
          className={`absolute left-1/2 top-1/2 z-20 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center pl-1 sm:size-20 ${BUTTON}`}
        >
          <PlayGlyph size={28} />
        </button>
      )}
      {playing && (
        <button
          type="button"
          onClick={pause}
          aria-label="Pause trailer"
          className={`absolute bottom-3 left-3 z-20 flex size-11 items-center justify-center sm:bottom-4 sm:left-4 ${BUTTON}`}
        >
          <PauseGlyph />
        </button>
      )}
      {showVideo && (
        <button
          type="button"
          onClick={toggleSound}
          aria-label={soundBlocked ? "Enable trailer sound" : muted ? "Play sound" : "Mute sound"}
          className={`absolute bottom-3 right-3 z-20 flex min-h-11 min-w-11 items-center justify-center gap-2 p-2.5 sm:bottom-4 sm:right-4 ${BUTTON}`}
        >
          {soundBlocked && <span className="text-xs">Enable sound</span>}
          <MuteIcon muted={muted} />
        </button>
      )}
    </div>
  );
}
