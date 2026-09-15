// scripts/check-usability.js
// Usability facts from two instruments in one run:
//   1. The PageSpeed API's detailed audits (byte weight, unsized images,
//      viewport, font legibility, tap targets, console errors), the same
//      free key as check-pagespeed.
//   2. Our own headless browser measuring the interaction substrate:
//      site search, nav links, form labelling, mobile overflow, contact
//      reachability, and the 404 page's usefulness.
// Facts only; the composer judges. Typed protocol blocks (heuristics,
// first impression, task walks) are documented in the guide and render
// alongside when present.
//
// Keys: PSI_KEY in .env. Playwright setup as check-access.
// Usage: node scripts/check-usability.js            (site from audit-data.json)

import "./env.js";
import fs from "fs";
import { chromium } from "playwright";

const DATA_PATH = "src/data/audit-data.json";
const data = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
const site = process.argv[2] || data.site;
if (!site) { console.error("No site given and none in audit-data.json."); process.exit(1); }
const clean = String(site).replace(/^https?:\/\//, "").replace(/\/$/, "");
const target = `https://${clean}`;
const sameSite = !process.argv[2] || clean === String(data.site || "").replace(/^https?:\/\//, "").replace(/\/$/, "");

const u = { };
const report = [];

// ---------- 1. PSI audit details ----------
if (process.env.PSI_KEY) {
  try {
    const url = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(target)}&strategy=mobile&category=PERFORMANCE&category=BEST_PRACTICES&category=SEO&key=${process.env.PSI_KEY}`;
    const r = await fetch(url, { signal: AbortSignal.timeout(90000) });
    const j = await r.json();
    const audits = j?.lighthouseResult?.audits || {};
    const num = (id, f) => { const a = audits[id]; if (a?.numericValue != null) u[f] = Math.round(a.numericValue); };
    const pass = (id, f) => { const a = audits[id]; if (a && a.score !== null) u[f] = a.score >= 0.9; };
    const count = (id, f) => { const a = audits[id]; if (a?.details?.items) u[f] = a.details.items.length; else if (a && a.score === 1) u[f] = 0; };
    num("total-byte-weight", "pageWeightKb"); if (u.pageWeightKb) u.pageWeightKb = Math.round(u.pageWeightKb / 1024);
    count("unsized-images", "unsizedImages");
    count("errors-in-console", "consoleErrors");
    pass("viewport", "viewportOk");
    pass("font-size", "fontLegible");
    pass("target-size", "tapTargetsOk");
    if (u.tapTargetsOk == null) pass("tap-targets", "tapTargetsOk");
    report.push(["PSI details", `weight ${u.pageWeightKb ?? "?"} KB, unsized images ${u.unsizedImages ?? "?"}, console errors ${u.consoleErrors ?? "?"}`]);
  } catch (e) { report.push(["PSI details", `could not check (${e.message})`]); }
} else report.push(["PSI details", "skipped, no PSI_KEY"]);

// ---------- 2. Browser substrate ----------
const browser = await chromium.launch();
const ctx = await browser.newContext(process.env.AUDITSMITH_INSECURE ? { ignoreHTTPSErrors: true, viewport: { width: 390, height: 844 } } : { viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
try {
  await page.goto(target, { waitUntil: "load", timeout: 60000 });
  await page.waitForTimeout(2500);
  Object.assign(u, await page.evaluate(() => {
    const doc = document;
    const inputs = [...doc.querySelectorAll("input:not([type=hidden]), textarea, select")];
    return {
      mobileOverflow: doc.documentElement.scrollWidth > doc.documentElement.clientWidth + 5,
      searchPresent: !!doc.querySelector("input[type=search], [role=search], input[placeholder*=earch]"),
      navLinks: (() => { const nav = doc.querySelector("nav, header"); return nav ? [...nav.querySelectorAll("a")].map(a => a.textContent.trim()).filter(Boolean).length : 0; })(),
      formInputs: inputs.length,
      labelledInputs: inputs.filter(i => i.labels?.length || i.getAttribute("aria-label") || i.getAttribute("placeholder")).length,
      contactReachable: !!([...doc.querySelectorAll("a")].find(a => /contact/i.test(a.textContent + a.href))),
    };
  }));
  report.push(["substrate", `search ${u.searchPresent}, nav ${u.navLinks}, inputs ${u.labelledInputs}/${u.formInputs} labelled, overflow ${u.mobileOverflow}`]);

  await page.goto(`${target}/auditsmith-definitely-missing-xyz`, { waitUntil: "load", timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(1200);
  u.notFound = await page.evaluate(() => {
    const t = document.body?.innerText || "";
    return {
      words: t.split(/\s+/).filter((w) => w.length > 1).length,
      hasHomeLink: !!([...document.querySelectorAll("a")].find((a) => a.getAttribute("href") === "/")),
      mentions404: /404|not found|doesn.t exist/i.test(t),
    };
  });
  report.push(["404 page", `${u.notFound.words} words, home link ${u.notFound.hasHomeLink}, acknowledges ${u.notFound.mentions404}`]);
} catch (e) {
  report.push(["substrate", `could not check (${e.message})`]);
} finally {
  await browser.close();
}

if (!Object.keys(u).length) { console.error("Nothing could be measured. Nothing written."); process.exit(1); }
if (sameSite) {
  data.usability = { ...(data.usability || {}), ...u };
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2) + "\n");
}
console.log(`Checked ${target}:`);
for (const [k, v] of report) console.log(`  ${k.padEnd(12)}: ${v}`);
console.log(sameSite ? `\nWritten to ${DATA_PATH}.` : `\nPrint-only: the data file belongs to ${data.site}, nothing written.`);
