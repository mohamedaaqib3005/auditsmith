// scripts/csv-to-data.js
// Terminal flavour of the CSV import. Same derive logic as the in-app drop
// zone (src/lib/deriveFromCrawl.js); this wrapper adds file reading and
// writes the result into src/data/audit-data.json.
//
// Usage:
//   node scripts/csv-to-data.js path/to/internal_all.csv

import fs from "fs";
import path from "path";
import Papa from "papaparse";
import { deriveFromCrawl, mergeCrawl } from "../src/lib/deriveFromCrawl.js";

const DATA_PATH = "src/data/audit-data.json";

const csvPath = process.argv[2];
if (!csvPath) {
  console.error("Usage: node scripts/csv-to-data.js <path-to-internal_all.csv>");
  process.exit(1);
}
if (!fs.existsSync(csvPath)) {
  console.error(`File not found: ${csvPath}`);
  process.exit(1);
}

const parsed = Papa.parse(fs.readFileSync(csvPath, "utf8"), {
  header: true,
  dynamicTyping: true,
  skipEmptyLines: true,
});
if (parsed.errors.length) {
  console.warn(`Parse warnings (${parsed.errors.length}), first:`, parsed.errors[0].message);
}

const derived = deriveFromCrawl(parsed.data);
if (!derived.ok) {
  console.error(derived.error + "\nAdjust the COLS table in src/lib/deriveFromCrawl.js.");
  process.exit(1);
}

const dataPath = path.resolve(DATA_PATH);
const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
const merged = mergeCrawl(data, derived);
fs.writeFileSync(dataPath, JSON.stringify(merged, null, 2) + "\n");

const show = (obj) =>
  Object.entries(obj).map(([k, v]) => `  ${k.padEnd(16)}: ${v}`).join("\n");

const { info } = derived;
console.log(`Derived from ${path.basename(csvPath)} (${info.rows} rows, ${info.htmlPages} html pages, ${info.okPages} ok):`);
console.log("technicalSeo:");
console.log(show(derived.technicalSeo));
console.log("onPageSeo:");
console.log(show(derived.onPageSeo));
if (info.skippedCols.length) console.log(`\nColumns not found (fields skipped): ${info.skippedCols.join(", ")}`);
console.log(`\nMerged into ${DATA_PATH}.`);
const manual = ["sitemap", "robotsTxt", "redirectChains"].filter((k) => !(k in (merged.technicalSeo || {})));
if (manual.length) console.log(`Still to type by hand: ${manual.join(", ")}`);
