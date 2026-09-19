// scripts/crawl-lite.js
// The zero-click crawl: our own polite spider replacing the Screaming
// Frog excursion for the basic crawl. It walks the site from the
// homepage (same host only, robots.txt respected, capped, delayed),
// builds rows in Screaming Frog's column shape, and feeds them through
// the SAME deriveFromCrawl the CSV door uses: one source of truth for
// every crawl fact. The CSV door remains the advanced path (bigger
// sites, Link Score, the deeper exports).
//
// Honesty notes baked in: pixel widths are estimated from character
// metrics (close, not exact); spelling and Link Score columns are
// absent, so their cards correctly stay silent on this path.
//
// Usage: node scripts/crawl-lite.js            (site from audit-data.json)

import fs from "fs";
import path from "path";
import { deriveFromCrawl, mergeCrawl } from "../src/lib/deriveFromCrawl.js";

const DATA_PATH = "src/data/audit-data.json";
const MAX_PAGES = 150;
const DELAY_MS = 250;
const TIMEOUT = 15000;
const UA = "AuditsmithCrawler/1.0 (site audit; runs once)";

const data = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
const site = process.argv[2] || data.site;
if (!site) { console.error("No site given and none in audit-data.json."); process.exit(1); }
const host = String(site).replace(/^https?:\/\//, "").replace(/\/$/, "");
const ORIGIN = `https://${host}`;
const sameSite = !process.argv[2] || host === String(data.site || "").replace(/^https?:\/\//, "").replace(/\/$/, "");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const get = async (url, redirect = "manual") => {
  try {
    return await fetch(url, { redirect, signal: AbortSignal.timeout(TIMEOUT), headers: { "User-Agent": UA } });
  } catch { return null; }
};

/* ---------- robots.txt (User-agent: * rules) ---------- */
let disallow = [];
{
  const r = await get(`${ORIGIN}/robots.txt`, "follow");
  if (r?.ok) {
    const lines = (await r.text()).split("\n");
    let applies = false;
    for (const raw of lines) {
      const line = raw.split("#")[0].trim();
      if (/^user-agent:/i.test(line)) applies = /:\s*\*\s*$/.test(line);
      else if (applies && /^disallow:/i.test(line)) {
        const p = line.replace(/^disallow:\s*/i, "").trim();
        if (p) disallow.push(p);
      }
    }
  }
}
const blocked = (pathname) => disallow.some((p) => pathname.startsWith(p.replace(/\*$/, "")));

/* ---------- tiny text metrics ---------- */
const strip = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
const syllables = (word) => Math.max(1, (word.toLowerCase().match(/[aeiouy]+/g) || []).length - (/e$/.test(word) ? 1 : 0));
const flesch = (text) => {
  const words = text.split(/\s+/).filter((w) => /[a-z]/i.test(w));
  const sentences = Math.max(1, (text.match(/[.!?]+/g) || []).length);
  if (words.length < 30) return "";
  const syl = words.reduce((a, w) => a + syllables(w), 0);
  return Math.round(Math.max(0, Math.min(100, 206.835 - 1.015 * (words.length / sentences) - 84.6 * (syl / words.length))));
};
// Approximate pixel widths in Google's result font (Arial-like, title 20px, meta 14px)
const CHAR_W_20 = { i: 5, l: 5, j: 5, f: 6, t: 7, r: 7, " ": 6, m: 17, w: 15, M: 17, W: 19 };
const px = (text, scale) => Math.round([...String(text)].reduce((a, ch) => a + (CHAR_W_20[ch] ?? (/[A-Z]/.test(ch) ? 13 : /[0-9]/.test(ch) ? 11 : 10)), 0) * scale);

const grab = (html, re) => html.match(re)?.[1]?.trim() ?? "";
const grabAll = (html, re) => [...html.matchAll(re)].map((m) => strip(m[1]));

/* ---------- BFS crawl ---------- */
const queue = [{ url: `${ORIGIN}/`, depth: 0 }];
const seen = new Set([`${ORIGIN}/`]);
const pages = new Map();      // url -> row fields
const inlinks = new Map();    // url -> count
const SKIP_EXT = /\.(png|jpe?g|gif|webp|svg|ico|css|js|pdf|zip|mp4|webm|woff2?|ttf|xml|txt)(\?|$)/i;

console.log(`Crawling ${ORIGIN} (cap ${MAX_PAGES} pages, polite)...`);
while (queue.length && pages.size < MAX_PAGES) {
  const { url, depth } = queue.shift();
  const u = new URL(url);
  if (blocked(u.pathname)) continue;

  let res = await get(url);
  if (!res) continue;
  let status = res.status;
  let finalUrl = url;

  // record redirect hops as their own rows (SF does), follow up to 5
  let hops = 0;
  while (status >= 300 && status < 400 && hops < 5) {
    const loc = res.headers.get("location");
    if (!loc) break;
    pages.set(finalUrl, { status, redirect: true, depth });
    const next = new URL(loc, finalUrl).href;
    if (!next.startsWith(ORIGIN)) { status = 0; break; }
    finalUrl = next.split("#")[0];
    if (pages.has(finalUrl) || seen.has(finalUrl)) { status = 0; break; }
    res = await get(finalUrl);
    if (!res) { status = 0; break; }
    status = res.status;
    hops++;
  }
  if (!res || status === 0) continue;
  if (pages.has(finalUrl)) continue;

  const ct = res.headers.get("content-type") || "";
  if (!/text\/html/i.test(ct)) { continue; }
  const html = status < 400 ? await res.text() : "";
  const body = strip(html);

  const title = strip(grab(html, /<title[^>]*>([\s\S]*?)<\/title>/i));
  const meta = grab(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)/i) ||
               grab(html, /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i);
  const h1s = grabAll(html, /<h1[^>]*>([\s\S]*?)<\/h1>/gi).filter(Boolean);
  const robotsMeta = grab(html, /<meta[^>]+name=["']robots["'][^>]+content=["']([^"']*)/i);
  const canonical = grab(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)/i);
  const noindex = /noindex/i.test(robotsMeta);

  let external = 0;
  if (status < 400) {
    for (const m of html.matchAll(/<a[^>]+href=["']([^"'#]+)["']/gi)) {
      let href;
      try { href = new URL(m[1], finalUrl).href.split("#")[0]; } catch { continue; }
      if (!/^https?:/.test(href)) continue;
      if (!href.startsWith(ORIGIN)) { external++; continue; }
      if (SKIP_EXT.test(href)) continue;
      inlinks.set(href, (inlinks.get(href) || 0) + 1);
      if (!seen.has(href) && seen.size < MAX_PAGES * 3) {
        seen.add(href);
        queue.push({ url: href, depth: depth + 1 });
      }
    }
  }

  pages.set(finalUrl, {
    status, depth, title, meta, h1s, robotsMeta, canonical, noindex,
    words: body.split(/\s+/).filter((w) => w.length > 1).length,
    fleschScore: flesch(body), external,
  });
  process.stdout.write(`\r  fetched ${pages.size} pages...`);
  await sleep(DELAY_MS);
}
console.log(`\r  fetched ${pages.size} pages.      `);

/* ---------- rows in Screaming Frog's shape ---------- */
const rows = [...pages.entries()].map(([url, p]) => ({
  "Address": url,
  "Content Type": "text/html; charset=utf-8",
  "Status Code": p.status,
  "Indexability": p.redirect ? "Non-Indexable" : p.status >= 400 ? "Non-Indexable" : p.noindex ? "Non-Indexable" : "Indexable",
  "Indexability Status": p.redirect ? "Redirected" : p.status >= 400 ? "Client Error" : p.noindex ? "Noindex" : "",
  "Title 1": p.title ?? "",
  "Title 1 Pixel Width": p.title ? px(p.title, 1.0) : "",
  "Meta Description 1": p.meta ?? "",
  "Meta Description 1 Pixel Width": p.meta ? px(p.meta, 0.72) : "",
  "H1-1": p.h1s?.[0] ?? "",
  "H1-2": p.h1s?.[1] ?? "",
  "Meta Robots 1": p.robotsMeta ?? "",
  "Canonical Link Element 1": p.canonical ?? "",
  "Word Count": p.words ?? "",
  "Flesch Reading Ease Score": p.fleschScore ?? "",
  "Crawl Depth": p.depth,
  "Unique Inlinks": inlinks.get(url) || 0,
  "External Outlinks": p.external ?? "",
}));

const derived = deriveFromCrawl(rows);
if (!derived.ok) { console.error(derived.error); process.exit(1); }
if (!sameSite) {
  console.log("\nPrint-only: the data file belongs to " + data.site + ", nothing written.");
  console.log(JSON.stringify(derived, null, 2).slice(0, 800));
  process.exit(0);
}
const merged = mergeCrawl(data, derived);
merged.crawlSource = "crawl-lite";
fs.writeFileSync(path.resolve(DATA_PATH), JSON.stringify(merged, null, 2) + "\n");

const show = (obj) => { for (const [k, v] of Object.entries(obj || {})) if (v !== undefined && typeof v !== "object") console.log(`  ${k.padEnd(18)}: ${v}`); };
console.log("technicalSeo:"); show(derived.technicalSeo);
console.log("onPageSeo:"); show(derived.onPageSeo);
console.log(`\nMerged into ${DATA_PATH}. (crawl-lite; the Screaming Frog CSV door remains for deeper crawls)`);
