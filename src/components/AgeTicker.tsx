"use client";

import { useEffect, useState } from "react";
import { birthMoment } from "@/content/site";

const BIRTH = new Date(birthMoment).getTime();
// Ages are counted in IST wall time, where the birthday actually happens.
const IST = 330 * 60_000;
const pad = (n: number) => String(n).padStart(2, "0");

export function ageParts(now: number) {
  const n = new Date(now + IST);
  const b = new Date(BIRTH + IST);
  const at = (year: number) =>
    Date.UTC(year, b.getUTCMonth(), b.getUTCDate(), b.getUTCHours(), b.getUTCMinutes(), b.getUTCSeconds()) - IST;
  let years = n.getUTCFullYear() - b.getUTCFullYear();
  if (now < at(b.getUTCFullYear() + years)) years -= 1;
  let rest = Math.floor((now - at(b.getUTCFullYear() + years)) / 1000);
  const days = Math.floor(rest / 86_400);
  rest -= days * 86_400;
  const hours = Math.floor(rest / 3600);
  rest -= hours * 3600;
  const minutes = Math.floor(rest / 60);
  return { years, days, hours, minutes, seconds: rest - minutes * 60 };
}

// A live age, to the second. Renders a fixed-width placeholder on the server
// and before mount, so hydration matches and nothing shifts when it starts.
export function AgeTicker({ className }: { className?: string }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = requestAnimationFrame(tick);
    const id = window.setInterval(tick, 1000);
    return () => {
      cancelAnimationFrame(first);
      window.clearInterval(id);
    };
  }, []);

  const p = now === null ? null : ageParts(now);
  const text = p
    ? `${p.years}y ${String(p.days).padStart(3, "0")}d ${pad(p.hours)}:${pad(p.minutes)}:${pad(p.seconds)}`
    : "--y ---d --:--:--";

  return (
    <span className={className} title="Born 31 December 2004, around 7 PM IST">
      <span className="age-ticker-label">Uptime</span>{" "}
      <span className="age-ticker-value" aria-hidden>{text}</span>
      {p && (
        <span className="sr-only">
          {p.years} years and {p.days} days
        </span>
      )}
    </span>
  );
}
