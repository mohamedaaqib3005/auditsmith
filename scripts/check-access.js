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

  // Categories from axe's own rule taxonomy (cat.* tags)
  const CAT_LABELS = {
    "cat.color": "Colour & Contrast", "cat.forms": "Forms", "cat.name-role-value": "Names & Labels",
    "cat.structure": "Structure", "cat.semantics": "Semantics", "cat.text-alternatives": "Text Alternatives",
    "cat.aria": "ARIA", "cat.keyboard": "Keyboard", "cat.language": "Language", "cat.tables": "Tables",
    "cat.time-and-media": "Media", "cat.sensory-and-visual-cues": "Sensory Cues", "cat.parsing": "Parsing",
  };
  const categories = {};
  const catOf = (rule) => {
    const t = (rule.tags || []).find((x) => x.startsWith("cat."));
    return t ? (CAT_LABELS[t] || t.replace("cat.", "")) : "Other";
  };
  for (const r of res.passes) {
    const c = catOf(r);
    categories[c] = categories[c] || { passed: 0, failed: 0, elements: 0 };
    categories[c].passed++;
  }
  for (const r of res.violations) {
    const c = catOf(r);
    categories[c] = categories[c] || { passed: 0, failed: 0, elements: 0 };
    categories[c].failed++;
    categories[c].elements += r.nodes.length;
  }

  // WCAG AA coverage (rules tagged wcag2aa / wcag21aa / wcag22aa)
  const isAA = (r) => (r.tags || []).some((t) => /^wcag2(1|2)?aa$/.test(t));
  const wcagAA = {
    passed: res.passes.filter(isAA).length,
    failed: res.violations.filter(isAA).length,
  };

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
    categories,
    wcagAA,
    topIssues,
  };
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2) + "\n");

  console.log(`Checked ${target} (axe-core):`);
  console.log(`  rules passed   : ${res.passes.length}`);
  console.log(`  rules violated : ${res.violations.length}`);
  console.log(`  elements       : ${Object.entries(nodesByImpact).filter(([,n])=>n).map(([k,n])=>`${n} ${k}`).join(", ") || "none"}`);
  for (const [c, v] of Object.entries(categories))
    console.log(`  ${c.padEnd(18)}: ${v.failed ? `${v.failed} of ${v.passed + v.failed} rules failed (${v.elements} elements)` : `all ${v.passed} rules passed`}`);
  for (const t of topIssues) console.log(`  - [${t.impact}] ${t.id}: ${t.elements} element(s)`);
  console.log(`\nWritten to ${DATA_PATH}.`);
} finally {
  await browser.close();
}
