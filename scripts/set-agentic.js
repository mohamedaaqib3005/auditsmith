// scripts/set-agentic.js
// Types the Agentic Browsing fractions for you, no JSON editing.
//
// Usage: node scripts/set-agentic.js 2/3 3/3
//        (first = mobile, second = desktop; give one to set mobile only)

import fs from "fs";

const DATA_PATH = "src/data/audit-data.json";
const [mobile, desktop] = process.argv.slice(2);
const ok = (f) => /^\d+\/\d+$/.test(f || "");
if (!ok(mobile) || (desktop && !ok(desktop))) {
  console.error('Usage: node scripts/set-agentic.js <mobile> [desktop]   e.g. 2/3 3/3');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
data.pagespeed = data.pagespeed || {};
data.pagespeed.mobile = { ...(data.pagespeed.mobile || {}), agenticBrowsing: mobile };
if (desktop) data.pagespeed.desktop = { ...(data.pagespeed.desktop || {}), agenticBrowsing: desktop };
fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2) + "\n");

console.log(`Set: mobile ${mobile}${desktop ? `, desktop ${desktop}` : ""}. Written to ${DATA_PATH}.`);
