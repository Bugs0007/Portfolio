import { music } from "@/content/site";
import { VideoClip } from "./VideoClip";
import { Reveal } from "./Reveal";
import "./portfolio-chapters.css";

export function Music() {
  return (
    <section
      id="music"
      aria-label="Music"
      className="chapter-music relative flex w-full items-end overflow-hidden bg-ink"
    >
      <VideoClip
        poster={music.media.poster}
        src={music.media.loop}
        width={music.media.width}
        height={music.media.height}
        alt="Bhagath practicing guitar at home, seated, guitar in hand, a monitor glowing in the background."
        fit="cover"
        allowSound
        initiallyMuted={false}
      />
      <div
        aria-hidden
        className="chapter-cinema-shade absolute inset-0"
      />
      <div className="chapter-cinema-copy relative z-10 w-full">
        <Reveal>
          <p className="chapter-eyebrow"><span>03 / MUSIC</span><span>GUITAR & FLUTE</span></p>
          <h2 className="chapter-title chapter-title-light">
            A little<br /><em>out of tune.</em>
          </h2>
          <p className="chapter-cinema-note">
            {music.intro}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
