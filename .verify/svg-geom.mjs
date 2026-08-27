import { chromium } from "playwright";

const BASE = "http://localhost:3100";

const GEOM = () => {
  const out = [];
  for (const svg of document.querySelectorAll("#work svg[role='img']")) {
    const label = svg.getAttribute("aria-label");
    const vb = svg.viewBox.baseVal;
    const rects = [...svg.querySelectorAll("g rect")]
      .filter((r) => getComputedStyle(r).fill !== "none")
      .map((r) => ({
      x: +r.getAttribute("x"),
      y: +r.getAttribute("y"),
      w: +r.getAttribute("width"),
      h: +r.getAttribute("height"),
      text: r.parentElement.querySelector("text")?.textContent ?? "(cluster)",
    }));

    const outside = rects.filter(
      (r) => r.x < vb.x - 0.5 || r.y < vb.y - 0.5 || r.x + r.w > vb.x + vb.width + 0.5 || r.y + r.h > vb.y + vb.height + 0.5,
    );

    const overlaps = [];
    for (let i = 0; i < rects.length; i++) {
      for (let j = i + 1; j < rects.length; j++) {
        const a = rects[i];
        const b = rects[j];
        if (a.text === "(cluster)" || b.text === "(cluster)") continue;
        const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
        const oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
        if (ox > 0.5 && oy > 0.5) overlaps.push(`${a.text} <-> ${b.text} (${ox.toFixed(1)}x${oy.toFixed(1)})`);
      }
    }

    const box = svg.getBoundingClientRect();
    out.push({
      label,
      viewBox: `${vb.width}x${vb.height}`,
      rendered: `${Math.round(box.width)}x${Math.round(box.height)}`,
      unitsPerPx: (vb.width / box.width).toFixed(3),
      nodes: rects.length,
      outside: outside.map((r) => r.text),
      overlaps,
    });
  }
  return out;
};

const browser = await chromium.launch();
for (const width of [1440, 390]) {
  const c = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 900 } });
  const p = await c.newPage();
  await p.goto(`${BASE}/?workMode=pipeline`, { waitUntil: "networkidle" });
  await p.waitForTimeout(1500);
  const box = await p.evaluate(() => {
    const s = document.querySelector("#work");
    return { top: s.getBoundingClientRect().top + window.scrollY, h: s.scrollHeight };
  });
  console.log(`\n===== pipeline diagrams @ ${width}px =====`);
  for (const frac of [0.25, 0.7]) {
    await p.evaluate((y) => window.scrollTo(0, y), Math.round(box.top + box.h * frac));
    await p.waitForTimeout(1600);
    for (const g of await p.evaluate(GEOM)) {
      console.log(` ${g.label}`);
      console.log(`   viewBox ${g.viewBox} -> rendered ${g.rendered}px  (${g.unitsPerPx} units/px), ${g.nodes} boxes`);
      console.log(`   outside frame : ${g.outside.length ? g.outside.join(", ") : "none"}`);
      console.log(`   overlapping   : ${g.overlaps.length ? g.overlaps.join("; ") : "none"}`);
    }
  }
  await c.close();
}
await browser.close();
