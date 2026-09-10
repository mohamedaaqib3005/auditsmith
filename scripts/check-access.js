// scripts/check-access.js
// Accessibility fetcher: drives the Skynet accessibility checker in a
// headless browser (Playwright), reads the per-category Passed/Failed
// counts and the overall score, and writes the "accessibility" block.
//
// One-time setup:  npm install playwright && npx playwright install chromium
// Usage:           node scripts/check-access.js            (site from audit-data.json)
//                  node scripts/check-access.js example.com
//
// Honesty rules as everywhere: categories the checker cannot audit are
// omitted; a failed run writes nothing. This drives a third-party site,
// if their page changes, this script may need updating.

import fs from "fs";
import { chromium } from "playwright";

const DATA_PATH = "src/data/audit-data.json";
const data = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
const site = process.argv[2] || data.site;
if (!site) { console.error("No site given and none in audit-data.json."); process.exit(1); }
const target = `https://${String(site).replace(/^https?:\/\//, "").replace(/\/$/, "")}`;

const KEYMAP = {
  clickables: "clickables", titles: "titles", lists: "lists", graphics: "graphics",
  forms: "forms", document: "document", readability: "readability", tables: "tables",
  general: "general", "content audio/video": "media", "audio/video": "media", media: "media",
};

const browser = await chromium.launch();
const ctx = await browser.newContext(
  process.env.AUDITSMITH_INSECURE ? { ignoreHTTPSErrors: true } : {}
);
const page = await ctx.newPage();

try {
  console.log(`Submitting ${target} to the Skynet accessibility checker...`);
  await page.goto("https://www.skynettechnologies.com/accessibility-checker", { waitUntil: "domcontentloaded", timeout: 60000 });
  const urlInput = page.locator("input[id*=scan-ada], input[name*=scan-ada]").first();
  await urlInput.fill(target);
  const form = urlInput.locator("xpath=ancestor::form[1]");
  await form.locator("button, input[type=submit], a[class*=btn]").first().click({ timeout: 8000 })
    .catch(() => urlInput.press("Enter"));

  let body = "";
  let found = false;
  for (let i = 0; i < 14 && !found; i++) {
    await page.waitForTimeout(9000);
    body = await page.innerText("body").catch(() => "");
    found = /\d+\s*Passed\s*\d+\s*Failed/i.test(body);
    process.stdout.write(".");
  }
  console.log("");
  if (!found) {
    console.error("Scan did not produce category results within ~2 minutes. Nothing written.");
    process.exit(1);
  }

  const categories = {};
  for (const m of body.matchAll(/([A-Za-z][A-Za-z\s\/&]*?)\s*\n?\s*(\d+)\s*Passed\s*\n?\s*(\d+)\s*Failed/gi)) {
    const key = KEYMAP[m[1].trim().toLowerCase()];
    if (key) categories[key] = { passed: Number(m[2]), failed: Number(m[3]) };
  }
  if (!Object.keys(categories).length) {
    console.error("Results page loaded but no categories parsed. Nothing written.");
    process.exit(1);
  }

  const scoreM = body.match(/Accessibility Score[\s\S]{0,80}?([\d.]+)\s*%/i) || body.match(/([\d.]+)\s*%[\s\S]{0,60}?Accessibility Score/i);
  const score = scoreM ? Number(scoreM[1]) : null;

  data.accessibility = { ...(score != null ? { score } : {}), categories };
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2) + "\n");

  console.log(`Checked ${target}:`);
  if (score != null) console.log(`  score : ${score}%`);
  for (const [k, v] of Object.entries(categories))
    console.log(`  ${k.padEnd(12)}: ${v.passed} passed, ${v.failed} failed`);
  console.log(`\nWritten to ${DATA_PATH}. Categories the checker marked "Not Applicable" are omitted.`);
} finally {
  await browser.close();
}
