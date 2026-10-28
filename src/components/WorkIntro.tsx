import { education, person, workItems } from "@/content/site";

const college = education[0];
const caseIntel = workItems.find((item) => item.id === "caseintel")!;
const headlineMetrics = caseIntel.metrics.filter((metric) =>
  ["districts scanned", "LangGraph pipeline", "tests passing"].includes(metric.label),
);

export function WorkIntro() {
  return (
    <header className="work-lead">
      <div className="work-lead-eyebrow">
        <span>01 / SELECTED WORK</span>
        <span>FROM FIRST PRINCIPLES TO PRODUCTION</span>
      </div>
      <div className="work-lead-grid">
        <h2>Built to work.<br /><em>Made to matter.</em></h2>
        <div className="work-lead-aside">
          <p>{person.summary}</p>
          <p className="work-lead-education">
            {college.degree}<br />
            {college.shortSchool}, {college.location} · {college.gradYear}
          </p>
          <a href="/resume">The full résumé <span aria-hidden>↗</span></a>
        </div>
      </div>
      <dl className="work-lead-metrics" aria-label="CaseIntel engineering highlights">
        {headlineMetrics.map((metric) => (
          <div key={metric.label}>
            <dt>CaseIntel <span aria-hidden> / </span>{metric.label}</dt>
            <dd>{metric.value}</dd>
          </div>
        ))}
      </dl>
    </header>
  );
}
