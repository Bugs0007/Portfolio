import { watchingEntries } from "@/content/watching";
import { Reveal } from "./Reveal";
import { WatchingCard } from "./WatchingCard";

export function Watching() {
  return (
    <section
      id="watching"
      aria-label="Watching"
      className="relative bg-ink px-6 py-24 sm:px-10 sm:py-32 lg:px-16"
    >
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <h2 className="font-display text-4xl font-medium text-mist sm:text-5xl">
            Watching
          </h2>
        </Reveal>
        <div className="mt-12 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-8">
          {watchingEntries.map((entry, i) => (
            <Reveal key={entry.slug} delay={i * 0.05}>
              <WatchingCard entry={entry} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
