import Image from "next/image";
import { riding } from "@/content/site";
import { MediaFrame } from "./TravelMap";
import { Reveal } from "./Reveal";

export function Riding() {
  const namedRide = riding.namedRides[0];

  return (
    <section id="riding" aria-label="Riding" className="relative bg-ink">
      <div className="relative flex min-h-[75vh] w-full items-end overflow-hidden">
        <Image
          src={riding.hero.src}
          alt={riding.hero.alt}
          fill
          sizes="100vw"
          priority
          className="object-cover object-bottom"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent"
        />
        <div className="relative z-10 w-full px-6 py-14 sm:px-10 lg:px-16">
          <Reveal>
            <span aria-hidden className="mb-5 block h-1 w-10 bg-ember" />
            <h2 className="font-display text-4xl font-medium text-mist sm:text-5xl">
              Riding
            </h2>
            {riding.bike && (
              <p className="mt-2 font-mono text-xs uppercase tracking-wider text-stone">
                {riding.bike}
              </p>
            )}
            {namedRide && (
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-mist/80 sm:text-base">
                <span className="text-mist">{namedRide.name}.</span>{" "}
                {namedRide.note}
              </p>
            )}
          </Reveal>
        </div>
      </div>

      {/* Uniform ratio on every cell regardless of span, and the spans add up
          to exactly the column count (2+1+1+1+1=6) so nothing wraps onto an
          empty row by itself. Both were bugs in the previous version. */}
      <div className="px-6 py-16 sm:px-10 lg:px-16">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-6 sm:gap-4">
          {riding.photos.map((photo, i) => (
            <Reveal
              key={photo.src}
              delay={i * 0.05}
              className={i === 0 ? "col-span-2" : undefined}
            >
              <figure className="relative aspect-[3/2] overflow-hidden bg-ink-soft">
                <MediaFrame media={photo} />
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
