import { chromium } from "playwright";

const BASE = process.env.VERIFY_BASE ?? "http://localhost:3100";

// Replaces the old svg-geom check, which asserted on <rect> x/y/width/height
// attributes and a sibling <text>. None of that exists any more: nodes are HTML
// sized by the browser and only the edges are SVG. getBoundingClientRect is the
// right tool here (unlike inside the layout code, where it would be measuring
// through the fit transform) because what this wants to know is precisely what
// ended up on screen.
const GEOM = () => {
  const out = [];
  for (const frame of document.querySelectorAll("[data-diagram-frame]")) {
    const fr = frame.getBoundingClientRect();
    if (fr.height < 4) continue;
    const stage = frame.querySelector("[style*='scale']");
    const k = Number(stage?.getAttribute("style")?.match(/scale\(([\d.]+)\)/)?.[1] ?? 1);

    const all = [...frame.querySelectorAll("[data-mid]")]
      .map((el) => ({ id: el.dataset.mid, r: el.getBoundingClientRect(), el }))
      .filter((n) => n.r.width > 0 && n.r.height > 0);

    const boxes = all.filter((n) => !n.id.startsWith("label:") && !n.id.startsWith("lane:"));
    const labels = all.filter((n) => n.id.startsWith("label:"));

    // A node can never be narrower than its own text: that is the whole point
    // of letting the browser size it. scrollWidth > clientWidth would mean it
    // is, which is the old bug.
    const clipped = all.filter((n) => n.el.scrollWidth > n.el.clientWidth + 1);

    const hit = (a, b) =>
      Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 &&
      Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1;

    const nodeOverlaps = [];
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        if (hit(boxes[i].r, boxes[j].r)) nodeOverlaps.push(`${boxes[i].id} <-> ${boxes[j].id}`);
      }
    }
    // Labels live in bands node bands never enter, so this list is structurally
    // empty. It is here to catch a regression in that structure.
    const labelOverNode = [];
    for (const l of labels) {
      for (const b of boxes) if (hit(l.r, b.r)) labelOverNode.push(`${l.id} over ${b.id}`);
    }
    // Horizontal only: vertical travel outside the frame is the pan, by design.
    const outsideX = all.filter((n) => n.r.left < fr.left - 1 || n.r.right > fr.right + 1);

    out.push({
      label: frame.getAttribute("aria-label"),
      frame: `${Math.round(fr.width)}x${Math.round(fr.height)}`,
      scale: k,
      measurables: all.length,
      clipped: clipped.map((n) => n.id),
      nodeOverlaps,
      labelOverNode,
      outsideX: outsideX.map((n) => n.id),
    });
  }
  return out;
};

const browser = await chromium.launch();
let problems = 0;
for (const [width, height] of [[1920, 1080], [1440, 900], [1280, 800], [1100, 900], [960, 900], [860, 900]]) {
  const c = await browser.newContext({ viewport: { width, height } });
  const p = await c.newPage();
  await p.goto(BASE, { waitUntil: "networkidle" });
  await p.waitForTimeout(1800);
  const box = await p.evaluate(() => {
    const s = document.querySelector("#work");
    return { top: s.getBoundingClientRect().top + window.scrollY, h: s.scrollHeight };
  });
  console.log(`\n===== ${width}x${height} =====`);
  for (const frac of [0.2, 0.45, 0.7, 0.9]) {
    await p.evaluate((y) => window.scrollTo(0, y), Math.round(box.top + box.h * frac));
    await p.waitForTimeout(1300);
    for (const g of await p.evaluate(GEOM)) {
      const bad =
        g.clipped.length + g.nodeOverlaps.length + g.labelOverNode.length + g.outsideX.length;
      problems += bad;
      console.log(
        ` ${String(frac).padEnd(5)} ${String(g.label).padEnd(38)} ${g.frame} @ ${g.scale}  ${g.measurables} boxes  ${bad ? bad + " PROBLEM(S)" : "clean"}`,
      );
      for (const [name, list] of Object.entries({
        clipped: g.clipped,
        overlapping: g.nodeOverlaps,
        "label on node": g.labelOverNode,
        "outside frame x": g.outsideX,
      })) {
        if (list.length) console.log(`        ${name}: ${list.slice(0, 4).join(", ")}`);
      }
    }
  }
  await c.close();
}
console.log(
  problems
    ? `\n${problems} geometry problem(s)`
    : "\nnothing clipped, nothing overlapping, nothing outside its frame",
);
await browser.close();
