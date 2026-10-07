import { chromium } from "playwright";

const BASE = process.env.VERIFY_BASE ?? "http://localhost:3100";
const HEADLESS = process.env.HEADED !== "1";

// The Game section's trailer: nothing fetched until it is near, plays at 40%
// visible, pauses when it leaves, a fixed frame (no layout shift), the
// reduced-motion path, the "best on desktop" hint, and no horizontal overflow.
// Edge rather than bundled Chromium, like the other media audits, so H.264 is
// there.

const browser = await chromium.launch({ channel: "msedge", headless: HEADLESS });
let failures = 0;
const check = (label, ok, detail = "") => {
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? `  (${detail})` : ""}`);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const CASES = [
  { name: "desktop 1440x900", opts: { viewport: { width: 1440, height: 900 } }, hint: false },
  { name: "narrow mouse 600x900", opts: { viewport: { width: 600, height: 900 } }, hint: true },
  { name: "phone 390x844 (touch)", opts: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }, hint: true },
  { name: "desktop, reduced motion", opts: { viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" }, hint: false, reduced: true },
  { name: "phone, reduced motion", opts: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: "reduce" }, hint: true, reduced: true },
];

for (const c of CASES) {
  console.log(`\n===== ${c.name} =====`);
  const context = await browser.newContext(c.opts);
  const page = await context.newPage();
  const trailerReqs = [];
  page.on("request", (r) => /\/media\/game\/trailer\./.test(r.url()) && trailerReqs.push(r.url().split("/").pop()));
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));

  await page.goto(BASE, { waitUntil: "load", timeout: 120000 });
  await sleep(1500);
  check("no trailer request at page load", trailerReqs.length === 0, trailerReqs.join(","));

  const frame = () =>
    page.evaluate(() => {
      const f = document.querySelector("#game video, #game [class*=aspect-video]");
      const box = (document.querySelector("#game [class*=aspect-video]") ?? f).getBoundingClientRect();
      return { w: Math.round(box.width), h: Math.round(box.height) };
    });
  const before = await frame();
  check("frame is 16:9", Math.abs(before.w * 9 / 16 - before.h) <= 1, `${before.w}x${before.h}`);

  const jump = (y) => page.evaluate((y) => window.scrollTo(0, y), y);
  // Frame top, so the whole trailer is on screen.
  const frameTop = await page.evaluate(() => {
    const f = document.querySelector("#game [class*=aspect-video]");
    return f.getBoundingClientRect().top + scrollY;
  });
  const vh = c.opts.viewport.height;
  await jump(Math.max(0, frameTop - (vh - before.h) / 2));
  await sleep(2500);

  const state = () =>
    page.evaluate(() => {
      const v = document.querySelector("#game video");
      return v ? { paused: v.paused, t: v.currentTime, muted: v.muted, ready: v.readyState, src: v.currentSrc.split("/").pop(), loop: v.loop, preload: v.preload } : null;
    });

  if (!c.reduced) {
    let s = await state();
    check("plays when scrolled into view", s && !s.paused && s.t > 0, JSON.stringify(s));
    check("muted, looped, preload=metadata", s && s.muted && s.loop && s.preload === "metadata");
    check("a trailer source was requested", trailerReqs.length > 0, trailerReqs.join(","));

    const after = await frame();
    check("frame size unchanged by playback (no layout shift)", after.w === before.w && after.h === before.h, `${after.w}x${after.h}`);

    // Sound toggle.
    await page.locator("#game").getByRole("button", { name: "Play sound" }).click();
    s = await state();
    check("sound toggle unmutes", s && !s.muted);
    await page.locator("#game").getByRole("button", { name: "Mute sound" }).click();
    s = await state();
    check("sound toggle mutes again", s && s.muted);

    await jump(0);
    await sleep(800);
    s = await state();
    check("pauses when scrolled away", s && s.paused, JSON.stringify(s));
    const t = s.t;
    await sleep(600);
    check("stays paused", (await state()).t === t);

    await jump(Math.max(0, frameTop - (vh - before.h) / 2));
    await sleep(1200);
    s = await state();
    check("resumes on return", s && !s.paused && s.t >= t, JSON.stringify(s));
  } else {
    let s = await state();
    check("reduced motion: no video mounted, nothing autoplays", s === null);
    check("reduced motion: no trailer request while scrolled to it", trailerReqs.length === 0, trailerReqs.join(","));
    const play = page.locator("#game").getByRole("button", { name: "Play trailer" });
    check("reduced motion: manual play control present", (await play.count()) === 1);
    await play.click();
    await sleep(2500);
    s = await state();
    check("manual play starts playback", s && !s.paused && s.t > 0, JSON.stringify(s));
    check("manual play is not looped", s && !s.loop);
    check("pause control appears", (await page.locator("#game").getByRole("button", { name: "Pause trailer" }).count()) === 1);
    await page.locator("#game").getByRole("button", { name: "Pause trailer" }).click();
    await sleep(300);
    check("pause control pauses", (await state()).paused);
  }

  // Play link.
  const link = await page.evaluate(() => {
    const a = document.querySelector("#game a");
    const r = a.getBoundingClientRect();
    const fr = document.querySelector("#game [class*=aspect-video]").getBoundingClientRect();
    return { href: a.getAttribute("href"), target: a.target, rel: a.rel, text: a.textContent.trim(), below: r.top >= fr.bottom - 1, h: Math.round(r.height), iframes: document.querySelectorAll("#game iframe").length };
  });
  check("Play link target", link.href === "https://supa-figh.vercel.app" && link.target === "_blank" && link.rel === "noopener noreferrer", JSON.stringify(link));
  check("Play link sits under the trailer, no iframe", link.below && link.iframes === 0);
  check("Play link is a comfortable tap target", link.h >= 44, `${link.h}px`);

  // Hint.
  const hint = await page.evaluate(() => {
    const p = [...document.querySelectorAll("#game p")].find((p) => /keyboard/i.test(p.textContent));
    const r = p.getBoundingClientRect();
    return { shown: getComputedStyle(p).display !== "none" && r.height > 0 };
  });
  check(`desktop hint ${c.hint ? "shown" : "hidden"}`, hint.shown === c.hint);

  // Overflow.
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  check("no horizontal overflow", overflow <= 0, `${overflow}px`);

  check("no console errors", errors.length === 0, errors.slice(0, 2).join(" | "));
  await page.screenshot({ path: `.verify/game-${c.name.replace(/[^a-z0-9]+/gi, "-")}.png` });
  await context.close();
}

await browser.close();
console.log(failures ? `\n${failures} FAILED` : "\nall passed");
process.exit(failures ? 1 : 0);
