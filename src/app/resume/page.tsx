import type { Metadata } from "next";
import Link from "next/link";
import { person, education, experience, projects } from "@/content/site";
import { WordReveal } from "@/components/WordReveal";
import { ProjectsTimeline } from "@/components/ProjectsTimeline";
import { Reveal } from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Bhagath Samalla, Résumé",
  description: "Résumé for Bhagath Samalla, backend engineer.",
};

export default function ResumePage() {
  return (
    <div className="min-h-svh bg-mist px-6 py-16 text-ink sm:px-10 sm:py-20 print:bg-white print:py-8">
      <div className="mx-auto max-w-2xl">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-ink/15 pb-6">
          <h1 className="font-display text-4xl font-medium">
            <WordReveal text={person.name} />
          </h1>
          <Link
            href="/"
            className="font-mono text-xs uppercase tracking-wider text-ink/60 underline underline-offset-4 hover:text-jacket print:hidden"
          >
            ← back to site
          </Link>
        </div>

        <p className="mt-4 font-mono text-xs uppercase tracking-wider text-ink/60">
          {person.location} · {person.phone}
        </p>
        <p className="mt-1 font-mono text-xs uppercase tracking-wider text-ink/60">
          {person.github} · {person.linkedin.replace("https://www.", "")}
        </p>

        <Reveal>
          <p className="mt-6 max-w-xl text-sm leading-relaxed text-ink/85">
            {person.summary}
          </p>
        </Reveal>

        <section className="mt-10">
          <h2 className="font-mono text-xs uppercase tracking-wider text-ink/50">
            Education
          </h2>
          <div className="mt-2 space-y-2">
            {education.map((school, i) => (
              <Reveal key={school.school} delay={i * 0.05}>
                <p className="flex gap-3 text-sm leading-relaxed">
                  <span className="w-6 shrink-0 pt-0.5 text-center font-mono text-[10px] text-ink/40">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>
                    <span className="font-semibold">{school.school}</span>,{" "}
                    {school.location}, {school.degree}, {school.years}.{" "}
                    {school.detail}.
                  </span>
                </p>
              </Reveal>
            ))}
          </div>
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
              <ul className="mt-2 space-y-1 pl-0 text-sm leading-relaxed text-ink/85">
                {job.bullets.map((b, i) => (
                  <Reveal key={b} delay={i * 0.04}>
                    <li className="flex gap-2">
                      <span aria-hidden className="text-ink/30">
                        ·
                      </span>
                      <span>{b}</span>
                    </li>
                  </Reveal>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section className="mt-10">
          <h2 className="font-mono text-xs uppercase tracking-wider text-ink/50">
            Projects
          </h2>
          <ProjectsTimeline projects={projects} />
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
