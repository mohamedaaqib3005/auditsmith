// scripts/check-ai.js
// Terminal flavour of the site checker. Same logic as the in-app
// "Check live site" button (src/lib/checkSite.js); this wrapper adds
// reading/writing audit-data.json and printing.
//
// Usage:
//   node scripts/check-ai.js            (site read from audit-data.json)
//   node scripts/check-ai.js vlncy.com  (explicit site)

import fs from "fs";
import { checkSite, applySiteCheck } from "../src/lib/checkSite.js";

const DATA_PATH = "src/data/audit-data.json";
const data = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
const site = process.argv[2] || data.site;
if (!site) {
  console.error("No site given and none in audit-data.json.");
  process.exit(1);
}

const result = await checkSite(site);
const merged = applySiteCheck(data, result);
fs.writeFileSync(DATA_PATH, JSON.stringify(merged, null, 2) + "\n");

const line = (name, r) =>
  `  ${name.padEnd(15)}: ${(r.value || "not written").padEnd(11)} (${r.detail})`;
console.log(`Checked ${result.origin}:`);
console.log("aiReadiness:");
for (const [k, r] of Object.entries(result.aiReadiness)) console.log(line(k, r));
console.log("technicalSeo:");
for (const [k, r] of Object.entries(result.technicalSeo)) console.log(line(k, r));
console.log(`\nWritten to ${DATA_PATH}. metaRobots comes from the crawl CSV; redirectChains from SF's Redirect Chains report.`);
