// scripts/set-competitors.js
// Types the competitors list for you. Usage:
//   node scripts/set-competitors.js rival1.com rival2.com rival3.com
import fs from "fs";
const DATA_PATH = "src/data/audit-data.json";
const list = process.argv.slice(2)
  .map((d) => String(d).replace(/['"\s]/g, "").replace(/^https?:\/\//, "").replace(/\/$/, ""))
  .filter(Boolean);
if (!list.length) { console.error("Usage: node scripts/set-competitors.js rival1.com rival2.com"); process.exit(1); }
const data = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
data.competitors = list;
fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2) + "\n");
console.log(`Competitors set: ${list.join(", ")}. Run check-authority to benchmark.`);
