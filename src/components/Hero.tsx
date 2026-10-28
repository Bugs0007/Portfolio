import { person, education } from "@/content/site";
import { VideoClip } from "./VideoClip";

export function Hero() {
  return (
    <section id="intro" aria-label="Introduction" className="portfolio-hero">
      <div className="hero-opening">
        <div className="hero-heading">
          <div className="hero-kicker">
            <span>Software engineer & endlessly curious human</span>
            <span className="hero-location"><i /> {person.location}</span>
          </div>
          <h1 className="hero-name">
            BHAGATH<span className="sr-only"> Samalla</span><span aria-hidden className="hero-period">.</span>
          </h1>
          <div className="hero-byline">
            <span>SAMALLA <span className="hero-byline-divider">/</span> {education[0].gradYear} CS GRAD</span>
            <span>Building things. Collecting stories.</span>
          </div>
        </div>
        <div className="hero-film">
          <div className="hero-film-editorial">
            <span className="hero-film-label">A FEW THINGS ABOUT ME ↘</span>
            <div className="hero-film-copy">
              <p>Engineer{" "}<br />by craft.<br /><em>Explorer{" "}<br />at heart.</em></p>
              <a className="hero-work-link" href="#work">
                <span>Explore my work</span><span className="hero-link-arrow" aria-hidden>↓</span>
              </a>
            </div>
            <span className="hero-film-foot">CODE. CREATE. GET A LITTLE LOST.</span>
          </div>
          <div className="hero-video-frame">
            <VideoClip
              poster="/media/intro/intro-poster.jpg"
              src="/media/intro/intro.mp4"
              alt="Bhagath giving a peace sign to the camera, mountains and clouds behind him."
              width={1920}
              height={1080}
              fit="contain"
              sizes="(min-width: 800px) 65vw, 100vw"
              priority
            />
            <span className="hero-video-caption">OUT OF OFFICE, IN MY ELEMENT.</span>
          </div>
        </div>
      </div>
      <div className="hero-note">
        <span aria-hidden>✳</span><p>{person.tagline}</p>
        <span className="hero-note-end">A WORK IN PROGRESS.<br />AND ALWAYS WILL BE.</span>
      </div>
    </section>
  );
}
