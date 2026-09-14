"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useSettled } from "@/hooks/useSettled";

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

// How far outside the viewport a video starts fetching, when it is judging its
// own distance. Parents that can't be observed that way pass `near` instead.
export const VIDEO_LOOKAHEAD_PX = 400;

// How far ahead a poster or photo starts fetching, in viewport heights, for
// parents that supply `soon`. Earlier than a clip, since it is tiny and it is
// what stands between the reader and a blank tile.
export const POSTER_LOOKAHEAD_VH = 1;

// How long a video has to stay near before it fetches, or on screen before it
// plays. A section-nav jump flies past every section in between, and without
// this each video it crossed called play() for a frame or two, which starts a
// download that pause() does not cancel. One Intro -> Favorites jump measured
// thirteen downloads, about 50MB, mid-scroll. Short enough that nobody scrolling
// normally waits on it. Exported for parents that supply `near` and so have to
// do the dwell themselves.
export const DWELL_MS = 150;

// Share of the video that must be on screen for it to play.
const PLAY_RATIO = 0.4;

/**
 * The most recent entry for an observer watching a single element.
 *
 * Never destructure `([entry])`. When the main thread is busy (a section-nav
 * jump is exactly that) the browser queues several entries and delivers them
 * in one batch, oldest first. Reading only the first one took an "entered" as
 * the current state after the element had already left, so a clip the jump
 * flew past started playing off screen and was never paused: five videos were
 * measured playing at once after one round trip.
 */
export function latest(entries: IntersectionObserverEntry[]) {
  return entries[entries.length - 1];
}

// The <video> element is mounted once and never recreated for scroll reasons:
// leaving the viewport pauses it, coming back resumes it from the same frame.
//
// Loading is deliberately lazy, and the three layers are ordered so nothing is
// ever blank:
//  1. The poster is a next/image underneath the video, resized and lazy like
//     every other image. A poster attribute would fetch the full-size JPEG for
//     every video on the page at load, wherever it sits.
//  2. preload is "none" until the video is near, "auto" while it is near or
//     playing, and "metadata" once it has been started and is out of reach
//     again. Never "metadata" up front: measured in Edge, that fetches the
//     first megabyte of every video at page load, which is the whole of most
//     Travel clips. And never left at "auto" behind the reader: that is what
//     kept Music's 16MB loop downloading through the whole of Travel on a slow
//     connection, starving the tiles actually coming on screen. Dropping to
//     "metadata" stops the read-ahead and keeps whatever is buffered.
//  3. The video stays transparent until it has a frame to show, so the poster
//     is what's visible until then, and it fades in over the top.
//
// Under reduced motion only the poster renders.
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
  near,
  soon,
  priority = false,
  sizes = "100vw",
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
  // Whether the video is within reach of the viewport, for parents that know
  // better than an observer can. Leave undefined to let VideoClip observe its
  // own distance. Travel needs this: its tiles sit inside a clipped, pinned
  // frame, and an observer clips a target to its overflow ancestors before
  // applying rootMargin, so a tile just below the frame never reads as near.
  // A supplied value is taken as settled: the parent does the dwell.
  near?: boolean;
  // The poster's own, earlier, reach, from the same kind of parent: fetch it
  // now and ahead of other requests. A poster is a few KB against a clip's
  // megabytes, so it goes first and is always there before its video is.
  // Leave undefined to use native lazy loading, which is fine outside a
  // clipped frame.
  soon?: boolean;
  // Above the fold (the hero): fetch immediately and preload the poster as
  // the LCP image, rather than waiting to be near.
  priority?: boolean;
  // Rendered width of the poster, for next/image.
  sizes?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  // Whether the video is on screen and has been for DWELL_MS, i.e. whether
  // anything should be animating at all right now. Checked by the reverse-scrub
  // loop before it schedules its next frame.
  const activeRef = useRef(false);
  // Set the moment playback is asked for, so the load() fallback below never
  // resets an element that has already been told to play.
  const wantsPlayRef = useRef(false);
  const directionRef = useRef<"forward" | "reverse">("forward");
  const reverseRafRef = useRef<number | null>(null);
  const reduceMotion = usePrefersReducedMotion();
  const [muted, setMuted] = useState(true);
  // Starts true for `priority`, so the server HTML already says preload="auto"
  // and the hero starts fetching before hydration. The first observer report
  // replaces it.
  const [ownNear, setOwnNear] = useState(priority);
  const ownNearSettled = useSettled(ownNear, DWELL_MS);
  const decidesOwnReach = near === undefined;
  // `priority` only skips the wait at the start. After that the hero follows
  // the same reach as everything else: pinned to "auto", it kept downloading
  // underneath Travel on a slow connection. No dwell on it either, since
  // nothing flies past the top of the page.
  const isNear = near ?? (priority ? ownNear : ownNearSettled);
  // On screen (40%+) and past the dwell, i.e. playing or about to.
  const [inView, setInView] = useState(false);
  const wantsData = isNear || inView;
  // Latched: whether this element has ever been asked for data. Decides
  // between "none" and "metadata" once it is out of reach again, and switches
  // the poster to eager loading for good.
  const [started, setStarted] = useState(priority);
  if (wantsData && !started) setStarted(true);
  const preload = wantsData ? "auto" : started ? "metadata" : "none";
  const [hasFrame, setHasFrame] = useState(false);
  const fitClass = fit === "cover" ? "object-cover" : "object-contain";
  const positionClass = fit === "cover" ? POSITION_CLASS[position] : "";

  const stepReverse = (video: HTMLVideoElement, lastTs: number) => {
    const tick = (ts: number) => {
      if (!activeRef.current || directionRef.current !== "reverse") return;
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

  // Own distance, when no parent is supplying it. Kept running for the life of
  // the element, since leaving reach matters as much as arriving.
  useEffect(() => {
    if (reduceMotion || !decidesOwnReach) return;
    const video = videoRef.current;
    if (!video) return;
    const observer = new IntersectionObserver(
      (entries) => setOwnNear(latest(entries).isIntersecting),
      { rootMargin: `${VIDEO_LOOKAHEAD_PX}px 0px` },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [reduceMotion, decidesOwnReach]);

  // preload has just gone from "none" to "auto" for the first time. Chromium
  // starts fetching on that change by itself; other engines may leave the
  // element idle until load() is called. load() also pauses and rejects any
  // pending play(), so it is only ever called on an element nothing has asked
  // to play yet.
  useEffect(() => {
    const video = videoRef.current;
    if (!started || !video || wantsPlayRef.current) return;
    if (
      video.readyState === HTMLMediaElement.HAVE_NOTHING &&
      video.networkState !== HTMLMediaElement.NETWORK_LOADING
    ) {
      video.load();
    }
  }, [started]);

  // Play while on screen, pause while not. pause() keeps currentTime, so a
  // video that comes back resumes where it left off.
  useEffect(() => {
    if (reduceMotion) return;
    const video = videoRef.current;
    if (!video) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = latest(entries);
        clearTimeout(timer);
        // Not isIntersecting alone: that is true for any overlap at all, so a
        // video sliding out would have kept playing until its last pixel left.
        // And strictly >=, no tolerance: the browser reports a downward
        // crossing at a ratio just under the threshold (0.398), and a tolerance
        // read that as still on screen. Nothing fires again until the 0
        // threshold, and an element left edge-adjacent to the viewport (the
        // hero, after a jump to Work) sits at ratio 0 in the same bucket as
        // 0.39, so it never fires at all and the clip played on off screen.
        if (entry.isIntersecting && entry.intersectionRatio >= PLAY_RATIO) {
          timer = setTimeout(() => {
            activeRef.current = true;
            wantsPlayRef.current = true;
            setInView(true);
            if (directionRef.current === "forward") {
              video.play().catch(() => {});
            } else {
              stepReverse(video, performance.now());
            }
          }, DWELL_MS);
        } else {
          activeRef.current = false;
          wantsPlayRef.current = false;
          setInView(false);
          video.pause();
          if (reverseRafRef.current) cancelAnimationFrame(reverseRafRef.current);
        }
      },
      { threshold: [0, PLAY_RATIO] },
    );
    observer.observe(video);
    return () => {
      clearTimeout(timer);
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
        if (activeRef.current) stepReverse(video, performance.now());
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

  return (
    <>
      <Image
        src={poster}
        // The video carries the label. The poster only speaks for itself when
        // it is all there is.
        alt={reduceMotion ? alt : ""}
        fill
        sizes={sizes}
        // Next 16: `preload` for the LCP image (it throws if combined with
        // loading="lazy", and shouldn't be combined with fetchPriority).
        // Everything else loads lazily until its reach says otherwise, then
        // eagerly and ahead of the clip, for the same clipping reason as `near`
        // above: native lazy loading can't see past the Travel frame either.
        preload={priority}
        loading={priority ? undefined : soon || started ? "eager" : "lazy"}
        fetchPriority={!priority && soon ? "high" : undefined}
        className={`${fitClass} ${positionClass}`}
      />
      {!reduceMotion && (
        <video
          ref={videoRef}
          muted
          playsInline
          loop={boomerangAt === undefined}
          preload={preload}
          width={width}
          height={height}
          aria-label={alt}
          // loadeddata can fire before hydration attaches this handler (the
          // hero is preload="auto" in the server HTML); playing always fires
          // again after, so between them the fade-in never gets stuck.
          onLoadedData={() => setHasFrame(true)}
          onPlaying={() => setHasFrame(true)}
          className={`absolute inset-0 h-full w-full transition-opacity duration-500 ease-site ${fitClass} ${positionClass} ${
            hasFrame ? "opacity-100" : "opacity-0"
          }`}
        >
          <source src={src} type="video/mp4" />
        </video>
      )}
      {!reduceMotion && allowSound && (
        // From lg the toggle lines up with the 64px content edge every section
        // keeps (the heading opposite it sits at lg:px-16), which also keeps it
        // out of the right-hand gutter SectionNav's rail lives in. At right-4
        // it scrolled straight underneath the rail.
        <button
          type="button"
          onClick={toggleSound}
          aria-label={muted ? "Play sound" : "Mute sound"}
          className="absolute bottom-4 right-4 z-20 rounded-full bg-ink/70 p-2.5 text-mist/90 backdrop-blur-sm transition-colors hover:text-jacket-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jacket-bright lg:right-16"
        >
          <MuteIcon muted={muted} />
        </button>
      )}
    </>
  );
}
