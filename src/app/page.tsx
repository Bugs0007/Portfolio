import { SmoothScroll } from "@/components/SmoothScroll";
import { PersistentNav } from "@/components/PersistentNav";
import { Hero } from "@/components/Hero";
import { WorkRig } from "@/components/work/WorkRig";
import { Seam } from "@/components/Seam";
import { Music } from "@/components/Music";
import { TravelMap } from "@/components/TravelMap";
import { Art } from "@/components/Art";
import { Riding } from "@/components/Riding";
import { Watching } from "@/components/Watching";
import { ContactFooter } from "@/components/ContactFooter";

export default function Home() {
  return (
    <SmoothScroll>
      <PersistentNav />
      <main>
        <Hero />
        <WorkRig />
        <Seam />
        <Music />
        <TravelMap />
        <Art />
        <Riding />
        <Watching />
      </main>
      <ContactFooter />
    </SmoothScroll>
  );
}
