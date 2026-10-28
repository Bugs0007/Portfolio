import Image from "next/image";
import { Reveal } from "./Reveal";

export function Seam() {
  return (
    <section className="portfolio-seam" aria-label="Life beyond work">
      <div className="editorial-eyebrow"><span>END OF THE WORKDAY</span><span>THE REST OF THE STORY ↘</span></div>
      <div className="seam-composition">
        <Reveal className="seam-type"><p>There&rsquo;s more<br />to life than<br /><em>a screen.</em><span className="seam-asterisk" aria-hidden>✳</span></p></Reveal>
        <figure className="seam-photo"><Image src="/media/travel/originals/gonbo-rangjon.jpg" alt="Gonbo Rangjon rising above the Zanskar valley." fill sizes="(min-width: 800px) 35vw, 65vw" className="object-cover" /><figcaption>Somewhere in Zanskar. Far from my desk.</figcaption></figure>
      </div>
      <div className="seam-bottom"><p>A sketchbook, six strings, an open road.<br />Here&rsquo;s what happens when I log off.</p><a href="#music" aria-label="Explore life beyond work">↓</a></div>
    </section>
  );
}
