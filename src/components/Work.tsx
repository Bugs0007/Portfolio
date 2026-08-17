import { education, experience, projects } from "@/content/site";
import { Reveal } from "./Reveal";

const college = education[0];

function StackTags({ items }: { items: readonly string[] }) {
  return (
    <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Stack">
      {items.map((item) => (
        <li
          key={item}
          className="rounded-full border border-mist/20 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-stone"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

export function Work() {
  return (
    <section
      id="work"
      aria-label="Work"
      className="relative bg-ink px-6 py-24 sm:px-10 sm:py-32 lg:px-16"
    >
      <div className="mx-auto max-w-4xl">
        <Reveal>
          <h2 className="font-display text-4xl font-medium text-mist sm:text-5xl">
            Work
          </h2>
          <p className="mt-3 max-w-xl font-mono text-xs uppercase tracking-wider text-stone">
            {college.degree} · {college.shortSchool} · {college.gradYear} ·{" "}
            {college.detail}
          </p>
        </Reveal>

        {/* Experience */}
        <div className="mt-16">
          {experience.map((job) => (
            <Reveal key={job.company}>
              <div className="grid gap-4 border-t border-mist/10 pt-6 sm:grid-cols-[200px_1fr]">
                <div>
                  <h3 className="font-body text-lg font-semibold text-mist">
                    {job.href ? (
                      <a
                        href={job.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline decoration-mist/30 underline-offset-4 transition-colors hover:text-jacket-bright hover:decoration-jacket-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jacket-bright rounded-sm"
                      >
                        {job.company}
                      </a>
                    ) : (
                      job.company
                    )}
                  </h3>
                  <p className="font-mono text-xs uppercase tracking-wider text-stone">
                    {job.role}
                  </p>
                  <p className="font-mono text-xs text-stone/70">{job.dates}</p>
                </div>
                <div>
                  <ul className="space-y-2.5">
                    {job.bullets.map((b) => (
                      <li key={b} className="text-sm leading-relaxed text-mist/85">
                        {b}
                      </li>
                    ))}
                  </ul>
                  <StackTags items={job.stack} />
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Projects */}
        <div className="mt-16">
          <Reveal>
            <h3 className="font-mono text-xs uppercase tracking-wider text-stone">
              Projects
            </h3>
          </Reveal>
          <div className="mt-4 space-y-10">
            {projects.map((project) => (
              <Reveal key={project.name}>
                <div className="border-t border-mist/10 pt-6">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h4 className="font-body text-lg font-semibold text-mist">
                      {project.name}
                    </h4>
                    {project.year && (
                      <span className="font-mono text-xs text-stone/70">
                        {project.year}
                      </span>
                    )}
                    {project.status && (
                      <span className="font-mono text-xs uppercase tracking-wider text-moss">
                        {project.status}
                      </span>
                    )}
                    {project.href && (
                      <a
                        href={project.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-xs text-jacket-bright underline decoration-jacket-bright/40 underline-offset-4 hover:decoration-jacket-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jacket-bright rounded-sm"
                      >
                        {project.linkLabel ?? project.href.replace("https://", "")}
                      </a>
                    )}
                  </div>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-mist/85">
                    {project.summary}
                  </p>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-mist/60">
                    {project.decision}
                  </p>
                  {project.highlights && (
                    <ul className="mt-2 max-w-2xl list-disc space-y-1.5 pl-4 marker:text-stone/50">
                      {project.highlights.map((h) => (
                        <li
                          key={h}
                          className="text-sm leading-relaxed text-mist/60"
                        >
                          {h}
                        </li>
                      ))}
                    </ul>
                  )}
                  <StackTags items={project.stack} />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
