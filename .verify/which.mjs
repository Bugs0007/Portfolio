import { chromium } from "playwright";

const BASE = "http://localhost:3100";

const SNAPSHOT = () => {
  const section = document.querySelector("#work");
  const parts = [];
  section.querySelectorAll("*").forEach((el, i) => {
    const s = getComputedStyle(el);
    if (s.opacity !== "1" || s.transform !== "none" || (s.strokeDashoffset && s.strokeDashoffset !== "0px")) {
      parts.push({
        i,
        tag: el.tagName,
        cls: (el.getAttribute("class") ?? "").slice(0, 60),
        op: s.opacity,
        tf: s.transform.slice(0, 46),
        dash: s.strokeDashoffset,
        text: (el.textContent ?? "").trim().slice(0, 34),
      });
    }
  });
  return parts;
};

async function settle(page, y) {
  await page.evaluate((t) => window.scrollTo(0, t), y);
  await page.waitForTimeout(2000);
}

const browser = await chromium.launch();
for (const [mode, offset] of [["pipeline", 2200], ["tube", 900]]) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${BASE}/?workMode=${mode}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  const top = await page.evaluate(
    () => document.querySelector("#work").getBoundingClientRect().top + window.scrollY,
  );
  const probe = Math.round(top + offset);

  await settle(page, probe);
  const a = await page.evaluate(SNAPSHOT);
  await settle(page, probe + 3400);
  await settle(page, probe);
  const b = await page.evaluate(SNAPSHOT);

  console.log(`\n=== ${mode} @ ${offset} ===`);
  const byIndex = new Map(b.map((x) => [x.i, x]));
  let shown = 0;
  for (const before of a) {
    const after = byIndex.get(before.i);
    if (!after) {
      console.log(`  GONE   idx${before.i} <${before.tag}> "${before.text}" op=${before.op} cls=${before.cls}`);
      shown++;
    } else if (before.op !== after.op || before.tf !== after.tf || before.dash !== after.dash) {
      console.log(`  MOVED  idx${before.i} <${before.tag}> "${before.text}"`);
      console.log(`         before op=${before.op} tf=${before.tf}`);
      console.log(`         after  op=${after.op} tf=${after.tf} cls=${before.cls}`);
      shown++;
    }
    if (shown > 8) break;
  }
  const aIdx = new Set(a.map((x) => x.i));
  for (const after of b) {
    if (!aIdx.has(after.i) && shown <= 12) {
      console.log(`  NEW    idx${after.i} <${after.tag}> "${after.text}" op=${after.op} cls=${after.cls}`);
      shown++;
    }
  }
  if (!shown) console.log("  (no differences on this run)");
  await context.close();
}
await browser.close();
