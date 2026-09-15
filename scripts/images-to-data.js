// scripts/images-to-data.js
// Image SEO door: reads Screaming Frog's Images export (Images tab ->
// Export, or Bulk Export -> Images -> All Images) and derives alt-text
// coverage. Facts only; the composer judges.
//
// Usage: node scripts/images-to-data.js ~/Downloads/images_all.csv

import fs from "fs";
import Papa from "papaparse";

const DATA_PATH = "src/data/audit-data.json";
const csvPath = process.argv[2];
if (!csvPath) { console.error("Usage: node scripts/images-to-data.js <images-export.csv>"); process.exit(1); }

const { data: rows, meta } = Papa.parse(fs.readFileSync(csvPath, "utf8"), { header: true, skipEmptyLines: true });
const cols = meta.fields || [];
const col = (...names) => cols.find((c) => names.some((n) => c.trim().toLowerCase() === n.toLowerCase()));

const cAddr = col("Address", "Source", "Image");
const cAlt = col("Alt Text", "Alt Text 1", "Alt");
const cSize = col("Size (Bytes)", "Size");
if (!cAddr) { console.error("No image address column recognised."); process.exit(1); }

const imgs = rows.filter((r) => /\.(png|jpe?g|webp|gif|svg|avif)(\?|$)/i.test(String(r[cAddr] || "")) || rows.length);
const total = imgs.length;
const missingAlt = cAlt ? imgs.filter((r) => !String(r[cAlt] || "").trim()).length : undefined;
const large = cSize ? imgs.filter((r) => Number(r[cSize]) > 100 * 1024).length : undefined;

const data = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
data.technicalSeo = data.technicalSeo || {};
data.technicalSeo.imageAlt = { total, ...(missingAlt != null ? { missingAlt } : {}), ...(large != null ? { large } : {}) };
fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2) + "\n");

console.log(`Derived from ${csvPath.split("/").pop()} (${total} images):`);
if (missingAlt != null) console.log(`  missingAlt : ${missingAlt}`);
if (large != null) console.log(`  large      : ${large} over 100 KB`);
console.log(`\nWritten to ${DATA_PATH}.`);
