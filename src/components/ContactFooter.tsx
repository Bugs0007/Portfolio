import { person } from "@/content/site";
import { Reveal } from "./Reveal";

export function ContactFooter() {
  return (
    <footer
      id="contact"
      aria-label="Contact"
      className="relative bg-ink px-6 py-24 sm:px-10 sm:py-32 lg:px-16"
    >
      <div className="mx-auto max-w-3xl">
        <Reveal>
          <h2 className="font-display text-4xl font-medium text-mist sm:text-6xl">
            Get in touch
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-mist/75 sm:text-base">
            Email works best. I&rsquo;m slower on everything else.
          </p>
          <a
            href={`mailto:${person.email}`}
            className="mt-8 inline-block font-display text-2xl text-jacket-bright underline decoration-jacket-bright/40 underline-offset-8 transition-colors hover:decoration-jacket-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jacket-bright focus-visible:ring-offset-4 focus-visible:ring-offset-ink sm:text-3xl"
          >
            {person.email}
          </a>

          <div className="mt-14 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-mist/10 pt-6 font-mono text-xs uppercase tracking-wider text-stone">
            <a
              href={person.github}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-jacket-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jacket-bright rounded-sm"
            >
              GitHub
            </a>
            <a
              href={person.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-jacket-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jacket-bright rounded-sm"
            >
              LinkedIn
            </a>
            <a
              href={person.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-jacket-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jacket-bright rounded-sm"
            >
              Instagram
            </a>
            <span className="ml-auto text-stone/60">
              {person.name} · {new Date().getFullYear()}
            </span>
          </div>
        </Reveal>
      </div>
    </footer>
  );
}
