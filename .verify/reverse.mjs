import { chromium } from "playwright";
import crypto from "node:crypto";

const BASE = "http://localhost:3100";

// A mode is meant to be a pure function of scroll position. So: sample the
// rendered state at Y, scroll well past it, come back to exactly Y, sample
// again. Identical samples mean nothing accumulated on the way through.
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
const rows = [];

for (const mode of ["pipeline", "product", "metrics", "terminal", "tube"]) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${BASE}/?workMode=${mode}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  const top = await page.evaluate(
    () => document.querySelector("#work").getBoundingClientRect().top + window.scrollY,
  );
  const probe = Math.round(top + 2200);

  const yA = await settle(page, probe);
  const a = await page.evaluate(SNAPSHOT);
  const shotA = mode === "tube" ? await page.locator("#work canvas").screenshot() : null;

  await settle(page, probe + 3200);
  await page.waitForTimeout(400);

  const yB = await settle(page, probe);
  const b = await page.evaluate(SNAPSHOT);
  const shotB = mode === "tube" ? await page.locator("#work canvas").screenshot() : null;

  const hash = (v) => (v ? crypto.createHash("sha1").update(v).digest("hex").slice(0, 10) : "-");
  const domMatch = a === b;
  const pixelMatch = shotA ? hash(shotA) === hash(shotB) : null;

  rows.push({
    mode,
    scrollMatch: yA === yB,
    y: `${yA}/${yB}`,
    animated: a.split("\n").filter(Boolean).length,
    domMatch,
    pixelMatch,
  });

  await context.close();
}

console.log("\n mode     | same scrollY | animated nodes | DOM identical | canvas identical");
console.log("----------|--------------|----------------|---------------|-----------------");
for (const r of rows) {
  console.log(
    ` ${r.mode.padEnd(8)} | ${String(r.scrollMatch).padEnd(12)} | ${String(r.animated).padEnd(14)} | ${String(r.domMatch).padEnd(13)} | ${r.pixelMatch === null ? "n/a" : r.pixelMatch}`,
  );
}
const bad = rows.filter((r) => !r.domMatch || r.pixelMatch === false);
console.log(bad.length ? `\nNOT reversible: ${bad.map((r) => r.mode).join(", ")}` : "\nall modes reversed exactly");

await browser.close();
