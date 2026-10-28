import Image from "next/image";
import { riding } from "@/content/site";
import { Reveal } from "./Reveal";
import { RidingGallery } from "./RidingGallery";

export function Riding() {
  const namedRide = riding.namedRides[0];

  return (
    <section id="riding" aria-label="Riding" className="chapter-riding relative bg-ink">
      <div className="chapter-riding-hero relative flex w-full items-end overflow-hidden">
        <Image
          src={riding.hero.src}
          alt={riding.hero.alt}
          fill
          sizes="100vw"
          className="object-cover object-bottom"
        />
        <div
          aria-hidden
          className="chapter-cinema-shade absolute inset-0"
        />
        <div className="chapter-cinema-copy relative z-10 w-full">
          <Reveal>
            <p className="chapter-eyebrow"><span>06 / RIDING</span><span>TWO WHEELS. NO HURRY.</span></p>
            <h2 className="chapter-title chapter-title-light">
              Take the<br /><em>long way.</em>
            </h2>
            {riding.bike && (
              <p className="mt-2 font-mono text-xs uppercase tracking-wider text-stone">
                {riding.bike}
              </p>
            )}
            {namedRide && (
              <p className="chapter-cinema-note">
                <span className="text-mist">{namedRide.name}.</span>{" "}
                {namedRide.note}
              </p>
            )}
          </Reveal>
        </div>
      </div>

      <div className="chapter-riding-photos">
        <RidingGallery />
      </div>
    </section>
  );
}
