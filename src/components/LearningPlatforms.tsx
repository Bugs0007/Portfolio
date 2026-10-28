import {
  learningPlatforms,
  learningPlatformsIntro,
  type LearningPlatform,
} from "@/content/site";
import { ProjectTrailer } from "./ProjectTrailer";
import { Reveal } from "./Reveal";

function Platform({
  platform,
  flip,
}: {
  platform: LearningPlatform;
  flip: boolean;
}) {
  return (
    <article className="border-t border-mist/10 pt-8">
      <div className="grid gap-8 @5xl:grid-cols-12 @5xl:gap-12">
        <div
          className={`order-2 @5xl:col-span-5 ${flip ? "@5xl:order-2" : "@5xl:order-1"}`}
        >
          <p className="font-mono text-xs uppercase tracking-wider text-stone">
            {platform.kind}
            {platform.when && (
              <span className="text-stone/70">{` · ${platform.when}`}</span>
            )}
          </p>
          <h4 className="mt-2 font-display text-3xl font-medium text-mist sm:text-4xl">
            {platform.name}
          </h4>
          <p className="mt-1 font-body text-base text-jacket-bright">
            {platform.tagline}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-mist/85">
            {platform.pitch}
          </p>

          <dl className="mt-6 grid grid-cols-3 gap-4 border-y border-mist/10 py-4">
            {platform.stats.map((s) => (
              <div key={s.label} className="flex flex-col">
                <dt className="order-2 mt-1.5 font-mono text-[10px] uppercase leading-snug tracking-wider text-stone">
                  {s.label}
                </dt>
                <dd className="font-display text-3xl font-medium leading-none text-jacket-bright sm:text-4xl">
                  {s.value}
                </dd>
              </div>
            ))}
          </dl>

          <ul className="mt-6 space-y-3">
            {platform.points.map((point) => (
              <li
                key={point}
                className="relative pl-4 text-sm leading-relaxed text-mist/70"
              >
                <span
                  aria-hidden
                  className="absolute left-0 top-1.5 h-[calc(100%-0.75rem)] w-px bg-jacket-bright/50"
                />
                {point}
              </li>
            ))}
          </ul>

          <ul className="mt-5 flex flex-wrap gap-1.5" aria-label="Stack">
            {platform.stack.map((item) => (
              <li
                key={item}
                className="rounded-full border border-mist/20 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-stone"
              >
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-6 flex flex-wrap gap-3">
            {platform.links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-sm border border-mist/25 px-4 py-2 font-mono text-xs uppercase tracking-wider text-mist transition-colors hover:border-jacket-bright hover:text-jacket-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jacket-bright"
              >
                {link.label}
                <span className="sr-only">
                  {` for ${platform.name} (opens in a new tab)`}
                </span>
              </a>
            ))}
          </div>
        </div>

        <div
          className={`order-1 min-w-0 @5xl:col-span-7 ${flip ? "@5xl:order-1" : "@5xl:order-2"}`}
        >
          <ProjectTrailer
            name={platform.name}
            src={platform.id === "tracewise" ? "/media/projects/tracewise-launch.mp4" : "/media/projects/nines-launch.mp4"}
            poster={platform.id === "tracewise" ? "/media/projects/tracewise-launch-poster.png" : "/media/projects/nines-launch-poster.png"}
            width={platform.id === "tracewise" ? 1080 : 1920}
            height={1080}
          />
        </div>
      </div>
    </article>
  );
}

export function LearningPlatforms() {
  return (
    <div id="learning-platforms" className="@container">
      <Reveal>
        <h3 className="font-mono text-xs uppercase tracking-wider text-stone">
          Learning platforms
        </h3>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-mist/70">
          {learningPlatformsIntro}
        </p>
      </Reveal>
      <div className="mt-6 space-y-16">
        {learningPlatforms.map((platform, i) => (
          <Reveal key={platform.id}>
            <Platform platform={platform} flip={i % 2 === 1} />
          </Reveal>
        ))}
      </div>
    </div>
  );
}
