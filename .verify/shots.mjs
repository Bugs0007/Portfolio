import { chromium } from "playwright";

const BASE = "http://localhost:3100";
const browser = await chromium.launch();

// Confirm the one metric that deliberately does not count (from="hours" is not
// a number) still renders its full text.
{
  const c = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await c.newPage();
  await p.goto(`${BASE}/?workMode=metrics`, { waitUntil: "networkidle" });
  await p.waitForTimeout(1200);
  const found = await p.evaluate(() =>
    (document.querySelector("#work").textContent ?? "").includes("hours \u2192 under 15 min"),
  );
  console.log('static (non-counting) metric "hours -> under 15 min" present:', found);
  await c.close();
}

const SHOTS = [
  ["pipeline", 0.45],
  ["pipeline", 0.72],
  ["product", 0.3],
  ["product", 0.6],
  ["metrics", 0.12],
  ["terminal", 0.18],
  ["tube", 0.35],
];

for (const [mode, frac] of SHOTS) {
  const c = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await c.newPage();
  await p.goto(`${BASE}/?workMode=${mode}`, { waitUntil: "networkidle" });
  await p.waitForTimeout(2000);
  const box = await p.evaluate(() => {
    const s = document.querySelector("#work");
    const r = s.getBoundingClientRect();
    return { top: r.top + window.scrollY, height: s.scrollHeight };
  });
  await p.evaluate((y) => window.scrollTo(0, y), Math.round(box.top + box.height * frac));
  await p.waitForTimeout(2200);
  await p.screenshot({ path: `.verify/${mode}-${String(frac).replace(".", "")}.png` });
  await c.close();
}
console.log("screenshots written");
await browser.close();
