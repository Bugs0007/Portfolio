import { watching } from "@/content/site";
import { Reveal } from "./Reveal";

// A real empty state, not stubbed with placeholder titles.
export function Watching() {
  return (
    <section
      id="watching"
      aria-label="Watching"
      className="relative bg-ink px-6 py-24 sm:px-10 sm:py-32 lg:px-16"
    >
      <div className="mx-auto max-w-3xl">
        <Reveal>
          <h2 className="font-display text-4xl font-medium text-mist sm:text-5xl">
            Watching
          </h2>
          {watching.length > 0 ? (
            <div className="mt-10 flex gap-6 overflow-x-auto pb-4">
              {watching.map((item) => (
                <div
                  key={item.title}
                  className="min-w-[160px] font-mono text-xs text-mist/80"
                >
                  {item.title}
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-mist/70 sm:text-base">
              Favorites list coming soon.
            </p>
          )}
        </Reveal>
      </div>
    </section>
  );
}
