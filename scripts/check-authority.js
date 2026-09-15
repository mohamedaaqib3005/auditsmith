// scripts/check-authority.js
// Off-site authority via OpenPageRank (free API): a 0-10 link-graph score,
// global rank, and referring-domain count for the site, and for its
// competitors when data.competitors lists them. Approximate by nature
// (Common Crawl graph, monthly); the report labels it as such.
//
// Key: OPR_KEY in .env or on the command line.
// Usage: node scripts/check-authority.js            (site from audit-data.json)
//        node scripts/check-authority.js example.com

import "./env.js";
import fs from "fs";

const DATA_PATH = "src/data/audit-data.json";
const data = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
const site = process.argv[2] || data.site;
if (!site) { console.error("No site given and none in audit-data.json."); process.exit(1); }
if (!process.env.OPR_KEY) { console.error("No OPR_KEY found (in .env or the environment). Nothing checked."); process.exit(1); }

const host = String(site).replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
const competitors = (data.competitors || []).map((c) => String(c).replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0]);
const domains = [host, ...competitors];

const res = await fetch("https://openpagerank.keywordseverywhere.com/v1/domains/bulk", {
  method: "POST",
  headers: { Authorization: `Bearer ${process.env.OPR_KEY}`, "Content-Type": "application/json" },
  body: JSON.stringify({ domains }),
  signal: AbortSignal.timeout(30000),
});
if (!res.ok) {
  console.error(`OpenPageRank: HTTP ${res.status}. Nothing written.`);
  process.exit(1);
}
const j = await res.json();
const byDomain = {};
for (const r of j.results || []) if (r.found) byDomain[r.domain] = r;

const mine = byDomain[host];
if (!mine) { console.error(`${host} not found in the OpenPageRank graph. Nothing written.`); process.exit(1); }

const authority = {
  score: mine.open_page_rank,
  rank: mine.rank ?? undefined,
  referringDomains: mine.referring_domains ?? undefined,
  asOf: j.as_of || undefined,
  source: "OpenPageRank",
};
const comps = competitors
  .map((c) => byDomain[c])
  .filter(Boolean)
  .map((r) => ({ domain: r.domain, score: r.open_page_rank, referringDomains: r.referring_domains ?? undefined }));
if (comps.length) authority.competitors = comps;

data.domain = { ...(data.domain || {}), authority };
fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2) + "\n");

console.log(`Checked ${host} (OpenPageRank, as of ${authority.asOf}):`);
console.log(`  score            : ${authority.score} / 10`);
if (authority.rank) console.log(`  global rank      : #${authority.rank.toLocaleString()}`);
if (authority.referringDomains != null) console.log(`  referring domains: ${authority.referringDomains}`);
for (const c of comps) console.log(`  vs ${c.domain.padEnd(22)}: ${c.score} / 10, ${c.referringDomains ?? "?"} referring domains`);
console.log(`\nWritten to ${DATA_PATH}. Competitors come from a top-level "competitors" list in the data file.`);
