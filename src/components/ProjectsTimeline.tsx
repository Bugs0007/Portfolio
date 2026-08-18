"use client";

import { useRef } from "react";
import { motion, useScroll } from "motion/react";
import type { Project } from "@/content/site";
import { Reveal } from "./Reveal";

// A left-rail progress line that fills as the reader scrolls past the list,
// per scroll-progress-timeline: measured against the rail's own bounds, not
// the page, and using scaleY so it stays on the compositor.
export function ProjectsTimeline({ projects }: { projects: Project[] }) {
  const ref = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.85", "end 0.4"],
  });

  return (
    <ol ref={ref} className="relative mt-2 list-none space-y-8">
      <div
        aria-hidden
        className="absolute left-3 top-1 bottom-1 w-px bg-ink/10"
      />
      <motion.div
        aria-hidden
        className="absolute left-3 top-1 w-px origin-top bg-jacket"
        style={{ scaleY: scrollYProgress, height: "calc(100% - 0.5rem)" }}
      />
      {projects.map((project, i) => (
        <Reveal key={project.name} delay={i * 0.04}>
          <li className="flex gap-4">
            <span className="w-6 shrink-0 pt-0.5 text-center font-mono text-[10px] text-ink/40">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">
                {project.name}
                {project.year && (
                  <span className="font-normal text-ink/60">
                    , {project.year}
                  </span>
                )}
                {project.status && (
                  <span className="font-normal text-ink/60">
                    {" "}
                    ({project.status})
                  </span>
                )}
                {project.href && (
                  <span className="font-normal text-ink/60">
                    ,{" "}
                    {project.linkLabel ??
                      project.href.replace("https://", "")}
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
          </li>
        </Reveal>
      ))}
    </ol>
  );
}
