import { person } from "@/content/site";
import { Reveal } from "./Reveal";
import "./portfolio-chrome.css";

export function ContactFooter() {
  return (
    <footer id="contact" aria-label="Contact" className="portfolio-footer">
      <div className="portfolio-footer-inner">
        <div className="portfolio-footer-eyebrow">
          <span><span className="portfolio-footer-dot" aria-hidden /> A conversation starts here</span>
          <span>{person.location}</span>
        </div>
        <Reveal>
          <div className="portfolio-footer-invitation">
            <h2>Have something<br />in <em>mind?</em></h2>
            <a href={`mailto:${person.email}`} className="portfolio-footer-arrow" aria-label="Start a conversation with Bhagath by email">
              <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
                <path d="M10 38 38 10M10 10h28v28" />
              </svg>
            </a>
          </div>
          <div className="portfolio-footer-email-row">
            <p>Email works best.<br />I&rsquo;m slower on everything else.</p>
            <a href={`mailto:${person.email}`} className="portfolio-footer-email">{person.email}<span aria-hidden>↗</span></a>
          </div>
        </Reveal>
        <div className="portfolio-footer-bottom">
          <a href="/#intro" className="portfolio-footer-signature" aria-label="Back to introduction">Bhagath Samalla<span aria-hidden>↟</span></a>
          <div className="portfolio-footer-socials">
            <a href={person.github} target="_blank" rel="noopener noreferrer">GitHub <span aria-hidden>↗</span></a>
            <a href={person.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn <span aria-hidden>↗</span></a>
            <a href={person.instagram} target="_blank" rel="noopener noreferrer">Instagram <span aria-hidden>↗</span></a>
          </div>
          <span className="portfolio-footer-copyright">© {new Date().getFullYear()}</span>
        </div>
      </div>
    </footer>
  );
}
