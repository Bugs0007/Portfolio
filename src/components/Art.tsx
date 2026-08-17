import Image from "next/image";
import { art } from "@/content/site";
import { Reveal } from "./Reveal";

// The one deliberate light passage in an otherwise dark site, per the
// design plan. Paintings render whole, never cropped.
export function Art() {
  return (
    <section
      id="art"
      aria-label="Art"
      className="relative bg-mist px-6 py-24 text-ink sm:px-10 sm:py-32 lg:px-16"
    >
      <div className="mx-auto max-w-5xl">
        <Reveal>
          <h2 className="font-display text-4xl font-medium sm:text-5xl">Art</h2>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-ink/75 sm:text-base">
            {art.note}
          </p>
        </Reveal>
        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-6">
          {art.paintings.map((painting, i) => (
            <Reveal key={painting.src} delay={i * 0.08}>
              <div
                className="relative overflow-hidden bg-ink/5"
                style={{ aspectRatio: `${painting.width} / ${painting.height}` }}
              >
                <Image
                  src={painting.src}
                  alt={painting.alt}
                  fill
                  sizes="(min-width: 640px) 33vw, 100vw"
                  className="object-contain"
                />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
