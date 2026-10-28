"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { journeys, type Journey } from "@/content/site";
import { VideoClip } from "./VideoClip";
import { TravelAlbum } from "./travel/TravelViews";
import "./travel-gallery.css";

const FEATURED: Record<string, string> = {
  zanskar: "gonbo-rangjon",
  "manali-winter": "manali-portrait",
  coimbatore: "coimbatore-valley",
  uttarakhand: "badrinath",
};
const number = (value: number) => String(value).padStart(2, "0");
const frameCount = journeys.reduce((sum, trip) => sum + trip.media.length, 0);
function albumFor(journey: Journey) {
  const stem = (src: string) => src.split("/").pop()?.replace(/\.[^.]+$/, "").toLowerCase();
  const cover = journey.media.find((media) => stem(media.src) === FEATURED[journey.id]);
  return cover ? [cover, ...journey.media.filter((media) => media !== cover)] : journey.media;
}

export function TravelMap() {
  const [destination, setDestination] = useState(0);
  const journey = journeys[destination];
  const album = useMemo(() => albumFor(journey), [journey]);

  return (
    <section id="travel" aria-labelledby="travel-heading" className="travel-journal">
      <header className="travel-journal-heading">
        <div className="travel-journal-eyebrow"><span>04 / FIELD NOTES IN MOTION</span><span>{number(journeys.length)} JOURNEYS · {frameCount} FRAMES</span></div>
        <div className="travel-journal-title-row"><h2 id="travel-heading">Further from<br /><em>the familiar.</em></h2><p>A few places that stayed with me.<br />A moving collection of moments.</p></div>
      </header>
      <div className="travel-journal-destinations" role="group" aria-label="Travel destinations">{journeys.map((trip, index) => <button key={trip.id} type="button" onClick={() => setDestination(index)} aria-pressed={destination === index} aria-controls="travel-album"><span>{number(index + 1)}</span><strong>{trip.title}</strong><small>{trip.when}</small><span className="travel-destination-arrow" aria-hidden>↗</span></button>)}</div>
      <TravelAlbum key={journey.id} journey={journey} album={album} />
    </section>
  );
}

type Playable = { kind: "image" | "video"; src: string; poster?: string; width: number; height: number; alt: string };
export function MediaFrame({ media, sizes = "(min-width: 640px) 52vw, 82vw", fit = "contain", soon, near }: { media: Playable; sizes?: string; fit?: "contain" | "cover"; soon?: boolean; near?: boolean }) {
  if (media.kind === "video" && media.poster) return <VideoClip poster={media.poster} src={media.src} width={media.width} height={media.height} alt={media.alt} fit={fit} sizes={sizes} soon={soon} near={near} />;
  return <Image src={media.src} alt={media.alt} fill sizes={sizes} loading={soon ? "eager" : "lazy"} fetchPriority={soon ? "high" : undefined} className={fit === "contain" ? "object-contain" : "object-cover"} />;
}
