// scripts/check-ai.js
// AI-readiness fetcher: checks the two URL-checkable facts and writes them
// into audit-data.json's aiReadiness block.
//
//   llmsTxt    - does https://site/llms.txt exist?
//   aiCrawlers - does robots.txt block GPTBot / ClaudeBot / PerplexityBot /
//                Google-Extended?
//
// The three judgment fields (structuredData, metaRobots, contentAccess)
// stay typed by hand; this script never touches them.
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

const llms = await checkLlmsTxt();
const crawlers = await checkAiCrawlers();

data.aiReadiness = { ...(data.aiReadiness || {}) };
if (llms.value) data.aiReadiness.llmsTxt = llms.value;
if (crawlers.value) data.aiReadiness.aiCrawlers = crawlers.value;
fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2) + "\n");

const line = (name, r) =>
  `  ${name.padEnd(12)}: ${(r.value || "not written").padEnd(11)} (${r.detail})`;
console.log(`Checked ${origin}:`);
console.log(line("llmsTxt", llms));
console.log(line("aiCrawlers", crawlers));
console.log(`\nWritten to ${DATA_PATH}. Hand-checked fields untouched.`);
