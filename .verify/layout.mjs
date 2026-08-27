import { chromium } from "playwright";

const BASE = "http://localhost:3100";
const MODES = ["classic", "tube", "pipeline", "product", "metrics", "terminal"];

const AUDIT = () => {
  const section = document.querySelector("#work");
  const vw = document.documentElement.clientWidth;
  const issues = [];

  // Horizontal overflow of the document is always a bug on this site.
  if (document.documentElement.scrollWidth > vw + 1) {
    issues.push(`document scrollWidth ${document.documentElement.scrollWidth} > viewport ${vw}`);
  }

  for (const el of section.querySelectorAll("*")) {
    const s = getComputedStyle(el);
    if (s.display === "none" || s.visibility === "hidden") continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;

    // Text clipped by its own box (overflow hidden and content taller/wider).
    const clipsY = s.overflowY === "hidden" || s.overflow === "hidden";
    const clipsX = s.overflowX === "hidden" || s.overflow === "hidden";
    if (clipsY && el.scrollHeight > el.clientHeight + 4 && el.textContent.trim().length > 30) {
      issues.push(`clipped vertically: <${el.tagName}> "${el.textContent.trim().slice(0, 44)}" ${el.scrollHeight}>${el.clientHeight}`);
    }
    if (clipsX && el.scrollWidth > el.clientWidth + 4 && el.textContent.trim().length > 30) {
      issues.push(`clipped horizontally: <${el.tagName}> "${el.textContent.trim().slice(0, 44)}"`);
    }
    // Content pushed outside the viewport horizontally.
    if (r.left < -2 || r.right > vw + 2) {
      if (el.textContent.trim().length > 12 && !el.closest("svg")) {
        issues.push(`outside viewport x: <${el.tagName}> "${el.textContent.trim().slice(0, 40)}" [${Math.round(r.left)}..${Math.round(r.right)}]`);
      }
    }
  }
  return [...new Set(issues)];
};

const browser = await chromium.launch();
for (const width of [1440, 390]) {
  console.log(`\n===== viewport ${width}px =====`);
  for (const mode of MODES) {
    const c = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 900 } });
    const p = await c.newPage();
    await p.goto(`${BASE}/?workMode=${mode}`, { waitUntil: "networkidle" });
    await p.waitForTimeout(1500);
    const box = await p.evaluate(() => {
      const s = document.querySelector("#work");
      return { top: s.getBoundingClientRect().top + window.scrollY, h: s.scrollHeight };
    });
    const all = [];
    for (const frac of [0.15, 0.4, 0.65, 0.9]) {
      await p.evaluate((y) => window.scrollTo(0, y), Math.round(box.top + box.h * frac));
      await p.waitForTimeout(1400);
      all.push(...(await p.evaluate(AUDIT)));
    }
    const uniq = [...new Set(all)];
    console.log(` ${mode.padEnd(9)} : ${uniq.length ? uniq.length + " issue(s)" : "clean"}`);
    uniq.slice(0, 5).forEach((i) => console.log(`     - ${i}`));
    await c.close();
  }
}
await browser.close();
