import { chromium } from "playwright";

const BASE = "http://localhost:3100";
const EXPECTED = [
  "1,000+", "-50%", "-25%", "hours \u2192 under 15 min",
  "33 / 33", "8 / 8", "3 nodes",
  "-90%", "1.2s \u2192 0.8s", "85% \u2192 92%", "99.9%", "30+", "128-D",
];

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
await page.goto(`${BASE}/?workMode=metrics`, { waitUntil: "networkidle" });
await page.waitForTimeout(1500);

// Read the authoritative (non aria-hidden) value nodes with the page still at
// the very top, i.e. before any metric's count has been scrolled into.
const report = await page.evaluate(() => {
  const section = document.querySelector("#work");
  const out = [];
  for (const li of section.querySelectorAll("li")) {
    const label = li.querySelector("p.font-mono");
    if (!label) continue;
    const valueHost = li.querySelector("span > span.relative, span.block");
    if (!valueHost) continue;
    const real = [...li.querySelectorAll("span")].find(
      (s) => !s.closest("[aria-hidden='true']") && s.parentElement?.classList.contains("relative"),
    );
    if (real) out.push({ label: label.textContent.trim(), real: real.textContent.trim() });
  }
  return { scrollY: window.scrollY, out };
});

console.log("\nscrollY at sample:", report.scrollY, "(top of page, nothing counted yet)");
console.log("\n authoritative DOM text of each metric value node");
console.log("-------------------------------------------------");
const seen = new Set();
for (const r of report.out) {
  seen.add(r.real);
  const flag = /^0$|^0[^.\d]/.test(r.real) ? "  <-- ZERO PLACEHOLDER" : "";
  console.log(` ${r.label.padEnd(24)} ${r.real}${flag}`);
}
const missing = EXPECTED.filter((e) => !seen.has(e));
console.log(missing.length ? `\nmissing final values: ${missing.join(", ")}` : "\nall expected final values present as real DOM text at scroll 0");
await browser.close();
