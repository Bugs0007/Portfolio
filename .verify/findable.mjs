import { chromium } from "playwright";

const BASE = "http://localhost:3100";
const MODES = ["classic", "tube", "pipeline", "product", "metrics", "terminal"];

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

// Find-in-page skips display:none and visibility:hidden subtrees, but does
// match text that is merely transparent or clipped. So this is the check that
// actually matters for Ctrl+F, not textContent presence.
const CHECK = (needles) => {
  const section = document.querySelector("#work");
  const out = [];
  for (const needle of needles) {
    // Deepest element whose textContent holds the needle. Terminal splits a
    // sentence across inline spans to highlight a metric inside it, and
    // find-in-page matches across inline boundaries within a block, so a
    // per-text-node search would report a false miss.
    let holder = null;
    for (const el of section.querySelectorAll('*')) {
      if ((el.textContent ?? '').includes(needle)) holder = el;
    }
    if (!holder) {
      out.push({ needle, status: 'NOT IN DOM' });
      continue;
    }
    let el = holder;
    let blocked = null;
    while (el && el !== document.body) {
      const s = getComputedStyle(el);
      if (s.display === "none") blocked = "display:none";
      else if (s.visibility === "hidden" || s.visibility === "collapse") blocked = "visibility:hidden";
      if (blocked) break;
      el = el.parentElement;
    }
    out.push({
      needle,
      status: blocked ? `HIDDEN (${blocked})` : "findable",
      hiddenFromA11y: !!holder.closest("[aria-hidden='true']"),
    });
  }
  return out;
};

const browser = await chromium.launch();
let problems = 0;
console.log("");
for (const mode of MODES) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${BASE}/?workMode=${mode}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  const rows = await page.evaluate(CHECK, BULLETS);
  const bad = rows.filter((r) => r.status !== "findable" || r.hiddenFromA11y);
  console.log(
    ` ${mode.padEnd(9)} : ${rows.filter((r) => r.status === "findable").length}/10 findable by Ctrl+F` +
      (bad.length ? "  <-- PROBLEM" : ""),
  );
  for (const r of bad) {
    problems++;
    console.log(`     ${r.status}${r.hiddenFromA11y ? " + inside aria-hidden" : ""}: "${r.needle.slice(0, 50)}"`);
  }
  await context.close();
}
console.log(problems ? `\n${problems} findability problem(s)` : "\nevery bullet is findable by Ctrl+F in every mode");
await browser.close();
