import { SmoothScroll } from "@/components/SmoothScroll";
import { PersistentNav } from "@/components/PersistentNav";
import { SectionNav } from "@/components/SectionNav";
import { BackToTop } from "@/components/BackToTop";
import { Hero } from "@/components/Hero";
import { WorkRig } from "@/components/work/WorkRig";
import { Seam } from "@/components/Seam";
import { Music } from "@/components/Music";
import { TravelMap } from "@/components/TravelMap";
import { Art } from "@/components/Art";
import { Riding } from "@/components/Riding";
import { Game } from "@/components/Game";
import { Watching } from "@/components/Watching";
import { ContactFooter } from "@/components/ContactFooter";
import { OpeningGreeting } from "@/components/OpeningGreeting";
import { SideProvider, SidePane } from "@/components/side/SideContext";
import { SplitChooser } from "@/components/side/SplitChooser";

export default function Home() {
  return (
    <SideProvider>
      <OpeningGreeting />
      <SplitChooser />
      <div id="portfolio-page">
        <SmoothScroll>
          <a href="#work" className="skip-link">Skip to selected work</a>
          <PersistentNav />
          <SectionNav />
          <main>
            <Hero />
            <SidePane side="work">
              <WorkRig />
              <Game />
            </SidePane>
            <SidePane side="life">
              <Seam />
              <Music />
              <TravelMap />
              <Art />
              <Riding />
              <Watching />
            </SidePane>
          </main>
          <ContactFooter />
          <BackToTop />
        </SmoothScroll>
      </div>
    </SideProvider>
  );
}
