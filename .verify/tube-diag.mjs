import { chromium } from "playwright";
import crypto from "node:crypto";

const BASE = "http://localhost:3100";
const hash = (b) => crypto.createHash("sha1").update(b).digest("hex").slice(0, 10);

const SNAP = () => {
  const out = [];
  for (const el of document.querySelectorAll("#work *")) {
    const s = getComputedStyle(el);
    if (s.opacity !== "1" || s.transform !== "none") {
      out.push(`${el.tagName}.${el.className?.toString().slice(0, 40)} op=${s.opacity} tf=${s.transform.slice(0, 40)}`);
    }
  }
  return out;
};

async function settle(page, y) {
  await page.evaluate((t) => window.scrollTo(0, t), y);
  await page.waitForTimeout(1400);
  return page.evaluate(() => Math.round(window.scrollY));
}

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
await page.goto(`${BASE}/?workMode=tube`, { waitUntil: "networkidle" });
await page.waitForTimeout(2000);

const top = await page.evaluate(
  () => document.querySelector("#work").getBoundingClientRect().top + window.scrollY,
);
const probe = Math.round(top + 2200);

await settle(page, probe);
const canvas = page.locator("#work canvas");

// Is the canvas even stable when nothing moves?
const s1 = await canvas.screenshot();
await page.waitForTimeout(700);
const s2 = await canvas.screenshot();
console.log("canvas stable while stationary:", hash(s1) === hash(s2), hash(s1), hash(s2));

const domA = await SNAPvia(page);
await settle(page, probe + 3200);
await settle(page, probe);
const s3 = await canvas.screenshot();
const domB = await SNAPvia(page);

console.log("canvas identical after round trip:", hash(s2) === hash(s3), hash(s2), hash(s3));

const added = domB.filter((x) => !domA.includes(x));
const removed = domA.filter((x) => !domB.includes(x));
console.log("\nDOM nodes differing after round trip:");
console.log("  only-before:", removed.length ? removed : "none");
console.log("  only-after :", added.length ? added : "none");

async function SNAPvia(p) {
  return p.evaluate(SNAP);
}

await browser.close();
