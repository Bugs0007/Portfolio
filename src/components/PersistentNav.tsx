import { person } from "@/content/site";
import "./portfolio-chrome.css";

export function PersistentNav() {
  return (
    <nav aria-label="Primary" className="portfolio-nav">
      <a href="/#intro" className="portfolio-monogram" aria-label="Bhagath Samalla, back to introduction">
        Bhagath <span>Samalla</span>
      </a>
      <div className="portfolio-nav-sections">
        <a href="/#work">Selected work</a>
        <a href="/#music">Off duty</a>
        <a href="/#intro">About</a>
      </div>
      <div className="portfolio-nav-links">
        <a href="/resume" className="portfolio-resume">Résumé <span aria-hidden>↗</span></a>
        <a href={person.github} target="_blank" rel="noopener noreferrer">GitHub</a>
        <a href={person.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>
        <a href={`mailto:${person.email}`} className="portfolio-nav-email" aria-label="Email Bhagath">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M6 18 18 6M6 6h12v12" />
          </svg>
        </a>
      </div>
    </nav>
  );
}
