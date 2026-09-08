// scripts/check-brand.js
// Brand-colour detector: finds the colour a site declares for itself and
// writes it into audit-data.json's theme block. Keyless and evidence-based:
//   1. <meta name="theme-color">              (the site's own declaration)
//   2. msapplication-TileColor meta
//   3. theme_color in the web manifest
//   4. fallback: the most repeated saturated hex in the homepage's markup
// A hand-set theme.brand is NEVER overwritten (pass --force to override).
// Failed fetches write nothing.
//
// Usage:
//   node scripts/check-brand.js            (site from audit-data.json)
//   node scripts/check-brand.js vlncy.com
//   node scripts/check-brand.js --force

import fs from "fs";

const DATA_PATH = "src/data/audit-data.json";
const TIMEOUT_MS = 10000;

const args = process.argv.slice(2).filter((a) => a !== "--force");
const force = process.argv.includes("--force");
const data = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
const site = args[0] || data.site;
if (!site) { console.error("No site given and none in audit-data.json."); process.exit(1); }
const origin = `https://${String(site).replace(/^https?:\/\//, "").split("/")[0]}`;

const get = async (url) => {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal, redirect: "follow", headers: { "User-Agent": "AuditsmithCheck/1.0" } });
    return { status: res.status, text: await res.text() };
  } catch (e) {
    return { status: 0, text: "", error: e.name === "AbortError" ? "timeout" : e.message };
  } finally { clearTimeout(t); }
};

const normHex = (h) => {
  let x = h.replace("#", "").trim();
  if (x.length === 3) x = x.split("").map((c) => c + c).join("");
  if (!/^[0-9a-f]{6}$/i.test(x)) return null;
  return "#" + x.toUpperCase();
};

const saturationOf = (hex) => {
  const n = hex.slice(1);
  const r = parseInt(n.slice(0, 2), 16) / 255, g = parseInt(n.slice(2, 4), 16) / 255, b = parseInt(n.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  if (max === min) return 0;
  const d = max - min;
  return l > 0.5 ? d / (2 - max - min) : d / (max + min);
};
const isBrandish = (hex) => {
  const s = saturationOf(hex);
  const n = hex.slice(1);
  const lum = (parseInt(n.slice(0,2),16) + parseInt(n.slice(2,4),16) + parseInt(n.slice(4,6),16)) / (3 * 255);
  return s >= 0.25 && lum > 0.08 && lum < 0.92; // skip greys, near-black, near-white
};

const home = await get(`${origin}/`);
if (home.status !== 200) {
  console.error(`Could not fetch homepage (${home.error || `HTTP ${home.status}`}). Nothing written.`);
  process.exit(1);
}
const html = home.text;

let found = null, source = null;

const meta = (name) => (html.match(new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)`, "i")) || [])[1]
  || (html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${name}["']`, "i")) || [])[1];

for (const [name, label] of [["theme-color", "meta theme-color"], ["msapplication-TileColor", "msapplication tile colour"]]) {
  const v = meta(name) && normHex(meta(name));
  if (v && isBrandish(v)) { found = v; source = label; break; }
}

if (!found) {
  const manifestHref = (html.match(/<link[^>]+rel=["']manifest["'][^>]+href=["']([^"']+)/i) || [])[1];
  if (manifestHref) {
    const url = manifestHref.startsWith("http") ? manifestHref : `${origin}/${manifestHref.replace(/^\//, "")}`;
    const m = await get(url);
    if (m.status === 200) {
      try {
        const v = normHex(JSON.parse(m.text).theme_color || "");
        if (v && isBrandish(v)) { found = v; source = "web manifest theme_color"; }
      } catch {}
    }
  }
}

if (!found) {
  const tally = {};
  for (const raw of html.match(/#[0-9a-fA-F]{3,6}\b/g) || []) {
    const v = normHex(raw);
    if (v && isBrandish(v)) tally[v] = (tally[v] || 0) + 1;
  }
  const top = Object.entries(tally).sort((a, b) => b[1] - a[1])[0];
  if (top) { found = top[0]; source = `most used saturated hex in markup (${top[1]}x)`; }
}

if (!found) {
  console.log("No brand colour could be detected from the site's own declarations. Nothing written.");
  process.exit(0);
}

console.log(`Detected brand colour: ${found}  (source: ${source})`);
if (data.theme?.brand && !force) {
  console.log(`theme.brand already set to ${data.theme.brand}, keeping it. Rerun with --force to overwrite.`);
} else {
  data.theme = { ...(data.theme || {}), brand: found };
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2) + "\n");
  console.log(`Written to ${DATA_PATH}.`);
}
