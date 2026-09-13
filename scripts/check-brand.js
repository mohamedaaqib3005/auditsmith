// scripts/check-brand.js
// Brand detector: finds the colour AND the Google Fonts a site declares
// for itself and writes them into audit-data.json's theme block. Keyless
// and evidence-based:
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

import "./env.js";
import fs from "fs";

const DATA_PATH = "src/data/audit-data.json";
const TIMEOUT_MS = 10000;

const args = process.argv.slice(2).filter((a) => a !== "--force");
const force = process.argv.includes("--force");
const data = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
const site = args[0] || data.site;
if (!site) { console.error("No site given and none in audit-data.json."); process.exit(1); }
const origin = `https://${String(site).replace(/^https?:\/\//, "").split("/")[0]}`;

const get = async (url, headers) => {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal, redirect: "follow", headers: headers || { "User-Agent": "AuditsmithCheck/1.0" } });
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

const resolveGoogleFont = async (family) => {
  const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@400;700`;
  const r = await get(url, { "User-Agent": "curl/8" });
  if (r.status !== 200) return null;
  const faces = [...r.text.matchAll(/font-weight: (\d+);[\s\S]*?src: url\((https:[^)]+\.ttf)\)/g)];
  const out = {};
  for (const [, w, u] of faces) {
    if (w === "400") out.regular = u;
    if (w === "700") out.bold = u;
  }
  return out.regular ? out : null;
};

let found = null, source = null;
let apiFonts = null, apiAccent = null, fontsSettled = false;

/* ---------- Rung 0: brand-data API (colorize.design / prefetch) when a
   key is present. The same honesty filters apply: neutral colours are
   rejected and the free ladder takes over. */
if (process.env.PREFETCH_KEY) {
  try {
    const r = await fetch(
      "https://api.prefetch.io/brand?url=" + encodeURIComponent(origin),
      { headers: { "x-api-key": process.env.PREFETCH_KEY }, signal: AbortSignal.timeout(30000) }
    );
    if (r.ok) {
      const j = await r.json();
      const brand = j?.data?.brand || {};
      const raw = brand.colors?.brand_colors || [];
      const hexes = raw.map((c) => normHex(c.hex)).filter((h) => h && isBrandish(h));
      if (hexes.length) {
        found = hexes[0];
        source = "brand API (primary)";
        if (hexes[1] && hexes[1] !== hexes[0]) apiAccent = hexes[1];
      } else if (raw.length) {
        console.log(`Brand API returned only neutral colours (${raw.map((c) => c.hex).join(", ")}), falling back to the free detector.`);
      }
      if (brand.fonts?.families?.length) apiFonts = brand.fonts.families;
    } else {
      console.log(`Brand API: HTTP ${r.status}, falling back to the free detector.`);
    }
  } catch (e) {
    console.log(`Brand API unreachable (${e.message}), falling back to the free detector.`);
  }
}

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
  // Rung 4: the site's stylesheets, where the real palette lives (Tailwind
  // and friends compile colours into CSS the HTML never shows). Fetch
  // same-site linked CSS, count hexes there and in the markup.
  const cssLinks = [...html.matchAll(/<link[^>]+rel=["']stylesheet["'][^>]*href=["']([^"']+)/gi)]
    .map((m) => m[1])
    .concat([...html.matchAll(/href=["']([^"']+\.css[^"']*)["']/gi)].map((m) => m[1]))
    .filter((h, i, a) => a.indexOf(h) === i)
    .filter((h) => !/^https?:/i.test(h) || h.includes(new URL(origin).host))
    .slice(0, 5);

  let cssText = "";
  for (const href of cssLinks) {
    const url = /^https?:/i.test(href) ? href : `${origin}/${href.replace(/^\//, "")}`;
    const r = await get(url);
    if (r.status === 200) cssText += "\n" + r.text;
  }

  const tallyFrom = (text) => {
    const tally = {};
    for (const raw of text.match(/#[0-9a-fA-F]{3,6}\b/g) || []) {
      const v = normHex(raw);
      if (v && isBrandish(v)) tally[v] = (tally[v] || 0) + 1;
    }
    return tally;
  };

  const cssTally = tallyFrom(cssText);
  const htmlTally = tallyFrom(html);

  // Markup first: colours an author wrote into the page outrank stylesheet
  // contents, which include framework factory palettes (Bootstrap ships its
  // default blue whether a site uses it or not). CSS is the fallback
  // haystack for sites whose markup carries no colours at all.
  const pickFrom = Object.keys(htmlTally).length ? htmlTally : cssTally;
  const pickSource = Object.keys(htmlTally).length ? "markup" : "stylesheets";

  const merged = { ...cssTally };
  for (const [k, v] of Object.entries(htmlTally)) merged[k] = (merged[k] || 0) + v;
  const evidence = Object.entries(merged).sort((a, b) => b[1] - a[1]).slice(0, 5);
  if (evidence.length > 1)
    console.log(`Palette candidates: ${evidence.map(([h, c]) => `${h} (${c}x)`).join(", ")}`);

  const top = Object.entries(pickFrom).sort((a, b) => b[1] - a[1])[0];
  if (top) {
    found = top[0];
    source = `most used saturated hex in ${pickSource} (${top[1]}x)`;
  }
}

let wrote = false;
if (!found) {
  console.log("No brand colour could be detected from the site's own declarations.");
} else {
  console.log(`Detected brand colour: ${found}  (source: ${source})`);
  if (data.theme?.brand && !force) {
    console.log(`theme.brand already set to ${data.theme.brand}, keeping it. Rerun with --force to overwrite.`);
  } else {
    data.theme = { ...(data.theme || {}), brand: found };
    wrote = true;
  }
}

if (apiAccent) {
  if (data.theme?.accent && !force) {
    console.log(`theme.accent already set to ${data.theme.accent}, keeping it.`);
  } else {
    data.theme = { ...(data.theme || {}), accent: apiAccent };
    console.log(`Detected accent colour: ${apiAccent}  (brand API)`);
    wrote = true;
  }
}

/* API font names arrive in code-ish forms ("plusJakarta", "Rubik-Bold",
   "outfit Fallback"); normalise to Google-Fonts-resolvable candidates. */
if (apiFonts && (!data.theme?.fonts?.heading || force)) {
  const baseName = (f) =>
    f.replace(/\s*Fallback$/i, "").replace(/-[A-Za-z]+$/g, "");
  const freq = {};
  for (const f of apiFonts.map(baseName)) freq[f] = (freq[f] || 0) + 1;
  const ranked = Object.keys(freq).sort((x, y) => freq[y] - freq[x]);
  const candidatesFor = (name) => {
    const spaced = name.replace(/([a-z])([A-Z])/g, "$1 $2");
    const title = spaced.split(/\s+/).map((w) => (w.length <= 2 ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1))).join(" ");
    return [...new Set([name, title, `${title} Sans`])];
  };
  const resolveFirst = async (name) => {
    for (const cand of candidatesFor(name)) {
      const files = await resolveGoogleFont(cand);
      if (files) return { family: cand, files };
    }
    return null;
  };
  const first = await resolveFirst(ranked[0]);
  // a family seen only once is usually decorative (logos, flourishes);
  // it may not claim the body slot
  const second = ranked[1] && freq[ranked[1]] >= 2 ? await resolveFirst(ranked[1]) : null;
  if (first) {
    const fonts = { heading: first.family, body: (second || first).family };
    const fontFiles = { ...(data.theme?.fontFiles || {}), [first.family]: first.files };
    if (second) fontFiles[second.family] = second.files;
    data.theme = { ...(data.theme || {}), fonts, fontFiles };
    console.log(`Brand API fonts: ${ranked.slice(0, 3).join(", ")} -> heading: ${fonts.heading}, body: ${fonts.body}`);
    wrote = true;
    fontsSettled = true;
  } else {
    console.log(`Brand API fonts (${ranked.slice(0, 3).join(", ")}) not resolvable on Google Fonts, keeping defaults.`);
  }
}

/* ---------- fonts: Google Fonts declarations + TTF resolution ---------- */

// Families the site loads from Google Fonts (evidence in <link> tags)
const gfLinks = [...html.matchAll(/fonts\.googleapis\.com\/css2?\?([^"']+)/g)].map((m) => m[1]);
const declared = [];
for (const qs of gfLinks) {
  for (const fam of [...qs.matchAll(/family=([^&:]+)/g)].map((m) => decodeURIComponent(m[1]).replace(/\+/g, " ")))
    if (!declared.includes(fam)) declared.push(fam);
}

const hasFonts = data.theme?.fonts?.heading || data.theme?.fonts?.body;
if (declared.length && !fontsSettled && (!hasFonts || force)) {
  const fonts = { heading: declared[0], body: declared[1] || declared[0] };
  console.log(`Detected Google Fonts: ${declared.join(", ")} -> heading: ${fonts.heading}, body: ${fonts.body}`);
  data.theme = { ...(data.theme || {}), fonts };
  wrote = true;
} else if (declared.length && hasFonts) {
  console.log(`Google Fonts on site (${declared.join(", ")}), but theme.fonts already set, keeping yours. --force to overwrite.`);
} else if (!declared.length) {
  console.log("No Google Fonts declarations found on the site.");
}

// Resolve TTF files for whatever families the theme now names (incl. hand-set)
const wanted = [data.theme?.fonts?.heading, data.theme?.fonts?.body].filter(Boolean);
if (wanted.length) {
  const fontFiles = { ...(data.theme.fontFiles || {}) };
  for (const fam of [...new Set(wanted)]) {
    if (fontFiles[fam]?.regular) continue;
    const files = await resolveGoogleFont(fam);
    if (files) {
      fontFiles[fam] = files;
      console.log(`Resolved "${fam}" on Google Fonts (regular${files.bold ? " + bold" : ""}).`);
      wrote = true;
    } else {
      console.log(`"${fam}" not found on Google Fonts, it will fall back to the default font.`);
    }
  }
  data.theme.fontFiles = fontFiles;
}

if (wrote) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2) + "\n");
  console.log(`Written to ${DATA_PATH}.`);
} else {
  console.log("Nothing new to write.");
}
