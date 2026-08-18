"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { loadYouTubeApi, type YTPlayer } from "@/lib/youtube";
import { EASE } from "@/lib/motion";
import type { WatchingEntry } from "@/content/watching";

const LOOP_MS = 8000;
// How far below/above the viewport a card can be before we spin up its
// player, so scrolling into hover range never has to wait on a cold start.
const INIT_ROOT_MARGIN = "400px";

function MuteIcon({ muted }: { muted: boolean }) {
  return muted ? (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 9v6h4l5 5V4L8 9H4Z" />
      <path d="M17 9l4 6M21 9l-4 6" strokeLinecap="round" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 9v6h4l5 5V4L8 9H4Z" />
      <path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" strokeLinecap="round" />
    </svg>
  );
}

export function WatchingCard({ entry }: { entry: WatchingEntry }) {
  const reduceMotion = usePrefersReducedMotion();

  const containerRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const loopRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wantsPlayRef = useRef(false);
  const creatingRef = useRef(false);

  // Device capability, not reactive state: computed once, safe to read
  // synchronously since it only ever gates which effects/handlers attach,
  // never what gets rendered (so there's no hydration mismatch to worry
  // about even though the server always sees `false`).
  const [hoverCapable] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches,
  );
  const [playerReady, setPlayerReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [failed, setFailed] = useState(!entry.youtubeId);
  const [posterFailed, setPosterFailed] = useState(false);

  const clearLoop = () => {
    if (loopRef.current) {
      clearInterval(loopRef.current);
      loopRef.current = null;
    }
  };

  // Everything funnels through here: whatever set wantsPlayRef last wins,
  // applied as soon as a player actually exists to act on it.
  const applyIntent = () => {
    const player = playerRef.current;
    if (!player || !playerReady) return;
    if (wantsPlayRef.current) {
      player.seekTo(entry.startSeconds, true);
      player.mute();
      player.playVideo();
      setPlaying(true);
      clearLoop();
      loopRef.current = setInterval(() => {
        playerRef.current?.seekTo(entry.startSeconds, true);
      }, LOOP_MS);
    } else {
      player.pauseVideo();
      clearLoop();
      setPlaying(false);
    }
  };

  const ensurePlayer = () => {
    if (playerRef.current || creatingRef.current || failed || reduceMotion) return;
    const mountEl = mountRef.current;
    if (!mountEl) return;
    creatingRef.current = true;
    loadYouTubeApi()
      .then((YT) => {
        if (playerRef.current || !mountRef.current) return;
        playerRef.current = new YT.Player(mountRef.current, {
          videoId: entry.youtubeId,
          playerVars: {
            autoplay: 0,
            mute: 1,
            controls: 0,
            rel: 0,
            playsinline: 1,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            iv_load_policy: 3,
            start: entry.startSeconds,
            origin: window.location.origin,
          },
          events: {
            onReady: () => setPlayerReady(true),
            onError: () => setFailed(true),
          },
        });
      })
      .catch(() => setFailed(true));
  };

  useEffect(() => {
    applyIntent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerReady]);

  useEffect(() => {
    return () => {
      clearLoop();
      playerRef.current?.destroy();
    };
  }, []);

  const requestPlay = () => {
    if (reduceMotion || failed) return;
    wantsPlayRef.current = true;
    ensurePlayer();
    applyIntent();
  };

  const requestPause = () => {
    wantsPlayRef.current = false;
    applyIntent();
  };

  // Lazy init: create the player once the card is within reach, well before
  // it's actually visible, so hovering it never waits on a cold start.
  useEffect(() => {
    if (reduceMotion || failed) return;
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([info]) => {
        if (info.isIntersecting) {
          ensurePlayer();
          observer.disconnect();
        }
      },
      { rootMargin: INIT_ROOT_MARGIN, threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion, failed]);

  // Touch/no-hover path: play once at least half visible, pause once it
  // drops below that. Skipped entirely on hover-capable devices, which use
  // onMouseEnter/onMouseLeave instead.
  useEffect(() => {
    if (reduceMotion || failed || hoverCapable) return;
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([info]) => {
        if (info.isIntersecting && info.intersectionRatio >= 0.5) {
          requestPlay();
        } else {
          requestPause();
        }
      },
      { threshold: [0, 0.5] },
    );
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion, failed, hoverCapable]);

  const toggleMute = (e: MouseEvent) => {
    e.stopPropagation();
    const player = playerRef.current;
    if (!player) return;
    if (muted) {
      player.unMute();
      setMuted(false);
    } else {
      player.mute();
      setMuted(true);
    }
  };

  return (
    <div>
      <motion.div
        ref={containerRef}
        onMouseEnter={hoverCapable ? requestPlay : undefined}
        onMouseLeave={hoverCapable ? requestPause : undefined}
        whileHover={reduceMotion ? undefined : { scale: 1.035 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="relative aspect-[2/3] overflow-hidden bg-ink-soft"
      >
        {!failed && (
          <div
            ref={mountRef}
            aria-hidden
            className="absolute inset-0 z-0 [&_iframe]:absolute [&_iframe]:inset-0 [&_iframe]:h-full [&_iframe]:w-full"
          />
        )}

        {!posterFailed && (
          <Image
            src={`/media/watching/${entry.slug}.jpg`}
            alt={`${entry.title} poster`}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="z-10 object-cover transition-opacity duration-500"
            style={{ opacity: playing ? 0 : 1 }}
            onError={() => setPosterFailed(true)}
          />
        )}

        {entry.caption && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: playing ? 1 : 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="pointer-events-none absolute inset-x-3 bottom-3 z-20 font-mono text-[11px] leading-relaxed text-mist/90"
          >
            {entry.caption}
          </motion.p>
        )}

        {playing && (
          <button
            type="button"
            onClick={toggleMute}
            aria-label={muted ? "Unmute" : "Mute"}
            className="absolute bottom-3 right-3 z-20 rounded-full bg-ink/70 p-2 text-mist/90 backdrop-blur-sm transition-colors hover:text-jacket-bright"
          >
            <MuteIcon muted={muted} />
          </button>
        )}
      </motion.div>

      <p className="mt-3 font-display text-xl font-medium text-mist">{entry.title}</p>
      <p className="mt-1 font-mono text-xs uppercase tracking-wider text-stone">
        {entry.category === "anime" ? "Anime" : "Film"}
      </p>
    </div>
  );
}
