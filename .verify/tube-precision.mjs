import { chromium } from "playwright";
import crypto from "node:crypto";

const BASE = "http://localhost:3100";
const hash = (b) => crypto.createHash("sha1").update(b).digest("hex").slice(0, 10);

async function settle(page, y) {
  await page.evaluate((t) => window.scrollTo(0, t), y);
  await page.waitForTimeout(1500);
  return page.evaluate(() => window.scrollY);
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
const canvas = page.locator("#work canvas");

const yA = await settle(page, probe);
const a = hash(await canvas.screenshot());

await settle(page, probe + 3200);
const yB = await settle(page, probe);
const b = hash(await canvas.screenshot());

console.log("scrollY before round trip:", yA);
console.log("scrollY after  round trip:", yB);
console.log("difference (px):", Math.abs(yA - yB));
console.log("canvas hashes:", a, b, a === b ? "IDENTICAL" : "differ");

// Now force the exact same fractional scroll position both times and re-shoot.
await page.evaluate((y) => window.scrollTo(0, y), yA);
await page.waitForTimeout(1500);
const yC = await page.evaluate(() => window.scrollY);
const c = hash(await canvas.screenshot());
console.log("\nforced back to exactly", yA, "-> landed at", yC);
console.log("canvas at that position:", c, c === a ? "IDENTICAL to first sample" : "still differs");

await browser.close();
