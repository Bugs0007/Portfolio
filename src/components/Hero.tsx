import Image from "next/image";
import { person, education } from "@/content/site";

const college = education[0];

export function Hero() {
  return (
    <section
      aria-label="Introduction"
      className="relative flex min-h-svh w-full items-end overflow-hidden bg-ink"
    >
      <Image
        src="/media/travel/jispa-stargazing.jpg"
        alt="Bhagath standing beneath a dense, star-filled night sky at Jispa, Himachal Pradesh, silhouetted against a mountain ridge."
        fill
        priority
        sizes="100vw"
        quality={80}
        className="object-cover"
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
          {college.shortSchool} · Class of {college.gradYear} · {person.location}
        </p>
      </div>
    </section>
  );
}
