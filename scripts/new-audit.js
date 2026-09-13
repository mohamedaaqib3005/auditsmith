// scripts/new-audit.js
// Starts a fresh audit for a new site, first archiving the current one so
// no client's work is ever lost. Archives land in audits/ named by brand
// and date, and any of them can be restored by copying it back over
// src/data/audit-data.json.
//
// Usage: node scripts/new-audit.js newclient.com

import fs from "fs";

const DATA_PATH = "src/data/audit-data.json";
const newSite = process.argv[2];
if (!newSite) {
  console.error("Usage: node scripts/new-audit.js <newclient.com>");
  process.exit(1);
}

// 1. archive the current audit, if one exists with a site
let archived = null;
try {
  const current = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  if (current.site) {
    const brand = String(current.site).replace(/^https?:\/\//, "").replace(/^www\./, "").split(".")[0];
    const stamp = new Date().toISOString().slice(0, 10);
    fs.mkdirSync("audits", { recursive: true });
    archived = `audits/${brand}-${stamp}.json`;
    // never silently overwrite an earlier archive from the same day
    let path = archived, n = 2;
    while (fs.existsSync(path)) path = archived.replace(".json", `-${n++}.json`);
    archived = path;
    fs.copyFileSync(DATA_PATH, archived);
  }
} catch { /* no current data, nothing to archive */ }

// 2. fresh start: just the site; every script and typed step fills the rest
const clean = String(newSite).replace(/^https?:\/\//, "").replace(/\/$/, "");
fs.writeFileSync(DATA_PATH, JSON.stringify({ site: clean }, null, 2) + "\n");

if (archived) console.log(`Archived the current audit to ${archived}`);
console.log(`Fresh audit started for ${clean}.`);
console.log(`Next: run the scripts (check-ai, check-tech, check-brand, check-pagespeed, check-domain, check-access, check-seo-scores), crawl + csv-to-data, type the agentic fraction.`);
console.log(`To reopen an old audit: cp audits/<name>.json ${DATA_PATH}`);
