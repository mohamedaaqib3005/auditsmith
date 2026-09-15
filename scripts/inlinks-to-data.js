// scripts/inlinks-to-data.js
// Internal anchors door: reads Screaming Frog's All Inlinks export
// (Bulk Export -> Links -> All Inlinks) and derives anchor-text quality
// for internal text links. Facts only; the composer judges.
//
// Usage: node scripts/inlinks-to-data.js ~/Downloads/all_inlinks.csv

import fs from "fs";
import Papa from "papaparse";

const DATA_PATH = "src/data/audit-data.json";
const csvPath = process.argv[2];
if (!csvPath) { console.error("Usage: node scripts/inlinks-to-data.js <all-inlinks.csv>"); process.exit(1); }

const { data: rows, meta } = Papa.parse(fs.readFileSync(csvPath, "utf8"), { header: true, skipEmptyLines: true });
const cols = meta.fields || [];
const col = (...names) => cols.find((c) => names.some((n) => c.trim().toLowerCase() === n.toLowerCase()));

const cType = col("Type");
const cAnchor = col("Anchor", "Anchor Text", "Link Text");
if (!cAnchor) { console.error("No anchor column recognised."); process.exit(1); }

const GENERIC = new Set(["click here", "here", "read more", "learn more", "more", "this", "link", "view", "see more", "details"]);
const links = rows.filter((r) => !cType || /hyperlink/i.test(String(r[cType] || "")));
const total = links.length;
let generic = 0, empty = 0;
for (const r of links) {
  const a = String(r[cAnchor] || "").trim().toLowerCase();
  if (!a) empty++;
  else if (GENERIC.has(a)) generic++;
}

const data = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
data.technicalSeo = data.technicalSeo || {};
data.technicalSeo.internalAnchors = { total, generic, empty };
fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2) + "\n");

console.log(`Derived from ${csvPath.split("/").pop()} (${total} internal links):`);
console.log(`  generic anchors : ${generic}`);
console.log(`  empty anchors   : ${empty}`);
console.log(`\nWritten to ${DATA_PATH}.`);
