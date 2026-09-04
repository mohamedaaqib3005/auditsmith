// src/lib/checkSite.js
// SHARED site-checking logic: origin in, measured facts out. Pure fetch, no
// fs, no DOM. Used by scripts/check-ai.js (terminal) and the Vite dev
// endpoint behind the app's "Check live site" button.
// Evidence only: a failed fetch yields value null (= do not write).

const AI_BOTS = ["GPTBot", "ClaudeBot", "PerplexityBot", "Google-Extended"];
const TIMEOUT_MS = 10000;

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

const checkLlmsTxt = async (origin) => {
  const r = await get(`${origin}/llms.txt`);
  if (r.status === 404) return { value: "missing", detail: "HTTP 404" };
  if (r.status !== 200) return { value: null, detail: `could not check (${r.error || `HTTP ${r.status}`})` };
  const looksHtml = /^\s*<(!doctype|html)/i.test(r.text);
  return looksHtml
    ? { value: "missing", detail: "returns an HTML page, not a text file" }
    : { value: "ok", detail: `${r.text.length} chars` };
};

const parseBlockedBots = (robotsText) => {
  const groups = {};
  let current = [];
  for (const raw of robotsText.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, "").trim();
    if (!line) continue;
    const [keyRaw, ...rest] = line.split(":");
    const key = keyRaw.trim().toLowerCase();
    const val = rest.join(":").trim();
    if (key === "user-agent") {
      const agent = val.toLowerCase();
      if (!(agent in groups)) groups[agent] = [];
      if (current.length && current._closed) current = [];
      current.push(agent);
      current._closed = false;
    } else if (key === "disallow") {
      for (const a of current) groups[a].push(val);
      current._closed = true;
    } else current._closed = true;
  }
  const blockedBy = (a) => (groups[a.toLowerCase()] ?? groups["*"] ?? []).includes("/");
  return AI_BOTS.filter(blockedBy);
};

export async function checkSite(site) {
  const origin = `https://${String(site).replace(/^https?:\/\//, "").split("/")[0]}`;

  const homepage = await get(`${origin}/`);
  const html = homepage.status === 200 ? homepage.text : null;

  const llms = await checkLlmsTxt(origin);

  const robotsRes = await get(`${origin}/robots.txt`);
  let aiCrawlers, robotsTxt;
  if (robotsRes.status === 200) {
    const blocked = parseBlockedBots(robotsRes.text);
    aiCrawlers = {
      value: blocked.length === 0 ? "ok" : blocked.length === AI_BOTS.length ? "missing" : "partial",
      detail: blocked.length ? `blocked: ${blocked.join(", ")}` : "no AI crawlers blocked",
    };
    robotsTxt = { value: "ok", detail: "present" };
  } else if (robotsRes.status === 404) {
    aiCrawlers = { value: "ok", detail: "no robots.txt, nothing blocked" };
    robotsTxt = { value: "missing", detail: "HTTP 404" };
  } else {
    const d = `could not check (${robotsRes.error || `HTTP ${robotsRes.status}`})`;
    aiCrawlers = { value: null, detail: d };
    robotsTxt = { value: null, detail: d };
  }

  let structuredData;
  if (html == null) structuredData = { value: null, detail: "homepage not fetched" };
  else {
    const ldJson = /<script[^>]+application\/ld\+json/i.test(html);
    const microdata = /itemtype\s*=\s*["']https?:\/\/schema\.org/i.test(html);
    structuredData =
      ldJson || microdata
        ? { value: "ok", detail: `homepage has ${ldJson ? "JSON-LD" : "microdata"} markup` }
        : { value: "missing", detail: "no Schema.org markup on homepage" };
  }

  let contentAccess;
  if (html == null) contentAccess = { value: null, detail: "homepage not fetched" };
  else {
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&[a-z#0-9]+;/gi, " ");
    const words = text.split(/\s+/).filter((w) => w.length > 1).length;
    contentAccess =
      words >= 100
        ? { value: "ok", detail: `${words} words readable without JS` }
        : words >= 20
        ? { value: "partial", detail: `only ${words} words without JS` }
        : { value: "missing", detail: `page nearly empty without JS (${words} words)` };
  }

  let sitemap = { value: "missing", detail: "no sitemap.xml or sitemap_index.xml" };
  for (const path of ["/sitemap.xml", "/sitemap_index.xml"]) {
    const r = await get(`${origin}${path}`);
    if (r.status === 200 && /<(urlset|sitemapindex)/i.test(r.text)) {
      sitemap = { value: "ok", detail: `found at ${path}` };
      break;
    }
    if (r.status === 0) {
      sitemap = { value: null, detail: `could not check (${r.error})` };
      break;
    }
  }

  return {
    origin,
    aiReadiness: { llmsTxt: llms, aiCrawlers, structuredData, contentAccess },
    technicalSeo: { sitemap, robotsTxt },
  };
}

// Flatten to writable values (drop nulls), respecting a typed "stale" sitemap.
export function applySiteCheck(data, result) {
  const out = { ...data, aiReadiness: { ...(data.aiReadiness || {}) }, technicalSeo: { ...(data.technicalSeo || {}) } };
  for (const [k, r] of Object.entries(result.aiReadiness)) if (r.value) out.aiReadiness[k] = r.value;
  if (result.technicalSeo.sitemap.value && out.technicalSeo.sitemap !== "stale")
    out.technicalSeo.sitemap = result.technicalSeo.sitemap.value;
  if (result.technicalSeo.robotsTxt.value) out.technicalSeo.robotsTxt = result.technicalSeo.robotsTxt.value;
  return out;
}
