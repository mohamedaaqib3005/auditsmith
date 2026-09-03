// scripts/csv-to-data.js
// FLAVOUR B: offline converter. Reads ONE Screaming Frog "Internal All" CSV
// and derives BOTH sections' numbers from it, merging into
// src/data/audit-data.json. The app never sees the CSV.
//
// Usage:
//   node scripts/csv-to-data.js path/to/internal_all.csv
//
// Derived, technicalSeo:
//   pagesCrawled, indexable, brokenLinks (4xx), https
// Derived, onPageSeo (from the same rows):
//   missingTitles, duplicateTitles, missingMeta, duplicateMeta,
//   missingH1, multipleH1, thinPages (< THIN_WORDS words)
// Still typed by hand (this CSV cannot know them):
//   technicalSeo.sitemap, .robotsTxt, .redirectChains

import fs from "fs";
import path from "path";
import Papa from "papaparse";

/* ---------- config ---------- */
const DATA_PATH = "src/data/audit-data.json";
const THIN_WORDS = 200;

// Column names, with fallbacks for export/version differences.
// If a column is absent, its derived fields are skipped (not zeroed).
const COLS = {
  address: ["Address"],
  status: ["Status Code"],
  indexability: ["Indexability"],
  contentType: ["Content Type"],
  title: ["Title 1", "Title"],
  meta: ["Meta Description 1", "Meta Description"],
  h1: ["H1-1", "H1 1"],
  h1b: ["H1-2", "H1 2"],
  words: ["Word Count"],
};

/* ---------- helpers ---------- */
const pickCol = (row, names) => names.find((n) => n in row) ?? null;
const empty = (v) => v == null || String(v).trim() === "";

const duplicateCount = (values) => {
  // pages sharing a non-empty value with at least one other page
  const tally = {};
  for (const v of values) if (!empty(v)) tally[v] = (tally[v] || 0) + 1;
  return values.filter((v) => !empty(v) && tally[v] > 1).length;
};

/* ---------- read arguments ---------- */
const csvPath = process.argv[2];
if (!csvPath) {
  console.error("Usage: node scripts/csv-to-data.js <path-to-internal_all.csv>");
  process.exit(1);
}
if (!fs.existsSync(csvPath)) {
  console.error(`File not found: ${csvPath}`);
  process.exit(1);
}

/* ---------- parse ---------- */
const parsed = Papa.parse(fs.readFileSync(csvPath, "utf8"), {
  header: true,
  dynamicTyping: true,
  skipEmptyLines: true,
});
if (parsed.errors.length) {
  console.warn(`Parse warnings (${parsed.errors.length}), first:`, parsed.errors[0].message);
}

const first = parsed.data[0] || {};
const C = Object.fromEntries(
  Object.entries(COLS).map(([k, names]) => [k, pickCol(first, names)])
);

if (!C.address) {
  console.error(
    `No Address column found. Header row has: ${Object.keys(first).slice(0, 8).join(", ")}...\n` +
      `Adjust the COLS table at the top of this script.`
  );
  process.exit(1);
}

const rows = parsed.data.filter((r) => r[C.address]);
const statusOf = (r) => Number(r[C.status]) || 0;

// HTML pages only for page-level checks (assets skew every count)
const pages = C.contentType
  ? rows.filter((r) => String(r[C.contentType] || "").includes("text/html"))
  : rows;
// On-page checks only make sense on OK pages (a 404 has no title by nature)
const okPages = pages.filter((r) => statusOf(r) === 200);

/* ---------- derive: technicalSeo ---------- */
const technicalSeo = {
  pagesCrawled: pages.length,
  indexable: C.indexability
    ? pages.filter((r) => String(r[C.indexability] || "") === "Indexable").length
    : undefined,
  brokenLinks: C.status
    ? rows.filter((r) => statusOf(r) >= 400 && statusOf(r) < 500).length
    : undefined,
  https: rows.every((r) => String(r[C.address]).startsWith("https://")) ? "ok" : "partial",
};

/* ---------- derive: onPageSeo ---------- */
const onPageSeo = {};
if (C.title) {
  onPageSeo.missingTitles = okPages.filter((r) => empty(r[C.title])).length;
  onPageSeo.duplicateTitles = duplicateCount(okPages.map((r) => r[C.title]));
}
if (C.meta) {
  onPageSeo.missingMeta = okPages.filter((r) => empty(r[C.meta])).length;
  onPageSeo.duplicateMeta = duplicateCount(okPages.map((r) => r[C.meta]));
}
if (C.h1) onPageSeo.missingH1 = okPages.filter((r) => empty(r[C.h1])).length;
if (C.h1b) onPageSeo.multipleH1 = okPages.filter((r) => !empty(r[C.h1b])).length;
if (C.words)
  onPageSeo.thinPages = okPages.filter(
    (r) => Number(r[C.words]) > 0 && Number(r[C.words]) < THIN_WORDS
  ).length;

/* ---------- merge ---------- */
const dataPath = path.resolve(DATA_PATH);
const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));

const clean = (obj) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));

data.technicalSeo = { ...(data.technicalSeo || {}), ...clean(technicalSeo) };
data.onPageSeo = { ...(data.onPageSeo || {}), ...clean(onPageSeo) };

fs.writeFileSync(dataPath, JSON.stringify(data, null, 2) + "\n");

/* ---------- report ---------- */
const show = (obj) =>
  Object.entries(obj)
    .map(([k, v]) => `  ${k.padEnd(16)}: ${v}`)
    .join("\n");

console.log(`Derived from ${path.basename(csvPath)} (${rows.length} rows, ${pages.length} html pages, ${okPages.length} ok):`);
console.log("technicalSeo:");
console.log(show(clean(technicalSeo)));
console.log("onPageSeo:");
console.log(show(onPageSeo));

const skipped = Object.entries(C).filter(([, v]) => !v).map(([k]) => k);
if (skipped.length) console.log(`\nColumns not found (fields skipped): ${skipped.join(", ")}`);

console.log(`\nMerged into ${DATA_PATH}.`);
const manual = ["sitemap", "robotsTxt", "redirectChains"].filter(
  (k) => !(k in (data.technicalSeo || {}))
);
if (manual.length) console.log(`Still to type by hand: ${manual.join(", ")}`);
