// scripts/csv-to-data.js
// FLAVOUR B: offline converter. Reads a Screaming Frog "Internal All" CSV
// export, derives the technicalSeo numbers, and merges them into
// src/data/audit-data.json. The app never sees the CSV.
//
// Usage:
//   node scripts/csv-to-data.js ~/Downloads/internal_all.csv
//
// Derived from the CSV:
//   pagesCrawled  - rows that are HTML pages
//   indexable     - rows where Indexability = "Indexable"
//   brokenLinks   - rows with a 4xx status code
//   redirects     - rows with a 3xx status code (printed for reference)
//   https         - "ok" if every URL is https, else "partial"
//
// NOT derivable from this CSV (stay as typed in audit-data.json):
//   sitemap, robotsTxt, redirectChains
//   (chains need Screaming Frog's separate "Redirect Chains" report)

import fs from "fs";
import path from "path";
import Papa from "papaparse";

/* ---------- column names (edit here if your export differs) ---------- */
const COL = {
  address: "Address",
  status: "Status Code",
  indexability: "Indexability",
  contentType: "Content Type",
};

const DATA_PATH = "src/data/audit-data.json";

/* ---------- read arguments ---------- */
const csvPath = process.argv[2];
if (!csvPath) {
  console.error("Usage: node scripts/csv-to-data.js <path-to-crawl.csv>");
  process.exit(1);
}
if (!fs.existsSync(csvPath)) {
  console.error(`File not found: ${csvPath}`);
  process.exit(1);
}

/* ---------- parse ---------- */
const raw = fs.readFileSync(csvPath, "utf8");
const parsed = Papa.parse(raw, {
  header: true,
  dynamicTyping: true,
  skipEmptyLines: true,
});

if (parsed.errors.length) {
  console.warn(`Parse warnings (${parsed.errors.length}), first one:`, parsed.errors[0]);
}

let rows = parsed.data.filter((r) => r[COL.address]);
if (rows.length === 0) {
  console.error(
    `No rows with an "${COL.address}" column found. ` +
      `Check the column names at the top of this script against your CSV's header row.`
  );
  process.exit(1);
}

/* ---------- derive ---------- */
// Keep only HTML pages for page counts (assets like images/css inflate them).
// If the export has no Content Type column, fall back to counting everything.
const hasContentType = COL.contentType in rows[0];
const pages = hasContentType
  ? rows.filter((r) => String(r[COL.contentType] || "").includes("text/html"))
  : rows;

const statusOf = (r) => Number(r[COL.status]) || 0;

const technicalSeo = {
  pagesCrawled: pages.length,
  indexable: pages.filter((r) => String(r[COL.indexability] || "") === "Indexable").length,
  brokenLinks: rows.filter((r) => statusOf(r) >= 400 && statusOf(r) < 500).length,
  https: rows.every((r) => String(r[COL.address]).startsWith("https://")) ? "ok" : "partial",
};

const redirects = rows.filter((r) => statusOf(r) >= 300 && statusOf(r) < 400).length;

/* ---------- merge into audit-data.json ---------- */
const dataPath = path.resolve(DATA_PATH);
const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));

// Preserve the fields this CSV cannot know, if already present
const existing = data.technicalSeo || {};
data.technicalSeo = {
  ...existing,
  ...technicalSeo,
};

fs.writeFileSync(dataPath, JSON.stringify(data, null, 2) + "\n");

/* ---------- report ---------- */
console.log("Derived from", path.basename(csvPath), `(${rows.length} rows):`);
console.log(`  pagesCrawled : ${technicalSeo.pagesCrawled}${hasContentType ? " (html pages)" : ""}`);
console.log(`  indexable    : ${technicalSeo.indexable}`);
console.log(`  brokenLinks  : ${technicalSeo.brokenLinks} (4xx)`);
console.log(`  https        : ${technicalSeo.https}`);
console.log(`  (3xx redirects seen: ${redirects}, chains need the Redirect Chains report)`);
console.log("");
console.log(`Merged into ${DATA_PATH}.`);
const manual = ["sitemap", "robotsTxt", "redirectChains"].filter((k) => !(k in data.technicalSeo));
if (manual.length) {
  console.log(`Still to type by hand: ${manual.join(", ")}`);
} else {
  console.log("Hand-typed fields kept:", ["sitemap", "robotsTxt", "redirectChains"].map(k => `${k}=${data.technicalSeo[k]}`).join(", "));
}
