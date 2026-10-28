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
      className="chapter-favorites relative bg-ink"
    >
      <div className="chapter-inner">
        <Reveal>
          <p className="chapter-eyebrow"><span>07 / ON REPEAT</span><span>MY FAVORITES</span></p>
          <h2 className="chapter-title chapter-title-light">
            Good stories<br /><em>stay with you.</em>
          </h2>
        </Reveal>

        {CATEGORY_ORDER.map(({ key, label }) => {
          const entries = watchingEntries.filter((e) => e.category === key);
          if (entries.length === 0) return null;
          return (
            <div key={key} className="chapter-favorite-category">
              <Reveal>
                <h3 className="chapter-category-label">
                  {label}<span aria-hidden>{String(entries.length).padStart(2, "0")}</span>
                </h3>
              </Reveal>
              {/* Five thumbnail-scale columns at desktop width instead of three
                  larger ones: this category's 5 entries then fill exactly one
                  row instead of wrapping to two, which was the actual source of
                  this section running long, not the padding around it. */}
              <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-5">
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
