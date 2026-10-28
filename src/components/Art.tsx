import { art } from "@/content/site";
import { ArtGallery } from "./ArtGallery";
import { Reveal } from "./Reveal";

// Paintings and sketchbook pages render whole, never cropped.
export function Art() {
  return (
    <section
      id="art"
      aria-label="Art"
      className="chapter-art relative"
    >
      <div className="chapter-inner">
        <Reveal>
          <p className="chapter-eyebrow"><span>05 / ART</span><span>AN ANALOG PRACTICE</span></p>
          <div className="chapter-art-heading">
            <h2 className="chapter-title">Away from<br /><em>the keyboard.</em></h2>
            <p className="chapter-art-note">{art.note}</p>
          </div>
        </Reveal>
      </div>
      <div className="chapter-inner chapter-art-gallery">
        <ArtGallery />
      </div>
    </section>
  );
}
