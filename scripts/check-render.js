// scripts/check-render.js
// JavaScript dependence: how many words the fully rendered page shows,
// compared with the no-JS word count check-ai already measures. A large
// gap means content that only exists after JavaScript runs, invisible
// to non-rendering crawlers, including most AI bots.
//
// Needs the same Playwright setup as check-access.
// Usage: node scripts/check-render.js            (site from audit-data.json)
//        node scripts/check-render.js example.com

import fs from "fs";
import { chromium } from "playwright";

const DATA_PATH = "src/data/audit-data.json";
const data = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
const site = process.argv[2] || data.site;
if (!site) { console.error("No site given and none in audit-data.json."); process.exit(1); }
const target = `https://${String(site).replace(/^https?:\/\//, "").replace(/\/$/, "")}`;

const browser = await chromium.launch();
const ctx = await browser.newContext(process.env.AUDITSMITH_INSECURE ? { ignoreHTTPSErrors: true } : {});
const page = await ctx.newPage();
try {
  console.log(`Rendering ${target} ...`);
  await page.goto(target, { waitUntil: "load", timeout: 60000 });
  await page.waitForTimeout(3000);
  const text = await page.evaluate(() => document.body?.innerText || "");
  const words = text.split(/\s+/).filter((w) => w.length > 1).length;

  const sameSite =
    !process.argv[2] ||
    String(process.argv[2]).replace(/^https?:\/\//, "").replace(/\/$/, "") ===
      String(data.site || "").replace(/^https?:\/\//, "").replace(/\/$/, "");
  if (sameSite) {
    data.aiReadiness = data.aiReadiness || {};
    data.aiReadiness.renderedWords = words;
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2) + "\n");
  }

  const noJs = sameSite ? data.aiReadiness.noJsWords : null;
  console.log(`Checked ${target}:`);
  console.log(`  rendered words : ${words}`);
  if (noJs != null) console.log(`  no-JS words    : ${noJs}  (${words ? Math.round((Math.min(noJs, words) / words) * 100) : "?"}% of content survives without JavaScript)`);
  if (sameSite) console.log(`\nWritten to ${DATA_PATH}.`);
  else console.log(`\nPrint-only: the data file belongs to ${data.site}, nothing written. Point the data at this site (new-audit) to store it.`);
} finally {
  await browser.close();
}
