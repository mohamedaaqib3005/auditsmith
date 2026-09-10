// scripts/check-pagespeed.js
// PageSpeed fetcher: runs Google's official PageSpeed Insights API for
// mobile and desktop and writes scores, field data, and lab metrics into
// audit-data.json. This is the same Lighthouse run as pagespeed.web.dev,
// via its data API instead of the web page.
//
// Not fetched: agenticBrowsing (not in the API yet) - type that fraction
// by hand as before; an existing value is preserved.
//
// Usage:
//   node scripts/check-pagespeed.js              (site from audit-data.json)
//   node scripts/check-pagespeed.js example.com
//   PSI_KEY=... node scripts/check-pagespeed.js  (optional API key for quota)

import fs from "fs";

const DATA_PATH = "src/data/audit-data.json";
const data = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
const site = process.argv[2] || data.site;
if (!site) { console.error("No site given and none in audit-data.json."); process.exit(1); }
const target = `https://${String(site).replace(/^https?:\/\//, "").replace(/\/$/, "")}`;

const ms2s = (v) => (v == null ? null : Math.round(v / 100) / 10);

const runStrategy = async (strategy) => {
  const u = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
  u.searchParams.set("url", target);
  u.searchParams.set("strategy", strategy);
  for (const c of ["performance", "accessibility", "best-practices", "seo"])
    u.searchParams.append("category", c);
  if (process.env.PSI_KEY) u.searchParams.set("key", process.env.PSI_KEY);

  const res = await fetch(u, { signal: AbortSignal.timeout(120000) });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HTTP ${res.status}: ${body.slice(0, 200)}`);
  }
  const j = await res.json();
  const lh = j.lighthouseResult;

  const scores = {};
  const cat = lh?.categories || {};
  if (cat.performance) scores.performance = Math.round(cat.performance.score * 100);
  if (cat.accessibility) scores.accessibility = Math.round(cat.accessibility.score * 100);
  if (cat["best-practices"]) scores.bestPractices = Math.round(cat["best-practices"].score * 100);
  if (cat.seo) scores.seo = Math.round(cat.seo.score * 100);

  const a = lh?.audits || {};
  const labMetrics = {
    fcp: ms2s(a["first-contentful-paint"]?.numericValue),
    lcp: ms2s(a["largest-contentful-paint"]?.numericValue),
    tbt: a["total-blocking-time"] ? Math.round(a["total-blocking-time"].numericValue) : null,
    cls: a["cumulative-layout-shift"] ? Math.round(a["cumulative-layout-shift"].numericValue * 100) / 100 : null,
    speedIndex: ms2s(a["speed-index"]?.numericValue),
  };

  // Field data (CrUX). Absent for low-traffic pages -> no fieldData block.
  let fieldData = null;
  const fx = j.loadingExperience?.metrics;
  if (fx && Object.keys(fx).length) {
    const p = (k) => fx?.[k]?.percentile;
    {
      fieldData = {
        lcp: p("LARGEST_CONTENTFUL_PAINT_MS") != null ? ms2s(p("LARGEST_CONTENTFUL_PAINT_MS")) : null,
        inp: p("INTERACTION_TO_NEXT_PAINT") ?? null,
        cls: p("CUMULATIVE_LAYOUT_SHIFT_SCORE") != null ? p("CUMULATIVE_LAYOUT_SHIFT_SCORE") / 100 : null,
        fcp: p("FIRST_CONTENTFUL_PAINT_MS") != null ? ms2s(p("FIRST_CONTENTFUL_PAINT_MS")) : null,
        ttfb: p("EXPERIMENTAL_TIME_TO_FIRST_BYTE") != null ? ms2s(p("EXPERIMENTAL_TIME_TO_FIRST_BYTE")) : null,
      };
    }
  }

  return { scores, labMetrics, fieldData };
};

console.log(`Running PageSpeed Insights for ${target} (this takes ~30-60s per device)...`);
data.pagespeed = data.pagespeed || {};

for (const strategy of ["mobile", "desktop"]) {
  try {
    const r = await runStrategy(strategy);
    const existing = data.pagespeed[strategy] || {};
    const agentic = existing.scores?.agenticBrowsing;
    const device = {
      scores: { ...r.scores, ...(agentic != null ? { agenticBrowsing: agentic } : {}) },
      ...(r.fieldData ? { fieldData: r.fieldData } : {}),
      labMetrics: r.labMetrics,
    };
    data.pagespeed[strategy] = device;
    console.log(`\n${strategy}:`);
    console.log(`  scores    : ${Object.entries(device.scores).map(([k, v]) => `${k} ${v}`).join(", ")}`);
    console.log(`  lab       : fcp ${r.labMetrics.fcp}s, lcp ${r.labMetrics.lcp}s, tbt ${r.labMetrics.tbt}ms, cls ${r.labMetrics.cls}, si ${r.labMetrics.speedIndex}s`);
    console.log(`  fieldData : ${r.fieldData ? `lcp ${r.fieldData.lcp}s, inp ${r.fieldData.inp}ms, cls ${r.fieldData.cls}` : "none (not enough real-user data)"}`);
  } catch (e) {
    console.error(`${strategy}: could not fetch (${e.message}). Nothing written for this device.`);
  }
}

fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2) + "\n");
console.log(`\nWritten to ${DATA_PATH}. agenticBrowsing stays typed by hand (not in the API).`);
