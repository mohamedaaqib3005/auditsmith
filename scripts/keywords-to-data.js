// scripts/keywords-to-data.js
// Keyword Gap door: reads a Semrush Keyword Gap CSV export (the site vs
// competitors) and writes the "keywords" facts block. Positions are facts;
// every verdict lives in the composer.
//
// Usage: node scripts/keywords-to-data.js ~/Downloads/gap.keywords.csv

import fs from "fs";
import Papa from "papaparse";

const DATA_PATH = "src/data/audit-data.json";
const csvPath = process.argv[2];
if (!csvPath) { console.error("Usage: node scripts/keywords-to-data.js <gap-export.csv>"); process.exit(1); }

const data = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
const site = String(data.site || "").replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];

const { data: rows, meta } = Papa.parse(fs.readFileSync(csvPath, "utf8"), { header: true, skipEmptyLines: true });
const cols = meta.fields || [];

// Domain columns: those that look like hostnames, excluding "(pages)" variants
const domainCols = cols.filter((c) => /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(c.trim()));
if (!domainCols.length) { console.error("No domain columns recognised in this CSV."); process.exit(1); }
const siteCol = domainCols.find((c) => c.trim().toLowerCase() === site) || domainCols[0];
const competitors = domainCols.filter((c) => c !== siteCol).map((c) => c.trim());
if (siteCol.trim().toLowerCase() !== site)
  console.warn(`Note: data.site is "${site}" but the export's first domain is "${siteCol}", using "${siteCol}" as the audited site.`);

const pos = (v) => {
  const n = parseInt(String(v ?? "").replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) && n > 0 ? n : null;
};
const vol = (v) => {
  const n = parseInt(String(v ?? "").replace(/[,\s]/g, ""), 10);
  return Number.isFinite(n) ? n : 0;
};

let analysed = 0, missing = 0, behind = 0, ahead = 0;
const dist = { top3: 0, top10: 0, top20: 0, top100: 0 };
const opportunities = [];

for (const r of rows) {
  const mine = pos(r[siteCol]);
  const theirs = competitors
    .map((c) => ({ competitor: c, position: pos(r[c]) }))
    .filter((x) => x.position != null);
  if (mine == null && !theirs.length) continue;
  analysed++;

  if (mine != null) {
    if (mine <= 3) dist.top3++;
    if (mine <= 10) dist.top10++;
    if (mine <= 20) dist.top20++;
    if (mine <= 100) dist.top100++;
  }

  const best = theirs.sort((a, b) => a.position - b.position)[0];
  if (mine == null && best) {
    missing++;
    opportunities.push({ keyword: r.Keyword, volume: vol(r.Volume), competitor: best.competitor, position: best.position });
  } else if (mine != null && best && best.position < mine) behind++;
  else if (mine != null) ahead++;
}

opportunities.sort((a, b) => b.volume - a.volume);

data.keywords = {
  analysed,
  competitors,
  rankingDistribution: dist,
  missing,
  behind,
  ahead,
  topOpportunities: opportunities.slice(0, 6),
};
fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2) + "\n");

console.log(`Derived from ${csvPath.split("/").pop()} (${analysed} keywords vs ${competitors.join(", ")}):`);
console.log(`  distribution : top3 ${dist.top3}, top10 ${dist.top10}, top20 ${dist.top20}, top100 ${dist.top100}`);
console.log(`  gap          : missing ${missing}, behind ${behind}, ahead ${ahead}`);
console.log(`  opportunities: ${opportunities.slice(0, 3).map((o) => o.keyword).join("; ")}${opportunities.length > 3 ? "..." : ""}`);
console.log(`\nWritten to ${DATA_PATH}.`);
