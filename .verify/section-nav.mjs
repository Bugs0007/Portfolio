import { chromium } from "playwright";
import os from "node:os";
import path from "node:path";

const BASE = process.env.VERIFY_BASE ?? "http://localhost:3100";
const SHOTS = process.env.VERIFY_SHOTS ?? os.tmpdir();

// Audit for SectionNav and BackToTop:
//  - every jump lands on its section, is animated (Lenis, not a native jump),
//    marks the right item active and moves focus to the section;
//  - the active item stays in sync with the page at every scroll position,
//    including across Work's and Travel's post-hydration element swaps;
//  - BackToTop's show/hide thresholds and its scroll to 0;
//  - nothing interactive or legible sits under either fixed element, sampled by
//    real hit-testing (elementsFromPoint) across the whole page, so overflow
//    clipping, pointer-events and Travel's moving columns are all accounted for;
//  - reduced motion jumps instantly.

const IDS = ["intro", "work", "game", "music", "travel", "art", "riding", "favorites", "contact"];

const VIEWPORTS = [
  { label: "1440 x 900", width: 1440, height: 900, layout: "rail" },
  { label: "1024 x 768 (lg edge)", width: 1024, height: 768, layout: "rail" },
  { label: "1023 x 768", width: 1023, height: 768, layout: "menu", touch: false },
  { label: "768 x 1024 tablet", width: 768, height: 1024, layout: "menu", touch: true },
  { label: "375 x 812 phone", width: 375, height: 812, layout: "menu", touch: true },
];

async function open(browser, vp, extra = {}) {
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    hasTouch: !!vp.touch,
    isMobile: !!vp.touch,
    ...extra,
  });
  const page = await context.newPage();
  const errors = [];
  // The YouTube embeds in My Favorites intermittently request the Compute
  // Pressure API, which their iframe is not granted. Third-party, nothing to do
  // with the nav, and not something this audit should fail on.
  const thirdParty = /compute-pressure is not allowed/;
  page.on("console", (m) => m.type() === "error" && !thirdParty.test(m.text()) && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(BASE, { waitUntil: "networkidle", timeout: 120000 });
  // Splash (1.75s) plus the nav's own 0.7s entrance.
  await page.waitForTimeout(2800);
  return { context, page, errors };
}

// What sits under each visible fixed control at the current scroll position.
const PROBE = () => {
  const controls = [
    ...document.querySelectorAll('nav[aria-label="Sections"] > ol'),
    ...document.querySelectorAll('nav[aria-label="Sections"] > button'),
    ...document.querySelectorAll('button[aria-label="Back to top"]'),
  ].filter((el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  });

  const ours = (el) =>
    el.closest('nav[aria-label="Sections"], button[aria-label="Back to top"]');
  const ignorable = (el) =>
    el === document.documentElement ||
    el === document.body ||
    el.tagName === "NEXTJS-PORTAL" ||
    el.closest('nav[aria-label="Primary"]');

  const effectiveOpacity = (el) => {
    let o = 1;
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      o *= parseFloat(getComputedStyle(n).opacity);
      if (o < 0.05) return o;
    }
    return o;
  };

  const describe = (el) => {
    const label =
      el.getAttribute("aria-label") ||
      el.getAttribute("alt") ||
      (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 40);
    const home = el.closest("[id]")?.id ?? "?";
    return `${home} <${el.tagName.toLowerCase()}> ${label}`;
  };

  const out = [];
  for (const control of controls) {
    const r = control.getBoundingClientRect();
    const which =
      control.tagName === "OL"
        ? "rail"
        : control.getAttribute("aria-label") === "Back to top"
          ? "backToTop"
          : "menuButton";
    const interactive = new Set();
    const content = new Set();
    for (let x = r.left + 1; x < r.right - 1; x += 4) {
      for (let y = r.top + 1; y < r.bottom - 1; y += 4) {
        const stack = document.elementsFromPoint(x, y);
        for (const el of stack) {
          if (ours(el) || ignorable(el)) continue;
          const hit = el.closest(
            'a[href], button, [role="button"], input, select, textarea, iframe, summary',
          );
          if (hit && !ours(hit) && effectiveOpacity(hit) > 0.05) {
            interactive.add(describe(hit));
          }
          const text = el.closest("h1, h2, h3, p, figcaption, li, img, figure");
          if (text && !ours(text) && effectiveOpacity(text) > 0.05) {
            content.add(describe(text));
          }
          break; // only the topmost page element under the control matters
        }
      }
    }
    out.push({ which, rect: [r.left, r.top, r.width, r.height].map(Math.round), interactive: [...interactive], content: [...content] });
  }
  return out;
};

// Everything interactive or legible whose horizontal extent enters a control's
// column anywhere in the viewport. PROBE only sees what is under a control at
// the sampled positions, and a stride of 0.2vh can step straight over a small
// link passing under a 36px button. Page content only moves vertically (Travel's
// columns and Work's diagrams included), so anything that is visible inside a
// column at some point is exactly what will pass under that control.
const COLUMN = () => {
  const controls = [
    ...document.querySelectorAll('nav[aria-label="Sections"] > ol'),
    ...document.querySelectorAll('nav[aria-label="Sections"] > button'),
    ...document.querySelectorAll('button[aria-label="Back to top"]'),
  ].filter((el) => el.getBoundingClientRect().width > 0);
  const ours = (el) =>
    el.closest('nav[aria-label="Sections"], button[aria-label="Back to top"]');
  const ignorable = (el) =>
    el === document.documentElement ||
    el === document.body ||
    el.tagName === "NEXTJS-PORTAL" ||
    el.closest('nav[aria-label="Primary"]');
  const vh = innerHeight;
  const found = [];
  const candidates = document.querySelectorAll(
    'a[href], button, [role="button"], input, select, textarea, iframe, h1, h2, h3, p, li, figcaption, img',
  );
  for (const control of controls) {
    const c = control.getBoundingClientRect();
    const which =
      control.tagName === "OL"
        ? "rail"
        : control.getAttribute("aria-label") === "Back to top"
          ? "backToTop"
          : "menuButton";
    for (const el of candidates) {
      if (ours(el) || ignorable(el)) continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (r.right <= c.left || r.left >= c.right) continue;
      if (r.bottom <= 0 || r.top >= vh) continue;
      const x = (Math.max(r.left, c.left) + Math.min(r.right, c.right)) / 2;
      const top = Math.max(r.top, 0);
      const bottom = Math.min(r.bottom, vh);
      let visible = false;
      for (let y = top + 1; y < bottom && !visible; y += 6) {
        // Skip the control's own rows: what is behind it there is PROBE's job.
        if (y >= c.top && y <= c.bottom) continue;
        const hit = document.elementsFromPoint(x, y).find((n) => !ours(n) && !ignorable(n));
        if (hit && (el === hit || el.contains(hit))) {
          let o = 1;
          for (let n = el; n && n.nodeType === 1; n = n.parentElement) o *= parseFloat(getComputedStyle(n).opacity);
          visible = o > 0.05;
        }
      }
      if (visible) {
        const label = el.getAttribute("aria-label") || el.getAttribute("alt") || (el.textContent || "").trim().slice(0, 40);
        found.push(`${which} | column | ${el.closest("[id]")?.id ?? "?"} <${el.tagName.toLowerCase()}> ${label}`);
      }
    }
  }
  return found;
};

const STATE = (ids) => {
  const vh = innerHeight;
  const line = vh * 0.4;
  let expected = ids[0];
  for (const id of ids) {
    const el = document.getElementById(id);
    if (el && el.getBoundingClientRect().top <= line) expected = id;
  }
  const f = document.getElementById(ids[ids.length - 1]).getBoundingClientRect();
  if (Math.min(f.bottom, vh) - Math.max(f.top, 0) >= f.height * 0.5 - 1) {
    expected = ids[ids.length - 1];
  }
  const current = document
    .querySelector('nav[aria-label="Sections"] a[aria-current="true"]')
    ?.getAttribute("href")
    ?.slice(1);
  const hero = document.getElementById("intro").offsetHeight;
  return {
    y: Math.round(scrollY),
    expected,
    current,
    backToTop: !!document.querySelector('button[aria-label="Back to top"]'),
    showAt: hero + vh,
    hideAt: vh * 0.3,
    limit: document.documentElement.scrollHeight - vh,
  };
};

async function sampleScroll(page, ms) {
  const samples = [];
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    samples.push(await page.evaluate(() => Math.round(scrollY)));
    await page.waitForTimeout(40);
  }
  return samples;
}

async function jumpCheck(page, vp, id) {
  const before = await page.evaluate(() => Math.round(scrollY));
  if (vp.layout === "rail") {
    await page.locator(`nav[aria-label="Sections"] > ol a[href="#${id}"]`).click();
  } else {
    const trigger = page.locator('nav[aria-label="Sections"] > button');
    if (vp.touch) await trigger.tap();
    else await trigger.click();
    await page.waitForTimeout(450);
    const expanded = await trigger.getAttribute("aria-expanded");
    if (expanded !== "true") return { id, ok: false, why: "menu did not open" };
    const link = page.locator(`nav[aria-label="Sections"] div a[href="#${id}"]`);
    if (vp.touch) await link.tap();
    else await link.click();
  }
  const samples = await sampleScroll(page, 1700);
  await page.waitForTimeout(300);
  const after = await page.evaluate((id) => {
    const el = document.getElementById(id);
    return {
      top: Math.round(el.getBoundingClientRect().top),
      y: Math.round(scrollY),
      limit: document.documentElement.scrollHeight - innerHeight,
      current: document
        .querySelector('nav[aria-label="Sections"] a[aria-current="true"]')
        ?.getAttribute("href")
        ?.slice(1),
      focused: document.activeElement?.id,
      menuOpen:
        document.querySelector('nav[aria-label="Sections"] > button')?.getAttribute("aria-expanded") === "true",
    };
  }, id);
  const distinct = new Set(samples).size;
  const landed = Math.abs(after.top) <= 2 || Math.abs(after.y - after.limit) <= 2;
  const animated = Math.abs(after.y - before) < 50 || distinct >= 5;
  const ok =
    landed && animated && after.current === id && after.focused === id && !after.menuOpen;
  return { id, ok, from: before, to: after.y, top: after.top, frames: distinct, active: after.current, focused: after.focused, menuOpen: after.menuOpen };
}

const browser = await chromium.launch();
let failures = 0;
const fail = (msg) => {
  failures++;
  console.log(`  FAIL ${msg}`);
};

// VERIFY_ONLY=1440,375 runs a subset (matched against the label); REDUCED=0 skips
// the reduced-motion pass.
const ONLY = process.env.VERIFY_ONLY?.split(",");
for (const vp of VIEWPORTS.filter((v) => !ONLY || ONLY.some((o) => v.label.includes(o)))) {
  console.log(`\n=== ${vp.label} (${vp.layout}) ===`);
  const { context, page, errors } = await open(browser, vp);

  // Which layout is actually showing.
  const shown = await page.evaluate(() => {
    const [rail, menu] = document.querySelectorAll('nav[aria-label="Sections"]');
    return {
      rail: getComputedStyle(rail).display !== "none",
      menu: getComputedStyle(menu).display !== "none",
      railOpacity: getComputedStyle(rail).opacity,
      menuOpacity: getComputedStyle(menu).opacity,
    };
  });
  console.log(`  layout shown: rail=${shown.rail} (opacity ${shown.railOpacity}) menu=${shown.menu} (opacity ${shown.menuOpacity})`);
  if (shown.rail !== (vp.layout === "rail") || shown.menu !== (vp.layout === "menu")) {
    fail("wrong layout for this width");
  }

  // Closed rail labels must not intercept anything on the page.
  if (vp.layout === "rail") {
    const labelHit = await page.evaluate(() => {
      const a = document.querySelector('nav[aria-label="Sections"] > ol a[href="#work"]');
      const r = a.getBoundingClientRect();
      const el = document.elementFromPoint(r.left - 60, r.top + r.height / 2);
      return el?.closest('nav[aria-label="Sections"]') ? "nav" : "page";
    });
    console.log(`  closed label area hit-tests to: ${labelHit}`);
    if (labelHit !== "page") fail("hidden labels intercept pointer events");
  }

  if (vp.width === 1440) {
    await page.screenshot({ path: path.join(SHOTS, "nav-1440-hero.png") });
  }

  // 1. Step through the whole page: active sync, BackToTop thresholds, overlaps.
  const limit = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  const step = Math.round(vp.height * 0.2);
  const mismatches = [];
  const late = [];
  const btt = [];
  const hits = new Map();
  const columnHits = new Map();
  const note =(kind, which, desc, y) => {
    const key = `${which} | ${kind} | ${desc}`;
    const h = hits.get(key) ?? { first: y, last: y, n: 0 };
    h.last = y;
    h.n++;
    hits.set(key, h);
  };
  const positions = [];
  for (let y = 0; y <= limit; y += step) positions.push(y);
  positions.push(limit);
  for (const y of positions) {
    await page.evaluate((y) => window.scrollTo(0, y), y);
    await page.waitForTimeout(90);
    let s = await page.evaluate(STATE, IDS);
    if (s.expected !== s.current) {
      // Observer callbacks are delivered when the main thread is free. Give a
      // busy frame (YouTube players spinning up near Favorites, say) time to
      // clear before calling it a desync: a real one does not fix itself.
      const first = `${s.expected}/${s.current}`;
      await page.waitForTimeout(600);
      s = await page.evaluate(STATE, IDS);
      if (s.expected !== s.current) mismatches.push(`${s.y}: expected ${s.expected}, got ${s.current}`);
      else late.push(`${s.y}: ${first} resolved within 690ms`);
    }
    const shouldShow = s.y > s.showAt; // scrolling down: show threshold applies
    if (s.backToTop !== shouldShow && Math.abs(s.y - s.showAt) > step) {
      btt.push(`${s.y}: visible=${s.backToTop}, showAt=${Math.round(s.showAt)}`);
    }
    for (const probe of await page.evaluate(PROBE)) {
      for (const d of probe.interactive) note("INTERACTIVE", probe.which, d, s.y);
      for (const d of probe.content) note("content", probe.which, d, s.y);
    }
    // The column scan only means something where controls live in a gutter.
    if (vp.layout === "rail") {
      for (const d of await page.evaluate(COLUMN)) {
        const h = columnHits.get(d) ?? { first: s.y, last: s.y, n: 0 };
        h.last = s.y;
        h.n++;
        columnHits.set(d, h);
      }
    }
  }
  // Back up again: hysteresis means it stays until within 0.3vh of the top.
  const upChecks = [];
  for (const y of [Math.round(vp.height * 1.2), Math.round(vp.height * 0.5), Math.round(vp.height * 0.2), 0]) {
    await page.evaluate((y) => window.scrollTo(0, y), y);
    // Longer than the 0.35s exit, which keeps the button in the DOM while it fades.
    await page.waitForTimeout(550);
    const s = await page.evaluate(STATE, IDS);
    upChecks.push(`${s.y}:${s.backToTop ? "shown" : "hidden"}`);
    if (s.backToTop !== s.y > s.hideAt) btt.push(`up ${s.y}: visible=${s.backToTop}, hideAt=${s.hideAt}`);
  }
  console.log(`  stepped ${positions.length} positions over ${limit}px`);
  console.log(`  active-section mismatches: ${mismatches.length} (plus ${late.length} that were only late)`);
  for (const m of mismatches.slice(0, 8)) console.log(`    ${m}`);
  for (const m of late.slice(0, 8)) console.log(`    late: ${m}`);
  if (mismatches.length) fail("active section out of sync");
  console.log(`  back-to-top on the way up: ${upChecks.join("  ")}`);
  for (const b of btt) console.log(`    ${b}`);
  if (btt.length) fail("back-to-top thresholds");

  const rows = [...hits.entries()].sort();
  const interactiveRows = rows.filter(([k]) => k.includes("INTERACTIVE"));
  console.log(`  under fixed controls: ${interactiveRows.length} interactive, ${rows.length - interactiveRows.length} content`);
  for (const [k, h] of rows) {
    console.log(`    ${k}  (y ${h.first}..${h.last}, ${h.n} samples)`);
  }
  // From lg every control lives in a gutter content never enters, so anything
  // interactive under one is a real collision. Below lg the gutter is narrower
  // than any usable control, so passing overlaps are reported, not failed.
  if (vp.layout === "rail" && interactiveRows.length) fail("interactive element under a fixed control");
  if (vp.layout === "rail") {
    console.log(`  in a control's column anywhere on the page: ${columnHits.size}`);
    for (const [k, h] of [...columnHits.entries()].sort()) {
      console.log(`    ${k}  (y ${h.first}..${h.last}, ${h.n} samples)`);
    }
    if (columnHits.size) fail("content inside a control's column");
  }

  // 2. Jumps, long ones in both directions first.
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
  for (const id of ["favorites", "game", "work", "travel", "contact", "intro", "art", "riding", "music"]) {
    const r = await jumpCheck(page, vp, id);
    console.log(`  jump ${r.id.padEnd(9)} ${r.ok ? "ok  " : "FAIL"} ${r.from} -> ${r.to} top=${r.top} frames=${r.frames} active=${r.active} focus=${r.focused}${r.why ? " " + r.why : ""}`);
    if (!r.ok) fail(`jump to ${id}`);
    if (vp.width === 1440 && id === "travel") {
      // Mid-journey, columns moving, both controls on screen.
      await page.evaluate(() => window.scrollBy(0, innerHeight * 2.4));
      await page.waitForTimeout(700);
      await page.mouse.move(700, 450);
      await page.screenshot({ path: path.join(SHOTS, "nav-1440-travel.png") });
    }
    if (vp.width === 375 && id === "travel") {
      await page.evaluate(() => window.scrollBy(0, innerHeight * 2.4));
      await page.waitForTimeout(700);
      await page.screenshot({ path: path.join(SHOTS, "nav-375-travel.png") });
    }
  }

  // 3. Back to top.
  await page.evaluate((y) => window.scrollTo(0, y), Math.round(limit * 0.6));
  await page.waitForTimeout(700);
  const btn = page.locator('button[aria-label="Back to top"]');
  if (!(await btn.isVisible())) {
    fail("back-to-top not visible mid-page");
  } else {
    if (vp.touch) await btn.tap();
    else await btn.click();
    const samples = await sampleScroll(page, 1700);
    await page.waitForTimeout(600);
    const end = await page.evaluate(() => ({
      y: Math.round(scrollY),
      gone: !document.querySelector('button[aria-label="Back to top"]'),
      focused: document.activeElement?.id,
      active: document.querySelector('nav[aria-label="Sections"] a[aria-current="true"]')?.getAttribute("href"),
    }));
    const frames = new Set(samples).size;
    const ok = end.y === 0 && end.gone && frames >= 5 && end.focused === "intro" && end.active === "#intro";
    console.log(`  back-to-top ${ok ? "ok  " : "FAIL"} y=${end.y} frames=${frames} gone=${end.gone} focus=${end.focused} active=${end.active}`);
    if (!ok) fail("back-to-top click");
  }

  // 4. Layout-specific interaction checks.
  if (vp.layout === "rail") {
    // Hover opens labels, Escape dismisses them without moving the pointer.
    await page.evaluate((y) => window.scrollTo(0, y), await page.evaluate(() => document.getElementById("art").offsetTop + 200));
    await page.waitForTimeout(500);
    await page.locator('nav[aria-label="Sections"] > ol a[href="#art"]').hover();
    await page.waitForTimeout(700);
    const opened = await page.evaluate(() =>
      getComputedStyle(document.querySelector('nav[aria-label="Sections"] > ol a[href="#art"] > span')).opacity,
    );
    if (vp.width === 1440) await page.screenshot({ path: path.join(SHOTS, "nav-1440-art-hover.png") });
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);
    const dismissed = await page.evaluate(() =>
      getComputedStyle(document.querySelector('nav[aria-label="Sections"] > ol a[href="#art"] > span')).opacity,
    );
    console.log(`  hover labels: opacity ${opened} -> after Escape ${dismissed}`);
    if (opened !== "1" || dismissed !== "0") fail("hover labels open/dismiss");
    await page.mouse.move(vp.width / 2, vp.height / 2);

    // Keyboard: Tab into the rail, visible focus, Enter jumps and moves focus.
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);
    // Start where a keyboard user arrives from: the last link of the primary
    // nav, which is immediately before the rail in the DOM. (After blur(),
    // Chrome keeps the sequential-focus starting point wherever focus last
    // was, so Tab from <body> is not a reliable start.)
    await page.locator('nav[aria-label="Primary"] a').last().focus();
    await page.keyboard.press("Tab");
    const inRail = await page.evaluate(
      () => document.activeElement?.getAttribute("href") === "#intro" &&
        !!document.activeElement.closest('nav[aria-label="Sections"] > ol'),
    );
    await page.keyboard.press("Tab"); // intro -> work
    await page.waitForTimeout(500);
    const focus = await page.evaluate(() => {
      const a = document.activeElement;
      const label = a?.querySelector("span");
      return {
        href: a?.getAttribute("href"),
        ring: a ? getComputedStyle(a).boxShadow : "none",
        labels: label ? getComputedStyle(label).opacity : "n/a",
      };
    });
    await page.keyboard.press("Enter");
    await page.waitForTimeout(1900);
    await page.keyboard.press("Tab");
    const next = await page.evaluate(() => ({
      insideWork: !!document.activeElement?.closest("#work"),
      el: document.activeElement?.tagName + " " + (document.activeElement?.textContent || "").trim().slice(0, 30),
      top: Math.round(document.getElementById("work").getBoundingClientRect().top),
    }));
    const kbOk = inRail && focus.href === "#work" && focus.ring !== "none" && focus.labels === "1" && next.insideWork && Math.abs(next.top) <= 2;
    console.log(`  keyboard ${kbOk ? "ok  " : "FAIL"} focused ${focus.href}, ring=${focus.ring !== "none"}, labels=${focus.labels}; after Enter+Tab focus in #work=${next.insideWork} (${next.el}), work top=${next.top}`);
    if (!kbOk) fail("keyboard flow");
  } else {
    // Outside tap closes, Escape closes and returns focus to the trigger.
    const trigger = page.locator('nav[aria-label="Sections"] > button');
    await page.evaluate(() => window.scrollTo(0, innerHeight * 1.5));
    await page.waitForTimeout(400);
    if (vp.touch) await trigger.tap();
    else await trigger.click();
    await page.waitForTimeout(450);
    if (vp.width === 375) await page.screenshot({ path: path.join(SHOTS, "nav-375-menu-open.png") });
    if (vp.touch) await page.touchscreen.tap(vp.width / 2, 120);
    else await page.mouse.click(vp.width / 2, 120);
    await page.waitForTimeout(450);
    const afterOutside = await trigger.getAttribute("aria-expanded");
    await trigger.focus();
    await page.keyboard.press("Enter");
    await page.waitForTimeout(450);
    await page.keyboard.press("Tab");
    const tabbedIn = await page.evaluate(() => document.activeElement?.closest('nav[aria-label="Sections"] div') ? document.activeElement.getAttribute("href") : null);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(450);
    const escState = await page.evaluate(() => ({
      expanded: document.querySelector('nav[aria-label="Sections"] > button').getAttribute("aria-expanded"),
      focusOnTrigger: document.activeElement === document.querySelector('nav[aria-label="Sections"] > button'),
      ring: getComputedStyle(document.activeElement).boxShadow !== "none",
    }));
    const menuOk = afterOutside === "false" && tabbedIn === "#intro" && escState.expanded === "false" && escState.focusOnTrigger && escState.ring;
    console.log(`  menu ${menuOk ? "ok  " : "FAIL"} outside-tap closes=${afterOutside === "false"}, Tab enters list at ${tabbedIn}, Escape closes=${escState.expanded === "false"} focus back on trigger=${escState.focusOnTrigger} ring=${escState.ring}`);
    if (!menuOk) fail("menu open/close");
  }

  console.log(`  console errors: ${errors.length}`);
  for (const e of errors.slice(0, 5)) console.log(`    ${e.slice(0, 200)}`);
  if (errors.length) fail("console errors");
  await context.close();
}

// 5. Reduced motion: no Lenis, jumps are instant, focus still moves.
if (process.env.REDUCED !== "0") {
  console.log("\n=== 1440 x 900, prefers-reduced-motion ===");
  const vp = { width: 1440, height: 900, layout: "rail" };
  const { context, page, errors } = await open(browser, vp, { reducedMotion: "reduce" });
  await page.locator('nav[aria-label="Sections"] > ol a[href="#art"]').click();
  const samples = await sampleScroll(page, 300);
  const end = await page.evaluate(() => ({
    top: Math.round(document.getElementById("art").getBoundingClientRect().top),
    focused: document.activeElement?.id,
  }));
  const ok = Math.abs(end.top) <= 2 && new Set(samples).size === 1 && end.focused === "art";
  console.log(`  reduced-motion jump ${ok ? "ok  " : "FAIL"} art top=${end.top}, distinct scroll values after click=${new Set(samples).size}, focus=${end.focused}`);
  if (!ok) fail("reduced motion jump");
  const btt = page.locator('button[aria-label="Back to top"]');
  await btt.click();
  await page.waitForTimeout(100);
  const y = await page.evaluate(() => Math.round(scrollY));
  console.log(`  reduced-motion back-to-top ${y === 0 ? "ok  " : "FAIL"} y=${y}`);
  if (y !== 0) fail("reduced motion back-to-top");
  if (errors.length) fail(`console errors: ${errors.join(" | ").slice(0, 300)}`);
  await context.close();
}

await browser.close();
console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} FAILURE(S)`}  (screenshots in ${SHOTS})`);
process.exit(failures === 0 ? 0 : 1);
