import { chromium } from "playwright";

const BASE = process.env.VERIFY_BASE ?? "http://localhost:3100";

// One frame per featured chapter per width, taken late enough in each chapter's
// pin that its diagram has finished drawing.
const WIDTHS = [
  { width: 1440, height: 900 },
  { width: 900, height: 900 },
];

const browser = await chromium.launch();

for (const { width, height } of WIDTHS) {
  const c = await browser.newContext({ viewport: { width, height } });
  const p = await c.newPage();
  await p.goto(BASE, { waitUntil: "networkidle" });
  await p.waitForTimeout(2500);

  // Each pinned chapter is a tall container holding a sticky child. Progress
  // runs 0 to 1 over containerHeight minus one viewport, so the usable range
  // ends there, not at the container's bottom.
  const chapters = await p.evaluate(() =>
    [...document.querySelectorAll("[data-diagram-frame]")].map((f) => {
      const container = f.closest("[style*='height']");
      const r = container?.getBoundingClientRect();
      return {
        top: Math.round((r?.top ?? 0) + window.scrollY),
        usable: Math.round((r?.height ?? 0) - window.innerHeight),
      };
    }),
  );

  for (const [i, ch] of chapters.entries()) {
    await p.evaluate((y) => window.scrollTo(0, y), Math.round(ch.top + ch.usable * 0.97));
    await p.waitForTimeout(2000);
    const name = `.verify/work-${i === 0 ? "brynklabs" : "caseintel"}-${width}.png`;
    await p.screenshot({ path: name });
    console.log(`wrote ${name}`);
  }
  await c.close();
}

await browser.close();
