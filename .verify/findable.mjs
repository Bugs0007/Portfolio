import { chromium } from "playwright";

const BASE = process.env.VERIFY_BASE ?? "http://localhost:3100";

// Every bullet the classic layout shows, then the Work diagram terminology.
// Node labels and sublabels are real HTML text now rather than SVG <text>, so
// all of it has to be reachable by find-in-page and present in the a11y tree.
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

const DIAGRAM = [
  // Brynklabs
  "Inbound event",
  "JWT / OAuth2",
  "Lambda workers",
  "git push",
  "artifact",
  "release cycle",

  // CaseIntel, ingest
  "eCourts portal",
  "Session init",
  "cookies + rotating header",
  "CNR auto-detect",
  "4-letter prefix picks the portal, falls back on CaseNotFound",
  "header key scraped per session from components.js",
  "500-result cap",
  "retry failed districts",
  "ProcessingJob",
  "async, incremental, concurrency cap",
  "districts x court complexes",

  // CaseIntel, retrieval
  "SHA-256 dedupe",
  "spaCy chunking",
  "sentence-aware",
  "768-dim",
  "pgvector + tsvector",
  "hyde_expand",
  "HyDE expansion",
  "hybrid_search",
  "generate_answer",
  "LangGraph",
  "RRF rerank",
  "reciprocal rank fusion",
  "ms-marco-MiniLM-L-6-v2",
  "Sourced answer",

  // CaseIntel, practice
  "7pm / 6:30am",
  "58 PDFs",
  "8 list types",
  "pdfminer parsing",
  "per-document column detection",
  "not_checked",
  "not_published",
  "not_listed",
  "never downgrades",
  "PENDING",
  "INVOICED",
  "row-locked per-user invoice sequence",
  "fpdf2 PDF",

  // CaseIntel, infrastructure and headline
  "t3.small",
  "RDS PostgreSQL",
  "Nginx / gunicorn",
  "Let's Encrypt",
  "caseintel.in",
  "row-level multi-tenancy",
  "OwnedModel, 16 models, DRF token auth",
  "tests passing",
];

// Find-in-page skips display:none and visibility:hidden subtrees, but does
// match text that is merely transparent or clipped. So this is the check that
// actually matters for Ctrl+F, not textContent presence.
const CHECK = (needles) => {
  const section = document.querySelector("#work");
  const out = [];
  for (const needle of needles) {
    // Deepest element whose textContent holds the needle, since find-in-page
    // matches across inline boundaries within a block and a per-text-node
    // search would report a false miss.
    let holder = null;
    for (const el of section.querySelectorAll("*")) {
      if ((el.textContent ?? "").includes(needle)) holder = el;
    }
    if (!holder) {
      out.push({ needle, status: "NOT IN DOM" });
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

// Both branches. Classic is checked against the bullets only: the diagram
// terminology is deliberately diagram-only, and the terms from it that are
// genuinely part of the stack live in the tag pills classic already renders.
const RUNS = [
  { label: "diagrams", context: {}, needles: [...BULLETS, ...DIAGRAM] },
  { label: "classic", context: { reducedMotion: "reduce" }, needles: BULLETS },
];

const browser = await chromium.launch();
let problems = 0;
console.log("");

for (const run of RUNS) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    ...run.context,
  });
  const page = await context.newPage();
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(1800);
  const rows = await page.evaluate(CHECK, run.needles);
  const bad = rows.filter((r) => r.status !== "findable" || r.hiddenFromA11y);
  console.log(
    ` ${run.label.padEnd(9)} : ${rows.filter((r) => r.status === "findable").length}/${run.needles.length} findable by Ctrl+F` +
      (bad.length ? "  <-- PROBLEM" : ""),
  );
  for (const r of bad) {
    problems++;
    console.log(
      `     ${r.status}${r.hiddenFromA11y ? " + inside aria-hidden" : ""}: "${r.needle.slice(0, 60)}"`,
    );
  }
  await context.close();
}

console.log(problems ? `\n${problems} findability problem(s)` : "\nevery term is findable by Ctrl+F");
await browser.close();
