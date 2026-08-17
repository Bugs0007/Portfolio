import type { Metadata } from "next";
import Link from "next/link";
import { person, education, experience, projects } from "@/content/site";

export const metadata: Metadata = {
  title: "Bhagath Samalla, Résumé",
  description: "Résumé for Bhagath Samalla, backend engineer.",
};

export default function ResumePage() {
  return (
    <div className="min-h-svh bg-mist px-6 py-16 text-ink sm:px-10 sm:py-20 print:bg-white print:py-8">
      <div className="mx-auto max-w-2xl">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-ink/15 pb-6">
          <h1 className="font-display text-4xl font-medium">{person.name}</h1>
          <Link
            href="/"
            className="font-mono text-xs uppercase tracking-wider text-ink/60 underline underline-offset-4 hover:text-jacket print:hidden"
          >
            ← back to site
          </Link>
        </div>

        <p className="mt-4 font-mono text-xs uppercase tracking-wider text-ink/60">
          {person.location} · {person.phone} · {person.email}
        </p>
        <p className="mt-1 font-mono text-xs uppercase tracking-wider text-ink/60">
          {person.github} · {person.linkedin.replace("https://www.", "")}
        </p>

        <p className="mt-6 max-w-xl text-sm leading-relaxed text-ink/85">
          {person.summary}
        </p>

        <section className="mt-10">
          <h2 className="font-mono text-xs uppercase tracking-wider text-ink/50">
            Education
          </h2>
          {education.map((school) => (
            <p key={school.school} className="mt-2 text-sm leading-relaxed">
              <span className="font-semibold">{school.school}</span>,{" "}
              {school.location}, {school.degree}, {school.years}.{" "}
              {school.detail}.
            </p>
          ))}
        </section>

        <section className="mt-10">
          <h2 className="font-mono text-xs uppercase tracking-wider text-ink/50">
            Experience
          </h2>
          {experience.map((job) => (
            <div key={job.company} className="mt-3">
              <p className="text-sm font-semibold">
                {job.company}, {job.role}{" "}
                <span className="font-normal text-ink/60">({job.dates})</span>
              </p>
              {job.href && (
                <a
                  href={job.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-ink/50 underline underline-offset-4 hover:text-jacket"
                >
                  {job.href.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
                </a>
              )}
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-ink/85">
                {job.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section className="mt-10">
          <h2 className="font-mono text-xs uppercase tracking-wider text-ink/50">
            Projects
          </h2>
          {projects.map((project) => (
            <div key={project.name} className="mt-3">
              <p className="text-sm font-semibold">
                {project.name}
                {project.year && (
                  <span className="font-normal text-ink/60">, {project.year}</span>
                )}
                {project.status && (
                  <span className="font-normal text-ink/60"> ({project.status})</span>
                )}
                {project.href && (
                  <span className="font-normal text-ink/60">
                    , {project.linkLabel ?? project.href.replace("https://", "")}
                  </span>
                )}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-ink/85">
                {project.summary} {project.decision}
              </p>
              {project.highlights && (
                <ul className="mt-1 list-disc space-y-1 pl-5 text-sm leading-relaxed text-ink/85">
                  {project.highlights.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
              )}
              <p className="mt-1 font-mono text-xs text-ink/50">
                {project.stack.join(" · ")}
              </p>
            </div>
          ))}
        </section>

        <section className="mt-10">
          <h2 className="font-mono text-xs uppercase tracking-wider text-ink/50">
            Stack
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink/85">
            {person.stack.join(" · ")}
          </p>
        </section>
      </div>
    </div>
  );
}
