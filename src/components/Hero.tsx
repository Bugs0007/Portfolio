import { person, education } from "@/content/site";
import { VideoClip } from "./VideoClip";

const college = education[0];

export function Hero() {
  return (
    <section
      aria-label="Introduction"
      className="relative flex min-h-svh w-full items-end overflow-hidden bg-ink"
    >
      <VideoClip
        poster="/media/intro/intro-poster.jpg"
        src="/media/intro/intro.mp4"
        alt="Bhagath giving a peace sign to the camera, mountains and clouds behind him."
        width={1080}
        height={1920}
        fit="cover"
      />
      {/* type sits on the image, not beside it: legibility gradient only, no card */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-ink via-ink/25 to-transparent"
      />

      <div className="relative z-10 w-full px-6 pb-16 sm:px-10 sm:pb-20 lg:px-16">
        <h1 className="font-display text-[15vw] leading-[0.92] font-medium tracking-tight text-mist sm:text-[9vw] lg:text-[7.5vw]">
          Bhagath{" "}
          <br />
          Samalla
        </h1>
        <p className="mt-6 max-w-xl font-body text-base text-mist/85 sm:text-lg">
          {person.tagline}
        </p>
        <p className="mt-2 font-mono text-xs uppercase tracking-wider text-stone">
          {college.shortSchool} · {college.gradYear} Grad · {person.location}
        </p>
      </div>
    </section>
  );
}
