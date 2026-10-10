"use client";

import Image from "next/image";
import { useState } from "react";
import {
  learningPlatforms,
  learningPlatformsIntro,
  type LearningPlatform,
} from "@/content/site";
import { Reveal } from "./Reveal";

// Sits directly under CaseIntel in Work, in both the pinned layout and the
// stacked fallback. It fills whatever width its parent gives it and decides
// its own columns with a container query, so the same component works inside
// the narrow classic column and the wide pinned one.
//
// Every screenshot is in the HTML at once, stacked, and the thumbnails only
// change which one is visible. That keeps all of them reachable without
// JavaScript, for crawlers, and under reduced motion (which just drops the
// fade).

function Stage({ platform }: { platform: LearningPlatform }) {
  const [active, setActive] = useState(0);
  const shot = platform.shots[active];

  return (
    <div>
      <div className="overflow-hidden rounded-sm border border-mist/15 bg-ink-soft">
        <div className="flex h-7 items-center gap-1.5 border-b border-mist/10 px-3">
          <span aria-hidden className="size-2 rounded-full bg-mist/15" />
          <span aria-hidden className="size-2 rounded-full bg-mist/15" />
          <span aria-hidden className="size-2 rounded-full bg-mist/15" />
          <span className="ml-auto truncate font-mono text-[10px] uppercase tracking-wider text-stone/70">
            {platform.name.toLowerCase()} / {shot.label.toLowerCase()}
          </span>
        </div>
        <div
          className="relative w-full"
          style={{ aspectRatio: `${shot.width} / ${shot.height}` }}
        >
          {platform.shots.map((s, i) => (
            <Image
              key={s.src}
              src={s.src}
              alt={s.alt}
              width={s.width}
              height={s.height}
              sizes="(min-width: 1024px) 700px, 100vw"
              aria-hidden={i === active ? undefined : true}
              className={`absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-500 motion-reduce:transition-none ${
                i === active ? "opacity-100" : "opacity-0"
              }`}
            />
          ))}
        </div>
      </div>

      <p
        className="mt-3 min-h-[2.5rem] text-sm leading-relaxed text-mist/70"
        aria-live="polite"
      >
        {shot.caption}
      </p>

      <ul
        className="mt-3 grid gap-2"
        style={{
          gridTemplateColumns: `repeat(${platform.shots.length}, minmax(0, 1fr))`,
        }}
        aria-label={`${platform.name} screenshots`}
      >
        {platform.shots.map((s, i) => (
          <li key={s.src}>
            <button
              type="button"
              onClick={() => setActive(i)}
              aria-pressed={i === active}
              aria-label={`Show ${s.label} screenshot`}
              className={`group block w-full rounded-sm text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jacket-bright ${
                i === active ? "" : "opacity-60 hover:opacity-100"
              } transition-opacity`}
            >
              <span
                className={`block overflow-hidden rounded-sm border ${
                  i === active ? "border-jacket-bright" : "border-mist/15"
                }`}
              >
                <Image
                  src={s.src}
                  alt=""
                  width={s.width}
                  height={s.height}
                  sizes="160px"
                  className="aspect-[16/10] w-full object-cover object-top"
                />
              </span>
              <span className="mt-1.5 block truncate font-mono text-[10px] uppercase tracking-wider text-stone">
                {s.label}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Platform({
  platform,
  flip,
}: {
  platform: LearningPlatform;
  flip: boolean;
}) {
  return (
    <article className="border-t border-mist/10 pt-8">
      <div className="grid gap-8 @5xl:grid-cols-12 @5xl:gap-12">
        <div
          className={`order-2 @5xl:col-span-5 ${flip ? "@5xl:order-2" : "@5xl:order-1"}`}
        >
          <p className="font-mono text-xs uppercase tracking-wider text-stone">
            {platform.kind}
            {platform.when && (
              <span className="text-stone/70">{` · ${platform.when}`}</span>
            )}
          </p>
          <h4 className="mt-2 font-display text-3xl font-medium text-mist sm:text-4xl">
            {platform.name}
          </h4>
          <p className="mt-1 font-body text-base text-jacket-bright">
            {platform.tagline}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-mist/85">
            {platform.pitch}
          </p>

          <dl className="mt-6 grid grid-cols-3 gap-4 border-y border-mist/10 py-4">
            {platform.stats.map((s) => (
              <div key={s.label} className="flex flex-col">
                <dt className="order-2 mt-1.5 font-mono text-[10px] uppercase leading-snug tracking-wider text-stone">
                  {s.label}
                </dt>
                <dd className="font-display text-3xl font-medium leading-none text-jacket-bright sm:text-4xl">
                  {s.value}
                </dd>
              </div>
            ))}
          </dl>

          <ul className="mt-6 space-y-3">
            {platform.points.map((point) => (
              <li
                key={point}
                className="relative pl-4 text-sm leading-relaxed text-mist/70"
              >
                <span
                  aria-hidden
                  className="absolute left-0 top-1.5 h-[calc(100%-0.75rem)] w-px bg-jacket-bright/50"
                />
                {point}
              </li>
            ))}
          </ul>

          <ul className="mt-5 flex flex-wrap gap-1.5" aria-label="Stack">
            {platform.stack.map((item) => (
              <li
                key={item}
                className="rounded-full border border-mist/20 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-stone"
              >
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-6 flex flex-wrap gap-3">
            {platform.links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-sm border border-mist/25 px-4 py-2 font-mono text-xs uppercase tracking-wider text-mist transition-colors hover:border-jacket-bright hover:text-jacket-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jacket-bright"
              >
                {link.label}
                <span className="sr-only">
                  {` for ${platform.name} (opens in a new tab)`}
                </span>
              </a>
            ))}
          </div>
        </div>

        <div
          className={`order-1 min-w-0 @5xl:col-span-7 ${flip ? "@5xl:order-1" : "@5xl:order-2"}`}
        >
          <Stage platform={platform} />
        </div>
      </div>
    </article>
  );
}

export function LearningPlatforms() {
  return (
    <div id="learning-platforms" className="@container">
      <Reveal>
        <h3 className="font-mono text-xs uppercase tracking-wider text-stone">
          Learning platforms
        </h3>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-mist/70">
          {learningPlatformsIntro}
        </p>
      </Reveal>
      <div className="mt-6 space-y-16">
        {learningPlatforms.map((platform, i) => (
          <Reveal key={platform.id}>
            <Platform platform={platform} flip={i % 2 === 1} />
          </Reveal>
        ))}
      </div>
    </div>
  );
}
