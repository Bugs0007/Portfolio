import { chromium } from "playwright";

const BASE = process.env.VERIFY_BASE ?? "http://localhost:3100";
const HEADLESS = process.env.HEADED !== "1";

// Instrumented Intro -> elsewhere -> Intro cycles, driven through the real
// section rail, plus a report of every .mp4 request. Edge rather than bundled
// Chromium so the codec and media pipeline match what visitors actually run.

const browser = await chromium.launch({ channel: "msedge", headless: HEADLESS });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

// Every media request, from the DevTools protocol, so disk-cache hits and the
// real transferred size are visible (Playwright's own events hide both).
const cdp = await context.newCDPSession(page);
await cdp.send("Network.enable");
const reqs = new Map();
const log = [];
cdp.on("Network.requestWillBeSent", (e) => {
  if (!e.request.url.includes(".mp4")) return;
  const r = { t: Date.now(), id: e.requestId, file: e.request.url.split("/media/")[1], range: e.request.headers.Range ?? e.request.headers.range ?? "-", status: null, cache: false, bytes: 0, done: false };
  reqs.set(e.requestId, r);
  log.push(r);
});
cdp.on("Network.responseReceived", (e) => {
  const r = reqs.get(e.requestId);
  if (r) { r.status = e.response.status; r.cache = e.response.fromDiskCache || e.response.fromMemoryCache; }
});
cdp.on("Network.dataReceived", (e) => {
  const r = reqs.get(e.requestId);
  if (r) r.bytes += e.encodedDataLength || e.dataLength;
});
cdp.on("Network.loadingFinished", (e) => { const r = reqs.get(e.requestId); if (r) r.done = true; });
cdp.on("Network.loadingFailed", (e) => { const r = reqs.get(e.requestId); if (r) { r.done = true; r.status = `failed(${e.errorText})`; } });

const errors = [];
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

await page.goto(BASE, { waitUntil: "load", timeout: 120000 });
await page.waitForTimeout(3000);

const loadReqs = log.slice();
console.log(`\n--- page load: ${loadReqs.length} mp4 requests, ${(loadReqs.reduce((s, r) => s + r.bytes, 0) / 1048576).toFixed(2)} MB so far ---`);
const byFile = (list) => {
  const m = new Map();
  for (const r of list) {
    const e = m.get(r.file) ?? { n: 0, bytes: 0, cache: 0 };
    e.n++; e.bytes += r.bytes; if (r.cache) e.cache++;
    m.set(r.file, e);
  }
  return [...m.entries()].map(([f, e]) => `${f} x${e.n} ${(e.bytes / 1048576).toFixed(2)}MB${e.cache ? ` (${e.cache} from cache)` : ""}`);
};
for (const line of byFile(loadReqs)) console.log(`  ${line}`);

await page.evaluate(() => {
  const v = document.querySelector("#intro video");
  window.__hero = v;
  window.__ev = [];
  const t0 = performance.now();
  for (const ev of ["loadstart", "emptied", "abort", "suspend", "stalled", "waiting", "playing", "pause", "play", "seeking", "seeked", "loadeddata", "canplay", "canplaythrough"]) {
    v.addEventListener(ev, () => window.__ev.push(`${Math.round(performance.now() - t0)} ${ev} t=${v.currentTime.toFixed(2)} rs=${v.readyState}`));
  }
  // Removal or replacement of any <video> under main.
  window.__dom = [];
  new MutationObserver((recs) => {
    for (const r of recs) {
      for (const n of r.removedNodes) if (n.nodeName === "VIDEO" || n.querySelector?.("video")) window.__dom.push(`removed ${n.nodeName} ${n.querySelector?.("source")?.src ?? n.querySelector?.("video source")?.src ?? ""}`);
      for (const n of r.addedNodes) if (n.nodeName === "VIDEO" || n.querySelector?.("video")) window.__dom.push(`added ${n.nodeName}`);
    }
  }).observe(document.body, { childList: true, subtree: true });
});

const heroState = () =>
  page.evaluate(() => {
    const v = window.__hero;
    const q = v.getVideoPlaybackQuality();
    return {
      same: v === document.querySelector("#intro video"),
      connected: v.isConnected,
      paused: v.paused,
      t: +v.currentTime.toFixed(2),
      rs: v.readyState,
      ns: v.networkState,
      buffered: Array.from({ length: v.buffered.length }, (_, i) => `${v.buffered.start(i).toFixed(1)}-${v.buffered.end(i).toFixed(1)}`).join(","),
      dropped: q.droppedVideoFrames,
      total: q.totalVideoFrames,
      // Each playing clip with the share of it actually on screen, clipped by
      // any overflow-hidden ancestor. Anything under 40% should not be here.
      playingNow: [...document.querySelectorAll("video")].filter((x) => !x.paused).map((x) => {
        const r = x.getBoundingClientRect();
        let l = Math.max(r.left, 0), t = Math.max(r.top, 0), rt = Math.min(r.right, innerWidth), b = Math.min(r.bottom, innerHeight);
        for (let n = x.parentElement; n && n !== document.body; n = n.parentElement) {
          if (getComputedStyle(n).overflow === "hidden") {
            const c = n.getBoundingClientRect();
            l = Math.max(l, c.left); t = Math.max(t, c.top); rt = Math.min(rt, c.right); b = Math.min(b, c.bottom);
          }
        }
        const pct = Math.round((100 * Math.max(0, rt - l) * Math.max(0, b - t)) / (r.width * r.height || 1));
        return `${x.querySelector("source")?.src.split("/media/")[1]} ${pct}%`;
      }),
    };
  });

console.log("\nhero before cycles:", JSON.stringify(await heroState()));

const CYCLES = [
  ["travel", 3000],
  ["favorites", 8000],
  ["work", 20000],
  ["contact", 2000],
  ["music", 5000],
];

for (const [dest, dwell] of CYCLES) {
  const mark = log.length;
  await page.evaluate(() => { window.__ev.length = 0; });
  await page.locator(`nav[aria-label="Sections"] > ol a[href="#${dest}"]`).click();
  await page.mouse.move(700, 450);
  await page.waitForTimeout(1800);
  const away = await heroState();
  await page.waitForTimeout(dwell);
  const beforeReturn = await heroState();
  const jumpReqs = log.slice(mark);
  const returnMark = log.length;

  // Sample currentTime every frame from the click back to Intro.
  await page.evaluate(() => {
    window.__samples = [];
    const t0 = performance.now();
    const v = window.__hero;
    const tick = () => {
      window.__samples.push([performance.now() - t0, v.currentTime, v.paused, v.readyState]);
      if (performance.now() - t0 < 4000) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  await page.locator(`nav[aria-label="Sections"] > ol a[href="#intro"]`).click();
  await page.mouse.move(700, 450);
  await page.waitForTimeout(4200);
  const after = await heroState();
  const { samples, ev, dom } = await page.evaluate(() => ({ samples: window.__samples, ev: window.__ev, dom: window.__dom.splice(0) }));

  // Analyse: when did it start moving, did it jump backwards (other than the
  // loop wrap), and how long was the longest freeze while supposedly playing.
  const duration = await page.evaluate(() => window.__hero.duration);
  let firstMove = null, resets = [], longestFreeze = 0, freezeStart = null;
  for (let i = 1; i < samples.length; i++) {
    const [t, ct, paused] = samples[i];
    const [, prev] = samples[i - 1];
    if (firstMove === null && ct !== prev) firstMove = Math.round(t);
    if (ct < prev - 0.05 && prev < duration - 0.25) resets.push(`${Math.round(t)}ms ${prev.toFixed(2)}->${ct.toFixed(2)}`);
    if (firstMove !== null && t > firstMove) {
      if (ct === prev && !paused) { freezeStart ??= samples[i - 1][0]; longestFreeze = Math.max(longestFreeze, t - freezeStart); }
      else freezeStart = null;
    }
  }
  const retReqs = log.slice(returnMark);
  console.log(`\n=== Intro -> ${dest} (dwell ${dwell}ms) -> Intro ===`);
  console.log(`  away:          paused=${away.paused} t=${away.t} rs=${away.rs} buffered=${away.buffered} playing=[${away.playingNow}]`);
  console.log(`  before return: paused=${beforeReturn.paused} t=${beforeReturn.t} rs=${beforeReturn.rs} ns=${beforeReturn.ns} buffered=${beforeReturn.buffered}`);
  console.log(`  after return:  same node=${after.same} connected=${after.connected} paused=${after.paused} rs=${after.rs} buffered=${after.buffered} playing=[${after.playingNow}]`);
  console.log(`  resumed from t=${beforeReturn.t}; first movement ${firstMove}ms after click; resets: ${resets.length ? resets.join(" | ") : "none"}; longest freeze while playing: ${Math.round(longestFreeze)}ms`);
  console.log(`  dropped frames this return: ${after.dropped - beforeReturn.dropped} of ${after.total - beforeReturn.total}`);
  console.log(`  hero events: ${ev.join(" | ") || "none"}`);
  console.log(`  DOM video add/remove: ${dom.length ? dom.join(" | ") : "none"}`);
  console.log(`  mp4 requests during jump away + dwell: ${jumpReqs.length}`);
  for (const line of byFile(jumpReqs)) console.log(`    ${line}`);
  console.log(`  mp4 requests during return: ${retReqs.length}`);
  for (const line of byFile(retReqs)) console.log(`    ${line}`);
}

console.log(`\n--- totals: ${log.length} mp4 requests, ${(log.reduce((s, r) => s + r.bytes, 0) / 1048576).toFixed(2)} MB ---`);
for (const line of byFile(log)) console.log(`  ${line}`);
console.log(`console errors: ${errors.length}`);
for (const e of errors.slice(0, 8)) console.log(`  ${e.slice(0, 300)}`);
await browser.close();
