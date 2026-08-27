import { chromium } from "playwright";
import sharp from "sharp";
import crypto from "node:crypto";

const BASE = "http://localhost:3100";
const hash = (b) => crypto.createHash("sha1").update(b).digest("hex").slice(0, 8);

async function raw(buf) {
  return sharp(buf).raw().toBuffer({ resolveWithObject: true });
}
async function diff(a, b) {
  const A = await raw(a);
  const B = await raw(b);
  if (A.data.length !== B.data.length) return { pct: 100, note: "size differs" };
  let changed = 0;
  let total = 0;
  for (let i = 0; i < A.data.length; i += 4) {
    const d =
      Math.abs(A.data[i] - B.data[i]) +
      Math.abs(A.data[i + 1] - B.data[i + 1]) +
      Math.abs(A.data[i + 2] - B.data[i + 2]);
    if (d > 6) changed++;
    total++;
  }
  return { pct: ((changed / total) * 100).toFixed(3), changed, total };
}

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
await page.goto(`${BASE}/?workMode=tube`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);

const top = await page.evaluate(
  () => document.querySelector("#work").getBoundingClientRect().top + window.scrollY,
);
const probe = Math.round(top + 2200);
const canvas = page.locator("#work canvas");

const go = async (y, wait) => {
  await page.evaluate((t) => window.scrollTo(0, t), y);
  await page.waitForTimeout(wait);
  return page.evaluate(() => window.scrollY);
};

await go(probe, 2000);
const base = await canvas.screenshot();

await go(probe + 3200, 2000);
const yBack = await go(probe, 2000);
const after2s = await canvas.screenshot();
await page.waitForTimeout(3000);
const after5s = await canvas.screenshot();

console.log("scrollY back at:", yBack, "(probe", probe, ")");
console.log("base       :", hash(base));
console.log("after 2s   :", hash(after2s), "diff vs base:", (await diff(base, after2s)).pct + "% of pixels");
console.log("after +3s  :", hash(after5s), "diff vs base:", (await diff(base, after5s)).pct + "% of pixels");

await browser.close();
