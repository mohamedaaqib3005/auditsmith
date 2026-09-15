// scripts/check-access.js
// Accessibility via axe-core, the open-source industry engine (the same
// one behind Lighthouse's accessibility audits), run by our own headless
// browser against the site directly. No third-party checker involved.
// Facts written: rules passed/violated, elements by impact level, and
// the top named issues. The composer derives the score.
//
// One-time setup:  npm install playwright @axe-core/playwright
//                  npx playwright install chromium
// Usage:           node scripts/check-access.js            (site from audit-data.json)
//                  node scripts/check-access.js example.com

import fs from "fs";
import { chromium } from "playwright";
import { AxeBuilder } from "@axe-core/playwright";

const DATA_PATH = "src/data/audit-data.json";
const data = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
const site = process.argv[2] || data.site;
if (!site) { console.error("No site given and none in audit-data.json."); process.exit(1); }
const target = `https://${String(site).replace(/^https?:\/\//, "").replace(/\/$/, "")}`;

const browser = await chromium.launch();
const ctx = await browser.newContext(process.env.AUDITSMITH_INSECURE ? { ignoreHTTPSErrors: true } : {});
const page = await ctx.newPage();

try {
  console.log(`Running axe-core against ${target} ...`);
  await page.goto(target, { waitUntil: "load", timeout: 60000 });
  await page.waitForTimeout(2500);
  const res = await new AxeBuilder({ page }).analyze();

  const nodesByImpact = { critical: 0, serious: 0, moderate: 0, minor: 0 };
  for (const v of res.violations)
    if (v.impact in nodesByImpact) nodesByImpact[v.impact] += v.nodes.length;

  const topIssues = [...res.violations]
    .sort((a, b) => {
      const w = { critical: 0, serious: 1, moderate: 2, minor: 3 };
      return (w[a.impact] ?? 9) - (w[b.impact] ?? 9) || b.nodes.length - a.nodes.length;
    })
    .slice(0, 6)
    .map((v) => ({ id: v.id, impact: v.impact, elements: v.nodes.length, help: v.help }));

  data.accessibility = {
    engine: "axe-core",
    rulesPassed: res.passes.length,
    rulesViolated: res.violations.length,
    nodesByImpact,
    topIssues,
  };
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2) + "\n");

  console.log(`Checked ${target} (axe-core):`);
  console.log(`  rules passed   : ${res.passes.length}`);
  console.log(`  rules violated : ${res.violations.length}`);
  console.log(`  elements       : ${Object.entries(nodesByImpact).filter(([,n])=>n).map(([k,n])=>`${n} ${k}`).join(", ") || "none"}`);
  for (const t of topIssues) console.log(`  - [${t.impact}] ${t.id}: ${t.elements} element(s)`);
  console.log(`\nWritten to ${DATA_PATH}.`);
} finally {
  await browser.close();
}
