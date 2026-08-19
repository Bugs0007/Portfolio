import { existsSync } from "fs";
import { join } from "path";
import { watchingEntries, type WatchingCategory } from "@/content/watching";
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

// Fixed order regardless of how entries happen to be listed in the content
// file. A category with zero entries just doesn't render its heading.
const CATEGORY_ORDER: { key: WatchingCategory; label: string }[] = [
  { key: "anime", label: "Anime" },
  { key: "movie", label: "Movies" },
  { key: "show", label: "Shows" },
];

export function Watching() {
  return (
    <section
      id="favorites"
      aria-label="My Favorites"
      className="relative bg-ink px-6 py-24 sm:px-10 sm:py-32 lg:px-16"
    >
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <h2 className="font-display text-4xl font-medium text-mist sm:text-5xl">
            My Favorites
          </h2>
        </Reveal>

        {CATEGORY_ORDER.map(({ key, label }) => {
          const entries = watchingEntries.filter((e) => e.category === key);
          if (entries.length === 0) return null;
          return (
            <div key={key} className="mt-14 first:mt-12">
              <Reveal>
                <h3 className="font-mono text-xs uppercase tracking-wider text-stone">
                  {label}
                </h3>
              </Reveal>
              <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-8">
                {entries.map((entry, i) => (
                  <Reveal key={entry.slug} delay={i * 0.05}>
                    <WatchingCard entry={entry} hasPoster={hasPoster(entry.slug)} />
                  </Reveal>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
