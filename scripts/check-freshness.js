// scripts/check-freshness.js
// Content freshness + sitemap coverage from the sitemap's own lastmod
// dates. Follows one level of sitemap-index nesting. Facts only.
//
// Usage: node scripts/check-freshness.js            (site from audit-data.json)
//        node scripts/check-freshness.js example.com

import fs from "fs";

const DATA_PATH = "src/data/audit-data.json";
const data = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
const site = process.argv[2] || data.site;
if (!site) { console.error("No site given and none in audit-data.json."); process.exit(1); }
const host = String(site).replace(/^https?:\/\//, "").replace(/\/$/, "");

const get = async (url) => {
  const r = await fetch(url, { signal: AbortSignal.timeout(20000), headers: { "User-Agent": "AuditsmithCheck/1.0" } });
  return r.ok ? r.text() : null;
};

let xml = await get(`https://${host}/sitemap.xml`);
if (!xml) { console.error("No sitemap.xml reachable. Nothing written."); process.exit(1); }

let urls = [];
if (/<sitemapindex/i.test(xml)) {
  const children = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).slice(0, 5);
  for (const c of children) {
    const child = await get(c.trim());
    if (child) urls.push(...[...child.matchAll(/<url>[\s\S]*?<\/url>/g)].map((m) => m[0]));
  }
} else {
  urls = [...xml.matchAll(/<url>[\s\S]*?<\/url>/g)].map((m) => m[0]);
}

const dates = urls
  .map((u) => u.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1])
  .filter(Boolean)
  .map((d) => new Date(d))
  .filter((d) => !isNaN(d));

const now = Date.now();
const MONTH = 30.44 * 86400000;
const freshness = {
  sitemapUrls: urls.length,
  withDates: dates.length,
};
if (dates.length) {
  const sorted = dates.slice().sort((a, b) => a - b);
  freshness.newest = sorted[sorted.length - 1].toISOString().slice(0, 10);
  freshness.oldest = sorted[0].toISOString().slice(0, 10);
  freshness.updatedLast3Months = dates.filter((d) => now - d < 3 * MONTH).length;
  freshness.olderThanYear = dates.filter((d) => now - d > 12 * MONTH).length;
}

data.contentFreshness = freshness;
fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2) + "\n");

console.log(`Checked https://${host}/sitemap.xml:`);
for (const [k, v] of Object.entries(freshness)) console.log(`  ${k.padEnd(18)}: ${v}`);
console.log(`\nWritten to ${DATA_PATH}.`);
