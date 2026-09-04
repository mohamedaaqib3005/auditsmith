// scripts/check-ai.js
// Site fetcher: every fact checkable by requesting URLs, written into
// audit-data.json. Evidence only - a failed fetch writes nothing.
//
// aiReadiness:
//   llmsTxt        - /llms.txt exists?
//   aiCrawlers     - robots.txt blocks GPTBot/ClaudeBot/PerplexityBot/Google-Extended?
//   structuredData - homepage carries Schema.org markup? (homepage-only check)
//   contentAccess  - homepage text readable WITHOUT JavaScript? (a plain fetch
//                    runs no JS - it sees exactly what AI crawlers see)
// technicalSeo:
//   robotsTxt      - /robots.txt exists?
//   sitemap        - /sitemap.xml (or /sitemap_index.xml) exists?
//                    ("stale" cannot be fetched; overwrite by hand if known)
//
// metaRobots comes from the crawl CSV (csv-to-data.js). redirectChains needs
// Screaming Frog's Redirect Chains report; absent = its row simply not shown.
//
// Usage:
//   node scripts/check-ai.js            (site read from audit-data.json)
//   node scripts/check-ai.js vlncy.com  (explicit site)

import fs from "fs";

const DATA_PATH = "src/data/audit-data.json";
const AI_BOTS = ["GPTBot", "ClaudeBot", "PerplexityBot", "Google-Extended"];
const TIMEOUT_MS = 10000;

const data = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
const siteArg = process.argv[2] || data.site;
if (!siteArg) {
  console.error("No site given and none in audit-data.json.");
  process.exit(1);
}
const origin = `https://${siteArg.replace(/^https?:\/\//, "").split("/")[0]}`;

const get = async (url) => {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: { "User-Agent": "AuditsmithCheck/1.0" },
    });
    const text = await res.text();
    return { status: res.status, text };
  } catch (e) {
    return { status: 0, text: "", error: e.name === "AbortError" ? "timeout" : e.message };
  } finally {
    clearTimeout(timer);
  }
};

// ---- llms.txt: exists and is text-like (not an HTML soft-404) ----
const checkLlmsTxt = async () => {
  const r = await get(`${origin}/llms.txt`);
  // 404 is evidence of absence; anything else failed (blocked, timeout) is
  // NO evidence, so we decline to write rather than guess.
  if (r.status === 404) return { value: "missing", detail: "HTTP 404" };
  if (r.status !== 200) return { value: null, detail: `could not check (${r.error || `HTTP ${r.status}`})` };
  const looksHtml = /^\s*<(!doctype|html)/i.test(r.text);
  return looksHtml
    ? { value: "missing", detail: "returns an HTML page, not a text file" }
    : { value: "ok", detail: `${r.text.length} chars` };
};

// ---- robots.txt: which AI bots are blocked from the site root ----
// Minimal robots parser: group rules under their User-agent lines; a bot is
// "blocked" if its own group (or the * group when it has none) contains
// "Disallow: /" exactly.
const checkAiCrawlers = async () => {
  const r = await get(`${origin}/robots.txt`);
  if (r.status === 404)
    return { value: "ok", detail: "no robots.txt, nothing blocked" };
  if (r.status !== 200)
    return { value: null, detail: `could not check (${r.error || `HTTP ${r.status}`})` };

  const groups = {}; // lowercased agent -> array of disallow values
  let current = [];
  for (const raw of r.text.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, "").trim();
    if (!line) continue;
    const [keyRaw, ...rest] = line.split(":");
    const key = keyRaw.trim().toLowerCase();
    const val = rest.join(":").trim();
    if (key === "user-agent") {
      const agent = val.toLowerCase();
      if (!(agent in groups)) groups[agent] = [];
      // consecutive user-agent lines share the following rules
      if (current.length && current._closed) current = [];
      current.push(agent);
      current._closed = false;
    } else if (key === "disallow") {
      for (const a of current) groups[a].push(val);
      current._closed = true;
    } else {
      current._closed = true;
    }
  }

  const blockedBy = (agent) => {
    const rules = groups[agent.toLowerCase()] ?? groups["*"] ?? [];
    return rules.includes("/");
  };

  const blocked = AI_BOTS.filter(blockedBy);
  const value = blocked.length === 0 ? "ok" : blocked.length === AI_BOTS.length ? "missing" : "partial";
  return {
    value,
    detail: blocked.length ? `blocked: ${blocked.join(", ")}` : "no AI crawlers blocked",
  };
};

// ---- structured data: Schema.org markup on the homepage ----
const checkStructuredData = async (html) => {
  if (html == null) return { value: null, detail: "homepage not fetched" };
  const ldJson = /<script[^>]+application\/ld\+json/i.test(html);
  const microdata = /itemtype\s*=\s*["']https?:\/\/schema\.org/i.test(html);
  return ldJson || microdata
    ? { value: "ok", detail: `homepage has ${ldJson ? "JSON-LD" : "microdata"} markup` }
    : { value: "missing", detail: "no Schema.org markup on homepage" };
};

// ---- content access: readable text without JavaScript ----
// This fetch executed no JS, so the text below is what AI crawlers get.
const checkContentAccess = async (html) => {
  if (html == null) return { value: null, detail: "homepage not fetched" };
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, " ");
  const words = text.split(/\s+/).filter((w) => w.length > 1).length;
  if (words >= 100) return { value: "ok", detail: `${words} words readable without JS` };
  if (words >= 20) return { value: "partial", detail: `only ${words} words without JS` };
  return { value: "missing", detail: `page nearly empty without JS (${words} words)` };
};

// ---- sitemap: /sitemap.xml or /sitemap_index.xml ----
const checkSitemap = async () => {
  for (const path of ["/sitemap.xml", "/sitemap_index.xml"]) {
    const r = await get(`${origin}${path}`);
    if (r.status === 200 && /<(urlset|sitemapindex)/i.test(r.text))
      return { value: "ok", detail: `found at ${path}` };
    if (r.status === 0) return { value: null, detail: `could not check (${r.error})` };
  }
  return { value: "missing", detail: "no sitemap.xml or sitemap_index.xml" };
};

const homepage = await get(`${origin}/`);
const html = homepage.status === 200 ? homepage.text : null;

const llms = await checkLlmsTxt();
const crawlersRes = await get(`${origin}/robots.txt`);
const crawlers = await checkAiCrawlers();
const structured = await checkStructuredData(html);
const access = await checkContentAccess(html);
const sitemap = await checkSitemap();
const robotsTxt =
  crawlersRes.status === 200
    ? { value: "ok", detail: "present" }
    : crawlersRes.status === 404
    ? { value: "missing", detail: "HTTP 404" }
    : { value: null, detail: `could not check (${crawlersRes.error || `HTTP ${crawlersRes.status}`})` };

data.aiReadiness = { ...(data.aiReadiness || {}) };
for (const [k, r] of [["llmsTxt", llms], ["aiCrawlers", crawlers], ["structuredData", structured], ["contentAccess", access]]) {
  if (r.value) data.aiReadiness[k] = r.value;
}
data.technicalSeo = { ...(data.technicalSeo || {}) };
if (sitemap.value && data.technicalSeo.sitemap !== "stale") data.technicalSeo.sitemap = sitemap.value;
if (robotsTxt.value) data.technicalSeo.robotsTxt = robotsTxt.value;

fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2) + "\n");

const line = (name, r) =>
  `  ${name.padEnd(15)}: ${(r.value || "not written").padEnd(11)} (${r.detail})`;
console.log(`Checked ${origin}:`);
console.log("aiReadiness:");
console.log(line("llmsTxt", llms));
console.log(line("aiCrawlers", crawlers));
console.log(line("structuredData", structured));
console.log(line("contentAccess", access));
console.log("technicalSeo:");
console.log(line("sitemap", sitemap));
console.log(line("robotsTxt", robotsTxt));
console.log(`\nWritten to ${DATA_PATH}. metaRobots comes from the crawl CSV; redirectChains from SF's Redirect Chains report.`);
