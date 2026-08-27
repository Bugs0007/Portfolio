import { chromium } from "playwright";
import crypto from "node:crypto";

const BASE = "http://localhost:3100";
const hash = (v) => crypto.createHash("sha1").update(v).digest("hex").slice(0, 8);

const SNAPSHOT = () => {
  const section = document.querySelector("#work");
  if (!section) return "no-section";
  const parts = [];
  for (const el of section.querySelectorAll("*")) {
    const s = getComputedStyle(el);
    const moving =
      s.opacity !== "1" ||
      s.transform !== "none" ||
      (s.strokeDashoffset && s.strokeDashoffset !== "0px");
    if (moving) parts.push(`${s.opacity}|${s.transform}|${s.strokeDashoffset}`);
  }
  return parts.join("\n");
};

async function settle(page, y) {
  await page.evaluate((t) => window.scrollTo(0, t), y);
  await page.waitForTimeout(2000);
  return page.evaluate(() => window.scrollY);
}

const browser = await chromium.launch();
const rows = [];

for (const mode of ["pipeline", "product", "metrics", "terminal", "tube"]) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${BASE}/?workMode=${mode}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);

  const top = await page.evaluate(
    () => document.querySelector("#work").getBoundingClientRect().top + window.scrollY,
  );

  for (const offset of [900, 2200, 3800]) {
    const probe = Math.round(top + offset);
    const yA = await settle(page, probe);
    const a = await page.evaluate(SNAPSHOT);
    const shotA = mode === "tube" ? await page.locator("#work canvas").screenshot() : null;

    await settle(page, probe + 3400);
    const yB = await settle(page, probe);
    const b = await page.evaluate(SNAPSHOT);
    const shotB = mode === "tube" ? await page.locator("#work canvas").screenshot() : null;

    rows.push({
      mode,
      offset,
      sameY: yA === yB,
      moving: a.split("\n").filter(Boolean).length,
      dom: a === b,
      canvas: shotA ? hash(shotA) === hash(shotB) : null,
    });
  }
  await context.close();
}

console.log("\n mode     | probe | same Y | moving nodes | DOM identical | canvas identical");
console.log("----------|-------|--------|--------------|---------------|-----------------");
for (const r of rows) {
  console.log(
    ` ${r.mode.padEnd(8)} | ${String(r.offset).padEnd(5)} | ${String(r.sameY).padEnd(6)} | ${String(r.moving).padEnd(12)} | ${String(r.dom).padEnd(13)} | ${r.canvas === null ? "n/a" : r.canvas}`,
  );
}
const bad = rows.filter((r) => !r.dom || r.canvas === false);
console.log(bad.length ? `\nNOT reversible: ${bad.map((r) => r.mode + "@" + r.offset).join(", ")}` : "\nevery mode reversed exactly at every probe");

await browser.close();
