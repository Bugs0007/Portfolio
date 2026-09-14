import { chromium } from "playwright";

const BASE = process.env.VERIFY_BASE ?? "http://localhost:3100";

// Scrolls all of Travel with real wheel input (so Lenis smooths it exactly as
// it would for a visitor) and samples every animation frame:
//  - blank: a tile at least 10% on screen showing neither a loaded poster nor
//    a video frame. Photos are held to the same rule, since a blank photo tile
//    is the same gap.
//  - late: how long each clip took, from first being 40% on screen, to
//    actually having frames to play.
//  - off-screen playback: any clip still playing more than a short grace
//    period after dropping under 40% on screen.
//  - network: when each clip's download started relative to it arriving.
// Edge, for the real media pipeline. Optional throttle via THROTTLE_MBPS.

const VIEWPORTS = [
  { label: "1440 x 900", width: 1440, height: 900 },
  { label: "375 x 812 phone", width: 375, height: 812, mobile: true },
];
const PX_PER_S = Number(process.env.SCROLL_PX_PER_S ?? 1400);
const THROTTLE_MBPS = process.env.THROTTLE_MBPS ? Number(process.env.THROTTLE_MBPS) : null;

const SAMPLER = () => {
  const visibleRatio = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return 0;
    let left = Math.max(r.left, 0), top = Math.max(r.top, 0);
    let right = Math.min(r.right, innerWidth), bottom = Math.min(r.bottom, innerHeight);
    for (let n = el.parentElement; n && n !== document.body; n = n.parentElement) {
      const s = getComputedStyle(n);
      if (s.overflow === "hidden" || s.overflowX === "hidden" || s.overflowY === "hidden") {
        const c = n.getBoundingClientRect();
        left = Math.max(left, c.left); top = Math.max(top, c.top);
        right = Math.min(right, c.right); bottom = Math.min(bottom, c.bottom);
      }
    }
    const area = Math.max(0, right - left) * Math.max(0, bottom - top);
    return area / (r.width * r.height);
  };
  window.__travel = { frames: 0, tiles: new Map(), playingOffscreen: [], maxPlaying: 0 };
  const t0 = performance.now();
  const tick = () => {
    const now = performance.now() - t0;
    const T = window.__travel;
    T.frames++;
    let playing = 0;
    for (const fig of document.querySelectorAll("#travel figure")) {
      const frame = fig.firstElementChild;
      const video = frame.querySelector("video");
      const img = frame.querySelector("img");
      const key = video ? video.querySelector("source").src.split("/media/")[1] : img?.src.split("url=")[1]?.split("&")[0] ?? img?.src;
      const ratio = visibleRatio(frame);
      const figOpacity = parseFloat(getComputedStyle(fig).opacity);
      const posterReady = !!img && img.complete && img.naturalWidth > 0;
      const videoShowing = !!video && video.readyState >= 2 && getComputedStyle(video).opacity !== "0";
      let t = T.tiles.get(key);
      if (!t) {
        t = { kind: video ? "video" : "photo", blankFrames: 0, blankMs: 0, firstVisible: null, first40: null, framesAt: null, loadStart: null, last: now, under40Since: null };
        T.tiles.set(key, t);
      }
      const dt = now - t.last;
      t.last = now;
      if (ratio >= 0.1 && figOpacity > 0.05) {
        t.firstVisible ??= now;
        if (!posterReady && !videoShowing) { t.blankFrames++; t.blankMs += dt; }
      }
      if (video) {
        if (video.networkState === 2 || video.readyState > 0) t.loadStart ??= now;
        if (ratio >= 0.4) {
          t.first40 ??= now;
          t.under40Since = null;
          if (video.readyState >= 3) t.framesAt ??= now;
        } else if (!video.paused) {
          t.under40Since ??= now;
          if (now - t.under40Since > 450) T.playingOffscreen.push(`${key} at ${Math.round(now)}ms ratio=${ratio.toFixed(2)}`);
        }
        if (!video.paused) playing++;
      }
    }
    T.maxPlaying = Math.max(T.maxPlaying, playing);
    if (!T.stop) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};

const browser = await chromium.launch({ channel: "msedge" });
let failures = 0;

for (const vp of VIEWPORTS) {
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    ...(vp.mobile ? { isMobile: true, hasTouch: true } : {}),
    // For the local HTTP/2 proxy's self-signed certificate (h2-proxy.mjs).
    ignoreHTTPSErrors: BASE.startsWith("https:"),
  });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  if (THROTTLE_MBPS) {
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false, latency: 40,
      downloadThroughput: (THROTTLE_MBPS * 1e6) / 8, uploadThroughput: 1e6 / 8,
    });
  }
  const mp4 = [];
  const ids = new Map();
  const bytes = new Map();
  let counting = false;
  cdp.on("Network.requestWillBeSent", (e) => {
    if (!e.request.url.includes(".mp4")) return;
    const file = e.request.url.split("/media/")[1];
    ids.set(e.requestId, file);
    mp4.push({ file, t: Date.now() });
  });
  const protocols = new Map();
  cdp.on("Network.responseReceived", (e) => {
    const p = e.response.protocol ?? "?";
    protocols.set(p, (protocols.get(p) ?? 0) + 1);
  });
  // Bytes received per clip while Travel is being scrolled, which is what shows
  // whether anything behind the reader (Music's loop) is still pulling.
  cdp.on("Network.dataReceived", (e) => {
    const file = ids.get(e.requestId);
    if (file && counting) bytes.set(file, (bytes.get(file) ?? 0) + e.dataLength);
  });
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

  await page.goto(BASE, { waitUntil: "load", timeout: 120000 });
  await page.waitForTimeout(3000);
  const atLoad = mp4.map((r) => r.file);

  const { start, end } = await page.evaluate(() => {
    const t = document.getElementById("travel");
    const top = t.getBoundingClientRect().top + scrollY;
    return { start: Math.round(top - innerHeight * 1.2), end: Math.round(top + t.offsetHeight) };
  });
  // Arrive just above Travel without touching it, then settle.
  await page.evaluate((y) => window.scrollTo(0, y), start);
  await page.waitForTimeout(1500);
  const beforeScroll = mp4.length;
  await page.evaluate(SAMPLER);
  counting = true;

  const t0 = Date.now();
  if (vp.mobile) {
    // Touch devices get native scrolling (Lenis leaves touch alone); drive it
    // in small steps at the same speed.
    for (let y = start; y < end; y += PX_PER_S / 60) {
      await page.evaluate((y) => window.scrollTo(0, y), Math.round(y));
      await page.waitForTimeout(16);
    }
  } else {
    await page.mouse.move(vp.width / 2, vp.height / 2);
    const step = 100;
    const interval = (1000 * step) / PX_PER_S;
    let y = await page.evaluate(() => scrollY);
    while (y < end) {
      await page.mouse.wheel(0, step);
      await page.waitForTimeout(interval);
      y = await page.evaluate(() => scrollY);
    }
  }
  await page.waitForTimeout(1200);
  counting = false;
  const seconds = (Date.now() - t0) / 1000;
  const result = await page.evaluate(() => {
    const T = window.__travel;
    T.stop = true;
    return { frames: T.frames, maxPlaying: T.maxPlaying, playingOffscreen: T.playingOffscreen, tiles: [...T.tiles.entries()] };
  });

  console.log(`\n=== ${vp.label}${THROTTLE_MBPS ? `, ${THROTTLE_MBPS} Mbps` : ""}: ${(end - start)}px in ${seconds.toFixed(1)}s (${Math.round((end - start) / seconds)} px/s), ${result.frames} frames ===`);
  console.log(`  protocols: ${[...protocols.entries()].map(([p, n]) => `${p} x${n}`).join(", ")}`);
  console.log(`  mp4 requests at page load: ${atLoad.length ? atLoad.join(", ") : "none"}`);
  console.log(`  mp4 requests before Travel scroll began: ${beforeScroll}`);
  const outside = [...bytes.entries()].filter(([f]) => !f.startsWith("travel/"));
  console.log(`  bytes pulled during the Travel scroll by clips outside Travel: ${outside.length ? outside.map(([f, b]) => `${f} ${(b / 1048576).toFixed(2)}MB`).join(", ") : "none"}`);
  console.log(`  bytes pulled by Travel clips during the scroll: ${([...bytes.entries()].filter(([f]) => f.startsWith("travel/")).reduce((s, [, b]) => s + b, 0) / 1048576).toFixed(2)}MB`);
  const blank = result.tiles.filter(([, t]) => t.blankFrames > 0);
  console.log(`  tiles: ${result.tiles.length} (${result.tiles.filter(([, t]) => t.kind === "video").length} videos)`);
  console.log(`  tiles ever blank while >=10% on screen: ${blank.length}`);
  for (const [k, t] of blank) console.log(`    ${t.kind} ${k}: ${t.blankFrames} frames, ${Math.round(t.blankMs)}ms`);
  console.log(`  clips: start of download vs first 40% on screen, and time to playable frames after that`);
  for (const [k, t] of result.tiles.filter(([, t]) => t.kind === "video")) {
    const lead = t.first40 !== null && t.loadStart !== null ? Math.round(t.first40 - t.loadStart) : null;
    const late = t.first40 !== null ? (t.framesAt !== null ? Math.max(0, Math.round(t.framesAt - t.first40)) : "never") : "not reached";
    console.log(`    ${k.padEnd(34)} download led arrival by ${lead === null ? "-" : lead + "ms"}; playable ${late === 0 ? "on arrival" : typeof late === "number" ? late + "ms after" : late}`);
  }
  // Informational: two columns can legitimately hold several clips at 40%+.
  // What must never happen is covered by the off-screen check below.
  console.log(`  most clips playing at once (all of them on screen): ${result.maxPlaying}`);
  console.log(`  clips playing while under 40% on screen (after 450ms grace): ${result.playingOffscreen.length}`);
  for (const p of result.playingOffscreen.slice(0, 6)) console.log(`    ${p}`);
  console.log(`  console errors: ${errors.length}`);

  if (atLoad.some((f) => f.startsWith("travel/"))) { failures++; console.log("  FAIL travel clips requested at page load"); }
  if (blank.length) { failures++; console.log("  FAIL blank tiles"); }
  if (result.playingOffscreen.length) { failures++; console.log("  FAIL off-screen playback"); }
  if (errors.length) { failures++; console.log(`  FAIL console errors: ${errors.slice(0, 3).join(" | ")}`); }
  await context.close();
}

await browser.close();
console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} FAILURE(S)`}`);
process.exit(failures === 0 ? 0 : 1);
