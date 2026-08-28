import { chromium } from "playwright";
import crypto from "node:crypto";

const BASE = process.env.VERIFY_BASE ?? "http://localhost:3100";

// The Work diagrams are meant to be a pure function of scroll position. So:
// sample the rendered state at Y, scroll well past it, come back to exactly Y,
// sample again. Identical samples mean nothing accumulated on the way through.
//
// This also covers the measured layout, not just the draw. The fit scale ends
// up in a computed transform, so a remeasure between the two probes that landed
// on a different scale would show here as a mismatch. That is what the scale
// quantisation in computeFit is protecting.
const SNAPSHOT = () => {
  const section = document.querySelector("#work");
  if (!section) return "no-section";
  const parts = [];
  for (const el of section.querySelectorAll("*")) {
    const s = getComputedStyle(el);
    const bits = [s.opacity, s.transform, s.strokeDashoffset, s.strokeDasharray];
    if (bits.some((b) => b && b !== "none" && b !== "1" && b !== "0px")) {
      parts.push(bits.join("|"));
    }
  }
  return parts.join("\n");
};

async function settle(page, y) {
  await page.evaluate((target) => window.scrollTo(0, target), y);
  await page.waitForTimeout(1400);
  return page.evaluate(() => Math.round(window.scrollY));
}

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForTimeout(1800);

const top = await page.evaluate(
  () => document.querySelector("#work").getBoundingClientRect().top + window.scrollY,
);

// Inside the first chapter's draw, inside the second chapter's draw, and inside
// the part of the second chapter where the frame is panning as well as drawing.
const PROBES = [
  ["chapter 1 draw", 1600],
  ["chapter 1 late", 2600],
  ["chapter 2 draw", 5200],
  ["chapter 2 pan", 8000],
];

const hash = (v) => crypto.createHash("sha1").update(v).digest("hex").slice(0, 10);
const rows = [];

for (const [label, offset] of PROBES) {
  const probe = Math.round(top + offset);

  const yA = await settle(page, probe);
  const a = await page.evaluate(SNAPSHOT);

  await settle(page, probe + 3200);
  await page.waitForTimeout(400);

  const yB = await settle(page, probe);
  const b = await page.evaluate(SNAPSHOT);

  rows.push({
    label,
    scrollMatch: yA === yB,
    y: `${yA}/${yB}`,
    animated: a.split("\n").filter(Boolean).length,
    domMatch: a === b,
    hashes: `${hash(a)}/${hash(b)}`,
  });
}
await context.close();

console.log("\n probe          | same scrollY | animated nodes | DOM identical");
console.log("----------------|--------------|----------------|---------------");
for (const r of rows) {
  console.log(
    ` ${r.label.padEnd(14)} | ${String(r.scrollMatch).padEnd(12)} | ${String(r.animated).padEnd(14)} | ${r.domMatch}`,
  );
  if (!r.domMatch) console.log(`     scrollY ${r.y}, snapshot ${r.hashes}`);
}
const bad = rows.filter((r) => !r.domMatch);
console.log(
  bad.length
    ? `\nNOT reversible at: ${bad.map((r) => r.label).join(", ")}`
    : "\nevery probe reversed exactly",
);

await browser.close();
