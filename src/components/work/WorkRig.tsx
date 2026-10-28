import {
  experience,
  supportingWorkItems,
  workItems,
  type ProjectLink,
} from "@/content/site";
import { WorkIntro } from "@/components/WorkIntro";
import { LearningPlatforms } from "@/components/LearningPlatforms";
import { ProjectTrailer } from "@/components/ProjectTrailer";
import "./selected-work.css";

const caseIntel = workItems.find((item) => item.id === "caseintel")!;

function Stack({ items }: { items: readonly string[] }) {
  return (
    <ul className="selected-work-stack" aria-label="Technology stack">
      {items.map((item) => <li key={item}>{item}</li>)}
    </ul>
  );
}

function Links({ links }: { links: readonly ProjectLink[] }) {
  return (
    <div className="selected-work-links">
      {links.map((link) => (
        <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer">
          {link.label}<span aria-hidden>↗</span>
        </a>
      ))}
    </div>
  );
}

function CaseIntelFeature() {
  return (
    <article className="caseintel-feature" aria-labelledby="caseintel-title">
      <div className="selected-work-section-label"><span>THE FEATURED BUILD</span><span>01 / 2026</span></div>
      <div className="caseintel-feature-grid">
        <div className="caseintel-feature-copy">
          <span className="caseintel-feature-category">LEGAL TECH / APPLIED AI</span>
          <h3 id="caseintel-title">CaseIntel<span aria-hidden>↗</span></h3>
          <p className="caseintel-feature-statement">From court records<br />to a working practice.</p>
          <p className="caseintel-feature-summary">{caseIntel.summary}</p>
          <p className="caseintel-feature-decision">{caseIntel.bullets[0]}</p>
          <a className="caseintel-visit" href={caseIntel.href} target="_blank" rel="noopener noreferrer">Explore the live platform<span aria-hidden>↗</span><span className="sr-only"> (opens in a new tab)</span></a>
          <div className="caseintel-feature-stack"><Stack items={caseIntel.stack} /></div>
        </div>
        <ProjectTrailer
          name="CaseIntel"
          src="/media/projects/case-intel-launch.mp4"
          poster="/media/projects/case-intel-launch-poster.png"
          width={1920}
          height={1080}
        />
      </div>
      <div className="caseintel-engineering">
        <div className="caseintel-engineering-heading"><h4>Under the surface.</h4><p>A connected system from ingestion to everyday practice.</p></div>
        <ol className="caseintel-architecture">
          <li><span className="caseintel-step-number">01 / INGEST</span><h5>Court data, made usable.</h5><p>eCourts sessions, CAPTCHA and advocate search feed case records into the platform.</p><span className="caseintel-step-tags">eCourts → Django → PostgreSQL</span></li>
          <li><span className="caseintel-step-number">02 / RETRIEVE</span><h5>Answers with their sources.</h5><p>Three LangGraph nodes connect HyDE expansion, hybrid search and source-referenced answers.</p><span className="caseintel-step-tags">pgvector + full text / RRF</span></li>
          <li><span className="caseintel-step-number">03 / PRACTICE</span><h5>The next step, connected.</h5><p>Eight cause-list types, hearing records, attached orders and invoicing in one multi-tenant platform.</p><span className="caseintel-step-tags">Find → Appear → Record → Bill</span></li>
        </ol>
      </div>
    </article>
  );
}

function SupportingProjects() {
  return (
    <div className="selected-work-supporting">
      <div className="selected-work-section-label"><h3>MORE EXPERIMENTS, REAL SYSTEMS</h3><span>THE PROJECT ARCHIVE</span></div>
      <div className="selected-work-project-grid">
        {supportingWorkItems.map((item, index) => (
          <article className="selected-project" key={item.id}>
            <div className="selected-project-index"><span>{String(index + 2).padStart(2, "0")}</span><span>{item.when || "SIDE PROJECT"}</span></div>
            <h4>{item.title}</h4>
            <p className="selected-project-summary">{item.summary}</p>
            {item.metrics.length > 0 && <p className="selected-project-metric"><strong>{item.metrics[0].value}</strong><span>{item.metrics[0].label}</span></p>}
            <details className="selected-work-details">
              <summary>Engineering notes <span aria-hidden>+</span></summary>
              <div>
                {item.bullets.map((bullet) => <p key={bullet}>{bullet}</p>)}
                {item.metrics.length > 1 && <dl className="selected-project-metrics">{item.metrics.slice(1).map((metric) => <div key={metric.label}><dt>{metric.label}</dt><dd>{metric.from && metric.to ? `${metric.from} → ${metric.to}` : metric.value}{metric.note && <small>{metric.note}</small>}</dd></div>)}</dl>}
              </div>
            </details>
            <Stack items={item.stack} />
            {item.links && <Links links={item.links} />}
          </article>
        ))}
      </div>
    </div>
  );
}

function ExperienceFeature() {
  return (
    <div className="selected-work-experience experience-feature">
      <div className="selected-work-section-label"><h3>EXPERIENCE</h3><span>SHIPPED WITH A TEAM</span></div>
      {experience.map((job) => (
        <article className="brynklabs-feature" key={job.company} aria-labelledby="brynklabs-title">
          <div className="brynklabs-feature-heading">
            <p className="brynklabs-feature-date">{job.dates}</p>
            <h3 id="brynklabs-title">{job.company}<span aria-hidden>↗</span></h3>
            <p className="brynklabs-feature-role">{job.role}</p>
            <p className="brynklabs-feature-intro">{workItems.find((item) => item.id === "brynklabs")?.summary}</p>
            <Links links={[{ href: job.href, label: "Company website" }]} />
          </div>
          <div className="brynklabs-feature-body">
            <ul>{job.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>
            <Stack items={job.stack} />
          </div>
        </article>
      ))}
    </div>
  );
}

// Native document flow renders once on the server. The former scroll-driven
// diagram rig remains in /modes for reference, but is not shipped to this page.
export function WorkRig() {
  return (
    <section id="work" aria-label="Selected work" className="selected-work">
      <div className="selected-work-inner">
        <WorkIntro />
        <ExperienceFeature />
        <CaseIntelFeature />
        <div className="selected-work-learning"><LearningPlatforms /></div>
        <SupportingProjects />
      </div>
    </section>
  );
}
