import { existsSync } from "fs";
import { join } from "path";
import { watchingEntries } from "@/content/watching";
import { Reveal } from "./Reveal";
import { WatchingCard } from "./WatchingCard";

// Server-side existence check, not a client-side onError fallback: requesting
// a poster that isn't there yet means an image-optimizer round trip that
// fails on every load (Next's /_next/image 400s on a missing local file), so
// this decides up front whether to ask for it at all. Drop a real
// <slug>.jpg into public/media/watching/ and it's picked up automatically,
// no other code needs to change.
function hasPoster(slug: string) {
  return existsSync(join(process.cwd(), "public", "media", "watching", `${slug}.jpg`));
}

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
              <WatchingCard entry={entry} hasPoster={hasPoster(entry.slug)} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
