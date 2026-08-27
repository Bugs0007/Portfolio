import { chromium } from "playwright";

const BASE = "http://localhost:3100";
const MODES = ["classic", "tube", "pipeline", "product", "metrics", "terminal", "garbage"];

// One distinctive fragment per bullet in workItems, copied verbatim from
// src/content/site.ts. Every mode must contain all ten.
const BULLETS = [
  "MCP integration for Gathr",
  "Multi-channel notification system (email, WhatsApp, in-app)",
  "AWS SQS in front of Lambda to process notifications asynchronously",
  "JWT/OAuth2 authentication and RBAC across internal services.",
  "GitHub Actions CI/CD for EC2, cutting release cycles",
  "Frontend work in React.js and Flutter",
  "eCourts automated end to end (sessions, CAPTCHA, anti-scraping headers)",
  "dlib's 128-D face embeddings",
  "Multithreaded frame processing brought recognition latency",
  "Groq writes the script, edge-tts voices it",
];

const browser = await chromium.launch();
const results = [];

async function inspect(mode, opts = {}) {
  const context = await browser.newContext({
    viewport: opts.viewport ?? { width: 1440, height: 900 },
    reducedMotion: opts.reducedMotion ?? "no-preference",
  });
  const page = await context.newPage();
  const requests = [];
  page.on("request", (r) => requests.push(r.url()));

  await page.goto(`${BASE}/?workMode=${mode}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  const info = await page.evaluate(() => {
    const section = document.querySelector("#work");
    const text = section ? section.textContent ?? "" : "";
    return {
      hasSection: !!section,
      text,
      declared: (text.match(/Displayed in (\w+) mode\./) ?? [])[1] ?? "classic",
      canvases: section ? section.querySelectorAll("canvas").length : 0,
      workSections: document.querySelectorAll("#work").length,
    };
  });

  const missing = BULLETS.filter((b) => !info.text.includes(b));
  const threeLoaded = requests.some((u) => u.includes("23va8q566ucap"));

  await context.close();
  return { mode, ...info, missing, threeLoaded, label: opts.label ?? mode };
}

for (const mode of MODES) results.push(await inspect(mode));
results.push(await inspect("tube", { reducedMotion: "reduce", label: "tube +reduced-motion" }));
results.push(await inspect("metrics", { reducedMotion: "reduce", label: "metrics +reduced-motion" }));
results.push(await inspect("terminal", { reducedMotion: "reduce", label: "terminal +reduced-motion" }));
results.push(await inspect("tube", { viewport: { width: 390, height: 844 }, label: "tube @390px" }));
results.push(await inspect("pipeline", { viewport: { width: 390, height: 844 }, label: "pipeline @390px" }));

console.log("");
console.log(" case                      | renders as | bullets | three.js | canvas | #work");
console.log("---------------------------|------------|---------|----------|--------|------");
let fails = 0;
for (const r of results) {
  if (r.missing.length) fails++;
  const ok = r.missing.length === 0 ? "10/10  " : `${10 - r.missing.length}/10 !!`;
  console.log(
    ` ${r.label.padEnd(25)} | ${r.declared.padEnd(10)} | ${ok} | ${String(r.threeLoaded).padEnd(8)} | ${String(r.canvases).padEnd(6)} | ${r.workSections}`,
  );
  if (r.missing.length) console.log("     MISSING:", r.missing);
}
console.log(fails ? `\n${fails} case(s) lost content` : "\nno content loss in any case");

await browser.close();
