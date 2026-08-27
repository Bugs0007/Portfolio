import { art } from "@/content/site";
import { ArtGallery } from "./ArtGallery";
import { Reveal } from "./Reveal";

// The one deliberate light passage in an otherwise dark site, per the design
// plan. Paintings and sketchbook pages render whole, never cropped.
//
// Deliberately the calmest section on the site: justified rows, one fade as
// they arrive, and a lightbox. It was a drag-to-explore canvas for a while and
// the interaction was doing more work than the pictures were.
export function Art() {
  return (
    <section
      id="art"
      aria-label="Art"
      className="relative bg-mist px-6 py-24 text-ink sm:px-10 sm:py-32 lg:px-16"
    >
      <div className="mx-auto max-w-5xl">
        <Reveal>
          <h2 className="font-display text-4xl font-medium sm:text-5xl">Art</h2>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-ink/75 sm:text-base">
            {art.note}
          </p>
        </Reveal>
      </div>
      <div className="mx-auto max-w-6xl">
        <ArtGallery />
      </div>
    </section>
  );
}
