// scripts/check-seo-scores.js
// AI/SEO score fetcher: drives Seomator's free audit app headlessly and
// reads the E-E-A-T, Social and Structured Data category results into
// aiReadiness.scores. Their app reports each category as a checks
// fraction (e.g. E-E-A-T 9/14); this is stored as a 0-100 percentage,
// the shape the score rings expect.
//
// One-time setup:  npm install playwright && npx playwright install chromium
// Usage:           node scripts/check-seo-scores.js            (site from audit-data.json)
//                  node scripts/check-seo-scores.js example.com
//
// Drives a third-party site; if their app changes, this may need updating.
// A failed run writes nothing.

import fs from "fs";
import { chromium } from "playwright";

const DATA_PATH = "src/data/audit-data.json";
const data = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
const site = process.argv[2] || data.site;
if (!site) { console.error("No site given and none in audit-data.json."); process.exit(1); }
const target = `https://${String(site).replace(/^https?:\/\//, "").replace(/\/$/, "")}`;

const LABELS = { "E-E-A-T": "EEAT", "Social": "socials", "Structured Data": "structuredData" };

const browser = await chromium.launch();
const ctx = await browser.newContext(process.env.AUDITSMITH_INSECURE ? { ignoreHTTPSErrors: true } : {});
const page = await ctx.newPage();

try {
  console.log(`Running the Seomator audit for ${target} (their app takes 1-3 minutes)...`);
  await page.goto(
    "https://free-tools.seomator.com/seo-audit-tool?url=" + encodeURIComponent(target),
    { waitUntil: "load", timeout: 60000 }
  );
  await page.waitForFunction(() => (document.body?.innerText || "").length > 2000, null, { timeout: 170000 });
  await page.locator("text=Categories").first().click({ timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(4000);

  const found = await page.evaluate((labels) => {
    const res = {};
    for (const label of Object.keys(labels)) {
      const els = [...document.querySelectorAll("*")].filter(
        (e) => e.children.length === 0 && e.textContent.trim() === label
      );
      for (const e of els) {
        let box = e;
        for (let i = 0; i < 4 && box.parentElement; i++) {
          box = box.parentElement;
          const txt = box.innerText.replace(/\s+/g, " ").trim();
          const m = txt.match(new RegExp(label.replace(/[-]/g, "\\-") + "[^/]{0,40}?(\\d+)\\s*\\/\\s*(\\d+)"));
          if (m && txt.length < 200) {
            res[label] = { passed: Number(m[1]), total: Number(m[2]) };
            break;
          }
        }
        if (res[label]) break;
      }
    }
    return res;
  }, LABELS);

  const keys = Object.keys(found);
  if (!keys.length) {
    console.error("Report loaded but no category scores parsed. Nothing written.");
    process.exit(1);
  }

  data.aiReadiness = data.aiReadiness || {};
  data.aiReadiness.scores = data.aiReadiness.scores || {};
  console.log(`Checked ${target}:`);
  for (const [label, key] of Object.entries(LABELS)) {
    const f = found[label];
    if (!f) { console.log(`  ${label.padEnd(16)}: not found on the report, unchanged`); continue; }
    const pct = Math.round((f.passed / f.total) * 100);
    data.aiReadiness.scores[key] = pct;
    console.log(`  ${label.padEnd(16)}: ${f.passed}/${f.total} checks -> ${pct}`);
  }
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2) + "\n");
  console.log(`\nWritten to ${DATA_PATH}.`);
} finally {
  await browser.close();
}
