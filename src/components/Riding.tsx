import Image from "next/image";
import { riding } from "@/content/site";
import { VideoClip } from "./VideoClip";
import { Reveal } from "./Reveal";

export function Riding() {
  const namedRide = riding.namedRides[0];

  return (
    <section id="riding" aria-label="Riding" className="relative bg-ink">
      <div className="relative flex min-h-[75vh] w-full items-end overflow-hidden">
        <VideoClip
          poster={riding.video.poster}
          src={riding.video.loop}
          width={riding.video.width}
          height={riding.video.height}
          alt={riding.video.alt}
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

      <div className="px-6 py-16 sm:px-10 lg:px-16">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 sm:gap-4">
          {riding.photos.map((photo, i) => (
            <Reveal
              key={photo.src}
              delay={i * 0.05}
              className={i === 0 ? "col-span-2" : undefined}
            >
              <div
                className="relative overflow-hidden bg-ink-soft"
                style={{ aspectRatio: `${photo.width} / ${photo.height}` }}
              >
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes="(min-width: 640px) 20vw, 50vw"
                  className="object-cover"
                />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
