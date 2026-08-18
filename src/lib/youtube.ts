// Minimal ambient types for the slice of the YouTube IFrame API this project
// actually calls. Not worth pulling in @types/youtube for four methods and
// two callbacks.
export interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  mute(): void;
  unMute(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  destroy(): void;
}

export interface YTPlayerVars {
  autoplay?: 0 | 1;
  mute?: 0 | 1;
  controls?: 0 | 1;
  rel?: 0 | 1;
  playsinline?: 0 | 1;
  disablekb?: 0 | 1;
  fs?: 0 | 1;
  modestbranding?: 0 | 1;
  iv_load_policy?: 1 | 3;
  start?: number;
  origin?: string;
}

export interface YTPlayerOptions {
  videoId: string;
  playerVars?: YTPlayerVars;
  events?: {
    onReady?: (event: { target: YTPlayer }) => void;
    onError?: (event: { target: YTPlayer; data: number }) => void;
  };
}

interface YTNamespace {
  Player: new (el: HTMLElement, opts: YTPlayerOptions) => YTPlayer;
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<YTNamespace> | null = null;

// Loads https://www.youtube.com/iframe_api exactly once no matter how many
// cards ask for it concurrently, and resolves once window.YT.Player exists.
export function loadYouTubeApi(): Promise<YTNamespace> {
  if (apiPromise) return apiPromise;

  apiPromise = new Promise((resolve) => {
    if (window.YT?.Player) {
      resolve(window.YT);
      return;
    }
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve(window.YT!);
    };
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(script);
    }
  });

  return apiPromise;
}
