import { chromium } from "playwright";

const BASE = process.env.VERIFY_BASE ?? "http://localhost:3100";

// The regression test for the bug class the Work diagrams were rebuilt to kill:
// text clipped by its own box, and content pushed outside the frame it lives in.
//
// The zoom cases are the point. Browser zoom shrinks the CSS viewport, so 150%
// and 200% of a 1440x900 window are exactly 960x600 and 720x450 in CSS pixels.
// Emulating them as smaller viewports is emulating them correctly.
const VIEWPORTS = [
  { label: "1920 x 1080", width: 1920, height: 1080 },
  { label: "1440 x 900", width: 1440, height: 900 },
  { label: "1440 @ 150% zoom", width: 960, height: 600 },
  { label: "1440 @ 200% zoom", width: 720, height: 450 },
  { label: "1280 x 800", width: 1280, height: 800 },
  { label: "1100 x 900", width: 1100, height: 900 },
  { label: "860 x 900", width: 860, height: 900 },
  { label: "390 x 844", width: 390, height: 844 },
];

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

    // The diagram frame clips on purpose: it is a window the composition pans
    // through when the composition is taller than it. Its scrollHeight is
    // therefore always larger than its clientHeight and would report here every
    // time. Everything inside it is still checked, by the diagram-geom audit.
    if (el.hasAttribute("data-diagram-frame")) continue;

    // Text clipped by its own box (overflow hidden and content taller/wider).
    const clipsY = s.overflowY === "hidden" || s.overflow === "hidden";
    const clipsX = s.overflowX === "hidden" || s.overflow === "hidden";
    if (clipsY && el.scrollHeight > el.clientHeight + 4 && el.textContent.trim().length > 30) {
      issues.push(`clipped vertically: <${el.tagName}> "${el.textContent.trim().slice(0, 44)}" ${el.scrollHeight}>${el.clientHeight}`);
    }
    if (clipsX && el.scrollWidth > el.clientWidth + 4 && el.textContent.trim().length > 30) {
      issues.push(`clipped horizontally: <${el.tagName}> "${el.textContent.trim().slice(0, 44)}"`);
    }
    // Content pushed outside the viewport horizontally. Diagram node labels are
    // real HTML now rather than SVG text, so they no longer get the svg
    // exemption below and a bad fit fails here loudly instead of passing.
    if (r.left < -2 || r.right > vw + 2) {
      if (el.textContent.trim().length > 12 && !el.closest("svg")) {
        issues.push(`outside viewport x: <${el.tagName}> "${el.textContent.trim().slice(0, 40)}" [${Math.round(r.left)}..${Math.round(r.right)}]`);
      }
    }
  }
  return [...new Set(issues)];
};

const browser = await chromium.launch();
let total = 0;
for (const vp of VIEWPORTS) {
  const c = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  const p = await c.newPage();
  await p.goto(BASE, { waitUntil: "networkidle" });
  await p.waitForTimeout(1800);
  const box = await p.evaluate(() => {
    const s = document.querySelector("#work");
    return { top: s.getBoundingClientRect().top + window.scrollY, h: s.scrollHeight };
  });
  const all = [];
  for (const frac of [0.1, 0.25, 0.4, 0.55, 0.7, 0.85]) {
    await p.evaluate((y) => window.scrollTo(0, y), Math.round(box.top + box.h * frac));
    await p.waitForTimeout(1200);
    all.push(...(await p.evaluate(AUDIT)));
  }
  const uniq = [...new Set(all)];
  total += uniq.length;
  console.log(` ${vp.label.padEnd(18)} : ${uniq.length ? uniq.length + " issue(s)" : "clean"}`);
  uniq.slice(0, 6).forEach((i) => console.log(`     - ${i}`));
  await c.close();
}
console.log(total ? `\n${total} layout issue(s)` : "\nno clipped text and nothing outside its frame, at any size");
await browser.close();
