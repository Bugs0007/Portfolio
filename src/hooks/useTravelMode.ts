"use client";

import { useSyncExternalStore } from "react";
import { DEFAULT_TRAVEL_MODE, isTravelMode, type TravelMode } from "@/lib/travel-mode";

// Same hydration-safe shape as usePrefersReducedMotion: an explicit server
// snapshot (the default mode) and a real client read of the URL, so the
// static and flowing Travel trees never disagree during hydration.

let current: TravelMode | null = null;
const listeners = new Set<() => void>();

function readFromUrl(): TravelMode {
  const param = new URLSearchParams(window.location.search).get("travelMode");
  return isTravelMode(param) ? param : DEFAULT_TRAVEL_MODE;
}

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  const onPopState = () => {
    current = readFromUrl();
    onChange();
  };
  window.addEventListener("popstate", onPopState);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("popstate", onPopState);
  };
}

function getSnapshot(): TravelMode {
  if (current === null) current = readFromUrl();
  return current;
}

function getServerSnapshot(): TravelMode {
  return DEFAULT_TRAVEL_MODE;
}

// Updates the `travelMode` query param in place (no navigation, no remount)
// so the URL always reflects what's on screen and can be shared or refreshed
// to reproduce a comparison.
export function setTravelMode(mode: TravelMode) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.searchParams.set("travelMode", mode);
  window.history.replaceState(window.history.state, "", url);
  current = mode;
  emit();
}

export function useTravelMode(): TravelMode {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
