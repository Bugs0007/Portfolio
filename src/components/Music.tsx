import { music } from "@/content/site";
import { VideoClip } from "./VideoClip";
import { Reveal } from "./Reveal";

export function Music() {
  return (
    <section
      id="music"
      aria-label="Music"
      className="relative flex min-h-[62vh] w-full items-end overflow-hidden bg-ink"
    >
      <VideoClip
        poster={music.media.poster}
        src={music.media.loop}
        width={music.media.width}
        height={music.media.height}
        alt="Bhagath practicing guitar at home, seated, guitar in hand, a monitor glowing in the background."
        allowSound
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent"
      />
      <div className="relative z-10 w-full px-6 py-14 sm:px-10 lg:px-16">
        <Reveal>
          <h2 className="font-display text-4xl font-medium text-mist sm:text-5xl">
            Music
          </h2>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-mist/85 sm:text-base">
            {music.intro}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
