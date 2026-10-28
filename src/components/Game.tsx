import { game } from "@/content/site";
import { GameTrailer } from "./GameTrailer";
import { Reveal } from "./Reveal";

// The trailer stays lazy; the live game opens in its own window.
export function Game() {
  return (
    <section
      id="game"
      aria-label={game.name}
      className="chapter-game relative bg-ink"
    >
      <div className="chapter-inner">
        <Reveal>
          <p className="chapter-eyebrow"><span>02 / SIDE QUEST</span><span>BUILT TO BE PLAYED</span></p>
          <div className="chapter-game-heading">
            <h2 className="chapter-title chapter-title-light">{game.name}</h2>
            <p className="chapter-game-note">{game.blurb}</p>
          </div>
        </Reveal>

        <Reveal delay={0.1} className="game-media">
          <GameTrailer />
          <div className="chapter-game-actions">
            <a
              href={game.url}
              target="_blank"
              rel="noopener noreferrer"
              className="chapter-play-link inline-flex items-center gap-3 font-mono text-sm uppercase tracking-wider focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mist focus-visible:ring-offset-4 focus-visible:ring-offset-ink"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden>
                <path d="M8 5.5v13a1 1 0 0 0 1.5.86l11-6.5a1 1 0 0 0 0-1.72l-11-6.5A1 1 0 0 0 8 5.5Z" />
              </svg>
              Play the game <span aria-hidden>↗</span>
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
