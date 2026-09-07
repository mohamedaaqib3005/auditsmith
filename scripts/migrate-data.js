// scripts/migrate-data.js
// ONE-TIME migration of audit-data.json from v1 verdict-enums ("ok") to the
// v2 fact contract (booleans, counts, lists). Safe to rerun; already-v2
// values pass through unchanged. After running, also rerun check-ai and
// check-tech so the fields only they can measure (noJsWords, blockedAiBots
// when previously partial, dmarc policy) hold real facts.

import fs from "fs";
const P = "src/data/audit-data.json";
const d = JSON.parse(fs.readFileSync(P, "utf8"));
const log = [];

const sc = d.pagespeed?.scores;
if (sc && typeof sc.agenticBrowsing === "string") {
  sc.agenticBrowsing = Number(sc.agenticBrowsing.split("/")[0]);
  log.push("agenticBrowsing -> number");
}

const ts = d.technicalSeo;
if (ts) {
  if (typeof ts.https === "string") { ts.https = ts.https === "ok"; log.push("https -> boolean"); }
  if (ts.sitemap === "ok") { ts.sitemap = "present"; log.push('sitemap "ok" -> "present"'); }
  if (typeof ts.robotsTxt === "string") { ts.robotsTxt = ts.robotsTxt === "ok"; log.push("robotsTxt -> boolean"); }
}

const ai = d.aiReadiness;
if (ai) {
  if (typeof ai.llmsTxt === "string") { ai.llmsTxt = ai.llmsTxt === "ok"; log.push("llmsTxt -> boolean"); }
  if ("aiCrawlers" in ai) {
    if (ai.aiCrawlers === "ok") { ai.blockedAiBots = []; log.push("aiCrawlers ok -> blockedAiBots []"); }
    else log.push("aiCrawlers was not ok: rerun check-ai to measure blockedAiBots");
    delete ai.aiCrawlers;
  }
  if (typeof ai.structuredData === "string") { ai.structuredData = ai.structuredData === "ok"; log.push("structuredData -> boolean"); }
  if ("metaRobots" in ai) {
    if (ai.metaRobots === "ok") { ai.noindexPages = 0; log.push("metaRobots ok -> noindexPages 0"); }
    else log.push("metaRobots was not ok: rerun csv-to-data to count noindexPages");
    delete ai.metaRobots;
  }
  if ("contentAccess" in ai) { delete ai.contentAccess; log.push("contentAccess removed: rerun check-ai to measure noJsWords"); }
  if (ai.scores) {
    for (const k of Object.keys(ai.scores)) {
      const lk = k === "EEAT" ? "eeat" : k;
      if (lk !== k) { ai.scores[lk] = ai.scores[k]; delete ai.scores[k]; log.push(`scores.${k} -> ${lk}`); }
    }
  }
}

const t = d.technology;
if (t) {
  if (typeof t.spf === "string") { t.spf = t.spf === "ok"; log.push("spf -> boolean"); }
  if (t.dmarc === "partial") { t.dmarc = "none"; log.push('dmarc "partial" -> "none"'); }
  else if (t.dmarc === "ok") { log.push('dmarc was "ok": rerun check-tech for the exact policy'); t.dmarc = "quarantine"; }
}

fs.writeFileSync(P, JSON.stringify(d, null, 2) + "\n");
console.log(log.length ? "Migrated:\n  " + log.join("\n  ") : "Already v2, nothing to change.");
