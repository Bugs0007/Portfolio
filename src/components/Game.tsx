import { game } from "@/content/site";
import { GameTrailer } from "./GameTrailer";
import { Reveal } from "./Reveal";

// A side project that lives under Work, ahead of the Seam. Heading, a line or
// two, then the thing itself: the trailer is the content, and the Play link
// goes to the live game in a new tab. It is not embedded: the game wants the
// whole window and a keyboard, and an iframe would load all of it on every
// visit to a portfolio. Top padding is small because the last Work chapter
// already leaves a blank stretch where its pin releases.
export function Game() {
  return (
    <section
      id="game"
      aria-label={game.name}
      className="relative bg-ink px-6 pb-24 pt-12 sm:px-10 sm:pb-32 sm:pt-16 lg:px-16"
    >
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <h2 className="font-display text-4xl font-medium text-mist sm:text-5xl">
            {game.name}
          </h2>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-mist/75 sm:text-base">
            {game.blurb}
          </p>
        </Reveal>

        <Reveal delay={0.1} className="mt-10">
          <GameTrailer />
          <div className="mt-6">
            <a
              href={game.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 rounded-sm bg-jacket-bright px-8 py-4 font-mono text-sm uppercase tracking-wider text-ink transition-colors hover:bg-mist focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mist focus-visible:ring-offset-4 focus-visible:ring-offset-ink"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden>
                <path d="M8 5.5v13a1 1 0 0 0 1.5.86l11-6.5a1 1 0 0 0 0-1.72l-11-6.5A1 1 0 0 0 8 5.5Z" />
              </svg>
              Play
              <span className="sr-only">{game.name} (opens in a new tab)</span>
            </a>
            {/* Shown on narrow screens and on touch-first devices, hidden only
                where there is room and a mouse. The game has no touch input. */}
            <p className="mt-3 text-sm text-stone sm:pointer-fine:hidden">
              {game.controlsHint}
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
