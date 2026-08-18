import { caseIntelShowcase } from "@/content/site";
import { Reveal } from "./Reveal";

const STATUS_COLOR: Record<string, string> = {
  match: "text-moss",
  attached: "text-moss",
  paid: "text-moss",
  invoiced: "text-jacket-bright",
};

// Real UI, not a screenshot: caseintel.in's own marketing page builds these
// four panels as plain HTML rather than images, so this rebuilds them in the
// portfolio's own tokens instead of embedding a picture of someone else's
// (well, his own, but still a different) design system.
export function CaseIntelShowcase() {
  return (
    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
      {caseIntelShowcase.map((panel, i) => (
        <Reveal key={panel.label} delay={i * 0.06}>
          <div className="border border-mist/10 p-4">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-xs text-jacket-bright">
                {panel.number}
              </span>
              <span className="font-mono text-xs uppercase tracking-wider text-stone">
                {panel.label}
              </span>
            </div>
            <p className="mt-2 text-sm leading-snug text-mist/90">
              {panel.headline}
            </p>
            <div className="mt-3 space-y-1.5 border-t border-mist/10 pt-3">
              {panel.rows.map((row) => (
                <div
                  key={row.primary}
                  className="flex items-center justify-between gap-2 font-mono text-[11px]"
                >
                  <span className="truncate text-mist/65">{row.primary}</span>
                  <span
                    className={`shrink-0 ${STATUS_COLOR[row.status] ?? "text-stone"}`}
                  >
                    {row.status}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-stone/60">
              {panel.stat.label}: <span className="text-stone">{panel.stat.value}</span>
            </p>
          </div>
        </Reveal>
      ))}
    </div>
  );
}
