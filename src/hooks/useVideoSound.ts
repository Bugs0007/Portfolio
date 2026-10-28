"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

// Keep the visitor's sound choice separate from a browser's autoplay fallback.
// A refused audible start can still animate silently, then regain sound on a
// click. An intentional mute always survives leaving and revisiting a section.
export function useVideoSound(
  videoRef: RefObject<HTMLVideoElement | null>,
  wantsPlayRef: RefObject<boolean>,
  initiallyMuted: boolean,
) {
  const desiredMuted = useRef(initiallyMuted);
  const [muted, setMuted] = useState(initiallyMuted);
  const [soundBlocked, setSoundBlocked] = useState(false);

  const play = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !wantsPlayRef.current || document.hidden) return;
    video.muted = desiredMuted.current;
    try {
      await video.play();
      if (!wantsPlayRef.current || document.hidden) video.pause();
      setMuted(video.muted);
      setSoundBlocked(false);
    } catch (error) {
      if (
        error instanceof DOMException && error.name === "NotAllowedError" &&
        !desiredMuted.current && wantsPlayRef.current && !document.hidden
      ) {
        video.muted = true;
        setMuted(true);
        setSoundBlocked(true);
        await video.play().catch(() => {});
        if (!wantsPlayRef.current || document.hidden) video.pause();
      }
    }
  }, [videoRef, wantsPlayRef]);

  const enableSound = useCallback(() => {
    desiredMuted.current = false;
    const video = videoRef.current;
    if (video) video.muted = false;
    setMuted(false);
    setSoundBlocked(false);
    void play();
  }, [play, videoRef]);

  const toggleSound = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.muted || soundBlocked) enableSound();
    else {
      desiredMuted.current = true;
      video.muted = true;
      setMuted(true);
      setSoundBlocked(false);
    }
  };

  useEffect(() => {
    if (!soundBlocked) return;
    const retry = () => {
      if (!desiredMuted.current && wantsPlayRef.current) void play();
    };
    // Bubble after the clicked control so an explicit mute takes precedence.
    document.addEventListener("click", retry);
    return () => document.removeEventListener("click", retry);
  }, [soundBlocked, play, wantsPlayRef]);

  return {
    muted, soundBlocked, play, enableSound, toggleSound,
    onVolumeChange: () => {
      const video = videoRef.current;
      if (video) setMuted(video.muted);
    },
  };
}
