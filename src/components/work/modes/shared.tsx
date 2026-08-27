"use client";

import { education, type WorkItem } from "@/content/site";
import { Reveal } from "@/components/Reveal";

const college = education[0];

// The extracted numbers, rendered as pills. Module-private: SupportingCards is
// the only caller left now that the alternative Work treatments are gone.
function MetricPills({ metrics }: { metrics: WorkItem["metrics"] }) {
  if (metrics.length === 0) return null;
  return (
    <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
      {metrics.map((m) => (
        <li
          key={`${m.label}-${m.value}`}
          className="font-mono text-[11px] uppercase tracking-wider text-mist/70"
        >
          {m.from && m.to ? (
            <span>
              <span className="text-mist/40 line-through">{m.from}</span>
              <span className="mx-1 text-mist/40">→</span>
              <span className="text-jacket-bright">{m.to}</span>
            </span>
          ) : (
            <span className="text-jacket-bright">{m.value}</span>
          )}
          <span className="ml-1.5 text-mist/45">{m.label}</span>
        </li>
      ))}
    </ul>
  );
}


// The section chrome every non-classic mode reuses, matching classic's own
// heading exactly so switching modes changes the treatment and nothing else.
// Classic keeps its own copy inside Work.tsx, which is untouched.
export function WorkSectionShell({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <section id="work" aria-label="Work" className="relative bg-ink">
      <div className="px-6 pt-24 sm:px-10 sm:pt-32 lg:px-16">
        <div className="mx-auto max-w-4xl">
          <Reveal>
            <h2 className="font-display text-4xl font-medium text-mist sm:text-5xl">
              Work
            </h2>
            <p className="mt-3 max-w-xl font-mono text-xs uppercase tracking-wider text-stone">
              {college.degree} · {college.shortSchool} · {college.gradYear} ·{" "}
              {college.detail}
            </p>
            <p className="sr-only">Displayed in {label} mode.</p>
          </Reveal>
        </div>
      </div>
      {children}
    </section>
  );
}

export function StackTags({
  items,
  className = "mt-3",
}: {
  items: readonly string[];
  className?: string;
}) {
  return (
    <ul className={`flex flex-wrap gap-1.5 ${className}`} aria-label="Stack">
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

// The compact card the pinned modes (tube, pipeline, product) render for every
// non-featured item. It is a full record, not a teaser: summary, every bullet,
// every metric and the stack, so switching into one of those modes never
// removes a sentence that classic showed.
export function SupportingCards({ items }: { items: WorkItem[] }) {
  if (items.length === 0) return null;
  return (
    <div className="px-6 pb-24 sm:px-10 sm:pb-32 lg:px-16">
      <div className="mx-auto max-w-4xl">
        <Reveal>
          <h3 className="font-mono text-xs uppercase tracking-wider text-stone">
            Projects
          </h3>
        </Reveal>
        <div className="mt-4 space-y-10">
          {items.map((item) => (
            <Reveal key={item.id}>
              <article className="border-t border-mist/10 pt-6">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h4 className="font-body text-lg font-semibold text-mist">
                    {item.title}
                  </h4>
                  {item.when && (
                    <span className="font-mono text-xs text-stone/70">
                      {item.when}
                    </span>
                  )}
                  {item.href && (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-sm font-mono text-xs text-jacket-bright underline decoration-jacket-bright/40 underline-offset-4 hover:decoration-jacket-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jacket-bright"
                    >
                      {item.href.replace("https://", "")}
                    </a>
                  )}
                </div>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-mist/85">
                  {item.summary}
                </p>
                <ul className="mt-2 max-w-2xl space-y-1.5">
                  {item.bullets.map((b) => (
                    <li key={b} className="text-sm leading-relaxed text-mist/60">
                      {b}
                    </li>
                  ))}
                </ul>
                <MetricPills metrics={item.metrics} />
                <StackTags items={item.stack} />
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}

