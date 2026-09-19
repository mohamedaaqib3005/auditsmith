// scripts/render-pdf.jsx
import React from "react";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { pdf } from "@react-pdf/renderer";

// src/lib/composeReport.js
var PREPARED_BY = "AuditSmith";
var REPORT_TYPE = "Website Audit Report";
var COVER_SUBTITLE = "Performance, technical SEO, on-page content, AI readiness, accessibility, technology and usability analysis.";
var SUMMARY = (site, dimensions, labels) => `This audit reviews ${site} across ${dimensions} dimensions: ${labels ? labels.join(", ").replace(/, ([^,]*)$/, " and $1") : "the sections that follow"}. The overall grade below summarises the findings; each section then details its evidence, and every failing check carries a concrete fix.`;
var TEST_CONDITIONS = {
  mobile: {
    deviceDetail: "Emulated Moto G Power",
    tool: "Lighthouse 13.4.1, HeadlessChromium 151.0.7922.71",
    network: "Slow 4G throttling"
  },
  desktop: {
    deviceDetail: "Emulated desktop",
    tool: "Lighthouse 13.4.1, HeadlessChromium 151.0.7922.71",
    network: "Custom throttling"
  }
};
var FIELD_THRESHOLDS = {
  lcp: { good: 2.5, poor: 4, unit: "s", label: "Largest Contentful Paint (LCP)", core: true },
  inp: { good: 200, poor: 500, unit: "ms", label: "Interaction to Next Paint (INP)", core: true },
  cls: { good: 0.1, poor: 0.25, unit: "", label: "Cumulative Layout Shift (CLS)", core: true },
  fcp: { good: 1.8, poor: 3, unit: "s", label: "First Contentful Paint (FCP)" },
  ttfb: { good: 0.8, poor: 1.8, unit: "s", label: "Time to First Byte (TTFB)" }
};
var LAB_THRESHOLDS_DESKTOP = {
  fcp: { good: 0.9, poor: 1.6, unit: "s", label: "First Contentful Paint" },
  lcp: { good: 1.2, poor: 2.4, unit: "s", label: "Largest Contentful Paint" },
  tbt: { good: 150, poor: 350, unit: "ms", label: "Total Blocking Time" },
  cls: { good: 0.1, poor: 0.25, unit: "", label: "Cumulative Layout Shift" },
  speedIndex: { good: 1.3, poor: 2.3, unit: "s", label: "Speed Index" }
};
var LAB_THRESHOLDS = {
  fcp: { good: 1.8, poor: 3, unit: "s", label: "First Contentful Paint" },
  lcp: { good: 2.5, poor: 4, unit: "s", label: "Largest Contentful Paint" },
  tbt: { good: 200, poor: 600, unit: "ms", label: "Total Blocking Time" },
  cls: { good: 0.1, poor: 0.25, unit: "", label: "Cumulative Layout Shift" },
  speedIndex: { good: 3.4, poor: 5.8, unit: "s", label: "Speed Index" }
};
var rate = (value, t) => {
  if (value === null || value === void 0) return "na";
  if (value <= t.good) return "good";
  if (value <= t.poor) return "needs-improvement";
  return "poor";
};
var fmt = (value, t) => {
  if (value === null || value === void 0) return "N/A";
  return t.unit ? `${value} ${t.unit}` : `${value}`;
};
var metricItems = (data2 = {}, thresholds) => Object.entries(thresholds).filter(([key]) => key in data2).map(([key, t]) => ({
  label: t.label,
  value: fmt(data2[key], t),
  rating: rate(data2[key], t)
}));
var brandFromSite = (site = "") => {
  const host = site.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
  const name = host.split(".")[0] || host;
  return name.charAt(0).toUpperCase() + name.slice(1);
};
var displaySite = (site = "") => site.replace(/^https?:\/\//, "").replace(/\/$/, "").split("/")[0];
var todayLong = () => (/* @__PURE__ */ new Date()).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
var makeReference = (brand, code) => {
  let token;
  if (code) token = String(code);
  else {
    const parts = brand.split(/[^a-zA-Z0-9]+/).filter(Boolean);
    if (parts.length >= 2) token = parts.map((w) => w[0]).join("");
    else token = brand.length <= 8 ? brand : brand.slice(0, 8);
  }
  return `AUD-${token.toUpperCase().replace(/[^A-Z0-9]/g, "")}-${(/* @__PURE__ */ new Date()).getFullYear()}-001`;
};
var assess = (fieldData = {}) => {
  const cores = Object.entries(FIELD_THRESHOLDS).filter(([k, t]) => t.core && fieldData[k] != null);
  if (cores.length === 0) return "Not available";
  return cores.every(([k, t]) => rate(fieldData[k], t) === "good") ? "Passed" : "Failed";
};
var SCORE_LABELS = {
  performance: "Performance",
  accessibility: "Accessibility",
  bestPractices: "Best Practices",
  seo: "SEO",
  agenticBrowsing: "Agentic Browsing"
};
var AGENTIC_DEFAULT_MAX = 2;
var scoreItems = (scores = {}) => Object.entries(scores).map(([key, v]) => {
  const label = SCORE_LABELS[key] || key;
  if (key === "agenticBrowsing") {
    const [num, max] = typeof v === "string" && v.includes("/") ? v.split("/").map(Number) : [v, AGENTIC_DEFAULT_MAX];
    return { label, score: num, max, display: `${num}/${max}` };
  }
  if (typeof v === "string" && v.includes("/")) {
    const [num, max] = v.split("/").map(Number);
    return { label, score: num, max, display: v };
  }
  return { label, score: v, max: 100 };
});
var TECH_CHECKS = {
  sitemap: {
    label: "XML Sitemap",
    present: { status: "OK", notes: "Present, valid" },
    stale: { status: "Issues", notes: "Present, contains stale URLs" },
    missing: { status: "Missing", notes: "Not found" }
  },
  robotsTxt: {
    label: "Robots.txt",
    true: { status: "OK", notes: "Present, valid" },
    false: { status: "Missing", notes: "Not found" }
  },
  https: {
    label: "HTTPS",
    true: { status: "OK", notes: "Enforced site-wide" },
    false: { status: "Issues", notes: "Not enforced on all pages" }
  }
};
var MOST_PAGES = (n, pages) => pages > 0 && n / pages > 0.5;
var ONPAGE_CHECKS = {
  missingTitles: { label: "Page titles", issue: (n) => `Missing on ${n} page${n === 1 ? "" : "s"}`, severe: MOST_PAGES },
  duplicateTitles: { label: "Duplicate titles", issue: (n) => `${n} page${n === 1 ? "" : "s"} share a title` },
  missingMeta: { label: "Meta descriptions", issue: (n) => `Missing on ${n} page${n === 1 ? "" : "s"}`, severe: MOST_PAGES },
  duplicateMeta: { label: "Duplicate meta descriptions", issue: (n) => `${n} page${n === 1 ? "" : "s"} share one` },
  missingH1: { label: "H1 headings", issue: (n) => `Missing on ${n} page${n === 1 ? "" : "s"}`, severe: MOST_PAGES },
  multipleH1: { label: "Multiple H1s", issue: (n) => `${n} page${n === 1 ? "" : "s"} have more than one`, severe: MOST_PAGES },
  thinPages: { label: "Thin content", issue: (n) => `${n} page${n === 1 ? "" : "s"} under 200 words` },
  truncatedTitles: { label: "Titles truncated in search", issue: (n) => `${n} title${n === 1 ? "" : "s"} exceed Google's ~580px display width` },
  truncatedMetas: { label: "Descriptions truncated in search", issue: (n) => `${n} description${n === 1 ? "" : "s"} exceed the ~990px display width` }
};
var AI_CHECKS = {
  llmsTxt: {
    label: "llms.txt",
    true: { status: "OK", notes: "Present at /llms.txt" },
    false: { status: "Missing", notes: "No /llms.txt file found" },
    fix: "Add an llms.txt file at the site root describing the site and its key pages for AI systems."
  },
  structuredData: {
    label: "Structured data (Schema.org)",
    true: { status: "OK", notes: "Schema.org markup present" },
    false: { status: "Missing", notes: "No Schema.org markup detected" },
    fix: "Add Schema.org JSON-LD (Organization, WebSite, and page-type markup) so AI systems can interpret the site."
  }
};
var AI_BOT_COUNT = 4;
var NOJS_OK_WORDS = 100;
var NOJS_PARTIAL_WORDS = 20;
var AI_FACT_CHECKS = {
  blockedAiBots: {
    label: "AI crawler access",
    fix: "Remove the robots.txt Disallow rules for the AI crawlers the site should be visible to.",
    interpret: (bots) => bots.length === 0 ? { value: "GPTBot, ClaudeBot, PerplexityBot allowed", rating: "good" } : {
      value: `Blocked in robots.txt: ${bots.join(", ")}`,
      rating: bots.length >= AI_BOT_COUNT ? "poor" : "needs-improvement"
    }
  },
  noindexPages: {
    label: "Meta robots",
    fix: "Remove accidental noindex/none directives from pages that should be visible.",
    interpret: (n, pages) => n === 0 ? { value: "No accidental noindex blocking", rating: "good" } : {
      value: `${n} page${n === 1 ? "" : "s"} carry noindex directives`,
      rating: MOST_PAGES(n, pages || 0) ? "poor" : "needs-improvement"
    }
  },
  aiVisibility: {
    label: "AI answer visibility",
    fix: "AI assistants cite sources they trust; referring domains, llms.txt reach and consistent entity information drive mentions. The off-site authority work is the same work.",
    interpret: (pct) => {
      return pct >= 60 ? { value: `Mentioned in ${pct}% of relevant AI answers (manual spot-check)`, rating: "good" } : pct >= 20 ? { value: `Mentioned in only ${pct}% of relevant AI answers (manual spot-check)`, rating: "needs-improvement" } : { value: `Mentioned in ${pct}% of relevant AI answers (manual spot-check)`, rating: "poor" };
    }
  },
  jsDependence: {
    label: "JavaScript dependence",
    fix: "Server-render the missing share; content that exists only after JavaScript runs is invisible to non-rendering crawlers, including most AI bots.",
    interpret: (pct) => pct >= 80 ? { value: `${pct}% of rendered content survives without JavaScript`, rating: "good" } : pct >= 40 ? { value: `Only ${pct}% of rendered content survives without JavaScript`, rating: "needs-improvement" } : { value: `${pct}% of content exists without JavaScript, the rest is JS-only`, rating: "poor" }
  },
  noJsWords: {
    label: "Content without JavaScript",
    fix: "Server-render or statically generate key content; many AI crawlers do not execute JavaScript.",
    interpret: (words) => words >= NOJS_OK_WORDS ? { value: `${words} words readable without JS`, rating: "good" } : words >= NOJS_PARTIAL_WORDS ? { value: `Only ${words} words readable without JS`, rating: "needs-improvement" } : { value: `Page nearly empty without JS (${words} words)`, rating: "poor" }
  }
};
var DEVICE_LABELS = { mobile: "Mobile", desktop: "Desktop" };
var deviceBlocks = (device, ps, labelHeadings) => {
  const b = [];
  const cond = TEST_CONDITIONS[device] || TEST_CONDITIONS.mobile;
  const assessment = assess(ps.fieldData);
  const name = DEVICE_LABELS[device] || device;
  if (labelHeadings) b.push({ type: "heading", text: `${name} Results` });
  if (ps.fieldData) {
    if (!labelHeadings) b.push({ type: "heading", text: "Core Web Vitals Assessment" });
    b.push({
      type: "paragraph",
      text: `Field data from real users over the latest 28-day period (Chrome UX Report)${labelHeadings ? `, ${name.toLowerCase()} devices` : ""}. Overall assessment: ${assessment}.`
    });
  }
  if (ps.scores) b.push({ type: "scorecard", items: scoreItems(ps.scores) });
  if (ps.fieldData)
    b.push({
      type: "metrics",
      title: `Field Data (Real Users${labelHeadings ? `, ${name}` : ""})`,
      items: metricItems(ps.fieldData, FIELD_THRESHOLDS)
    });
  if (ps.labMetrics) {
    b.push({ type: "heading", text: labelHeadings ? `Lab Metrics (Lighthouse, ${name})` : "Lab Metrics (Lighthouse)" });
    b.push({
      type: "metrics",
      title: "Single Page Session, Initial Load",
      items: metricItems(ps.labMetrics, name === "Desktop" ? LAB_THRESHOLDS_DESKTOP : LAB_THRESHOLDS)
    });
  }
  if (ps.findings?.length) {
    b.push({ type: "heading", text: "Performance Findings" });
    b.push({ type: "findings", items: ps.findings });
  }
  b.push({ type: "heading", text: labelHeadings ? `Test Conditions (${name})` : "Test Conditions" });
  b.push({
    type: "keyValue",
    items: [
      { label: "Tool", value: cond.tool },
      { label: "Device", value: cond.deviceDetail },
      { label: "Network", value: cond.network },
      { label: "Session", value: "Single page session, initial page load" },
      { label: "Field data", value: "Latest 28-day period, Chrome UX Report" }
    ]
  });
  return b;
};
var pagespeedSections = (ps, date) => {
  if (!ps) return [];
  let byDevice;
  if (ps.mobile || ps.desktop) {
    byDevice = { mobile: ps.mobile, desktop: ps.desktop };
  } else {
    const device = ps.device === "desktop" ? "desktop" : "mobile";
    byDevice = { [device]: ps };
  }
  const devices = ["mobile", "desktop"].filter((d) => byDevice[d]);
  if (!devices.length) return [];
  const multi = devices.length > 1;
  const s2 = [];
  s2.push({
    type: "sectionDivider",
    number: "01",
    title: "PageSpeed Insights",
    description: `Google PageSpeed Insights results: real-user Core Web Vitals, Lighthouse lab metrics. Tested ${date} on ${devices.map((d) => DEVICE_LABELS[d].toLowerCase()).join(" and ")}.`
  });
  for (const d of devices) s2.push(...deviceBlocks(d, byDevice[d], multi));
  return s2;
};
var technicalSeoSections = (ts, cf) => {
  if (!ts) return [];
  const s2 = [];
  const pct = ts.pagesCrawled > 0 && ts.indexable != null ? Math.round(ts.indexable / ts.pagesCrawled * 100) : null;
  const rows = [];
  for (const [key, check] of Object.entries(TECH_CHECKS)) {
    if (ts[key] == null) continue;
    const state = check[ts[key]] || {
      status: "Unknown",
      notes: `Unrecognised value "${ts[key]}"`
    };
    rows.push([check.label, state.status, state.notes]);
  }
  if (ts.brokenLinks != null)
    rows.push([
      "Broken internal links",
      ts.brokenLinks === 0 ? "OK" : "Issues",
      ts.brokenLinks === 0 ? "None detected" : `${ts.brokenLinks} found`
    ]);
  if (ts.redirectChains != null)
    rows.push([
      "Redirect chains",
      ts.redirectChains === 0 ? "OK" : "Issues",
      ts.redirectChains === 0 ? "None detected" : `${ts.redirectChains} found`
    ]);
  const issueCount = rows.filter((r) => r[1] !== "OK").length;
  const STATUS_RATING = { OK: "good", Issues: "needs-improvement", Missing: "poor" };
  const checkItems = rows.map(([label, status, notes]) => ({
    label,
    value: notes,
    rating: STATUS_RATING[status] || "na"
  }));
  s2.push({
    type: "sectionDivider",
    number: "02",
    title: "Technical SEO",
    description: "Crawlability, indexation, sitemaps, redirects and site health as seen by search engine bots."
  });
  s2.push({ type: "heading", text: "Crawl Overview" });
  s2.push({
    type: "paragraph",
    text: issueCount === 0 ? `A crawl of ${ts.pagesCrawled} pages found no technical issues across the checks below.` : `A crawl of ${ts.pagesCrawled} pages found ${issueCount} check${issueCount === 1 ? "" : "s"} needing attention, detailed below.`
  });
  if (pct != null) {
    s2.push({
      type: "scorecard",
      items: [
        {
          label: `Indexable (${ts.indexable} of ${ts.pagesCrawled} pages)`,
          score: ts.indexable,
          max: ts.pagesCrawled,
          display: `${pct}%`
        }
      ]
    });
  } else if (ts.pagesCrawled != null) {
    s2.push({
      type: "keyValue",
      items: [{ label: "Pages crawled", value: `${ts.pagesCrawled}` }]
    });
  }
  if (checkItems.length) {
    s2.push({ type: "heading", text: "Health Checks" });
    s2.push({ type: "metrics", title: "Crawl & Site Health", items: checkItems });
  }
  if (ts.nonIndexable && Object.keys(ts.nonIndexable).length) {
    s2.push({ type: "heading", text: "Indexability" });
    s2.push({
      type: "keyValue",
      items: Object.entries(ts.nonIndexable).map(([reason, n]) => ({
        label: `${n} page${n === 1 ? "" : "s"}`,
        value: reason
      }))
    });
  }
  const archItems = [
    ts.parameterUrls != null && {
      label: "Parameterised URLs",
      value: ts.parameterUrls === 0 ? "None found" : `${ts.parameterUrls} URL${ts.parameterUrls === 1 ? "" : "s"} with query parameters`,
      rating: ts.parameterUrls === 0 ? "good" : "needs-improvement"
    },
    ts.deepPages != null && {
      label: "Deep pages (4+ clicks from home)",
      value: ts.deepPages === 0 ? "None found" : `${ts.deepPages} page${ts.deepPages === 1 ? "" : "s"}`,
      rating: ts.deepPages === 0 ? "good" : "needs-improvement"
    },
    ts.weakPages != null && {
      label: "Weakly linked pages (1 or fewer inlinks)",
      value: ts.weakPages === 0 ? "None found" : `${ts.weakPages} page${ts.weakPages === 1 ? "" : "s"}, orphan candidates`,
      rating: ts.weakPages === 0 ? "good" : "needs-improvement"
    },
    ts.largeImages != null && {
      label: "Large images (over 100 KB)",
      value: ts.largeImages === 0 ? "None found" : `${ts.largeImages} of ${ts.imagesCrawled} images`,
      rating: ts.largeImages === 0 ? "good" : "needs-improvement"
    }
  ].filter(Boolean);
  if (archItems.length) {
    s2.push({ type: "heading", text: "Architecture & Assets" });
    s2.push({ type: "metrics", title: "Structure, Linking & Images", items: archItems });
  }
  const hygiene = [];
  if (ts.redirectedUrls != null) {
    const share = ts.pagesCrawled ? ts.redirectedUrls / ts.pagesCrawled : 0;
    hygiene.push({
      label: "Internal redirects",
      value: ts.redirectedUrls === 0 ? "No redirected URLs in the crawl" : `${ts.redirectedUrls} crawled URL${ts.redirectedUrls === 1 ? "" : "s"} redirect`,
      rating: ts.redirectedUrls === 0 ? "good" : share > 0.2 ? "poor" : "needs-improvement",
      recommendation: ts.redirectedUrls > 0 ? "Update internal links to point at final URLs so crawlers and users skip the hop." : void 0
    });
  }
  if (cf?.sitemapUrls && ts.pagesCrawled && cf.sitemapUrls > ts.pagesCrawled * 1.2) {
    hygiene.push({
      label: "Sitemap coverage",
      value: `${cf.sitemapUrls} URLs listed in the sitemap, ${ts.pagesCrawled} reached by the crawl`,
      rating: "needs-improvement",
      recommendation: "Pages the sitemap lists but internal links never reach are orphan candidates: linked from nowhere, they depend entirely on the sitemap to be found. Review whether they deserve links or removal."
    });
  }
  if (ts.heavyPages != null) {
    hygiene.push({
      label: "Page weight",
      value: ts.heavyPages === 0 ? "No pages over 2 MB transferred" : `${ts.heavyPages} page${ts.heavyPages === 1 ? "" : "s"} transfer over 2 MB`,
      rating: ts.heavyPages === 0 ? "good" : "needs-improvement",
      recommendation: ts.heavyPages > 0 ? "Compress media and defer non-critical assets on the heavy pages; page weight is the raw material of slow load times." : void 0
    });
  }
  if (ts.imageAlt?.total != null) {
    const ia = ts.imageAlt;
    hygiene.push({
      label: "Image alt text",
      value: ia.missingAlt == null ? `${ia.total} images crawled` : ia.missingAlt === 0 ? `All ${ia.total} images have alt text` : `Missing on ${ia.missingAlt} of ${ia.total} images`,
      rating: ia.missingAlt === 0 ? "good" : ia.missingAlt / ia.total > 0.3 ? "poor" : "needs-improvement",
      recommendation: ia.missingAlt > 0 ? "Add descriptive alt text; it serves screen-reader users and image search alike." : void 0
    });
  }
  if (ts.internalAnchors?.total) {
    const an = ts.internalAnchors;
    const weak = an.generic + an.empty;
    const share = weak / an.total;
    hygiene.push({
      label: "Anchor text",
      value: weak === 0 ? `All ${an.total} internal links use descriptive anchors` : `${weak} of ${an.total} internal links use generic or empty anchors`,
      rating: weak === 0 ? "good" : share > 0.2 ? "poor" : "needs-improvement",
      recommendation: weak > 0 ? 'Replace "click here" and empty anchors with descriptive text; anchors tell search engines what the destination page is about.' : void 0
    });
  }
  if (ts.missingCanonical != null || ts.canonicalizedElsewhere != null) {
    const miss = ts.missingCanonical ?? 0;
    const elsewhere = ts.canonicalizedElsewhere ?? 0;
    hygiene.push({
      label: "Canonical tags",
      value: miss === 0 && elsewhere === 0 ? "Every page declares itself canonical" : `${miss ? `Missing on ${miss} page${miss === 1 ? "" : "s"}` : ""}${miss && elsewhere ? "; " : ""}${elsewhere ? `${elsewhere} point${elsewhere === 1 ? "s" : ""} elsewhere` : ""}`,
      rating: miss === 0 && elsewhere === 0 ? "good" : "needs-improvement",
      recommendation: miss > 0 ? "Add self-referencing canonical tags so duplicate URLs cannot compete with their own pages." : elsewhere > 0 ? "Confirm the pages canonicalised to other URLs are intentional; each one gives its ranking signals away." : void 0
    });
  }
  if (hygiene.length) {
    s2.push({ type: "heading", text: "Crawl Hygiene" });
    s2.push({ type: "checks", items: hygiene });
  }
  if (ts.topByLinkEquity?.length) {
    s2.push({ type: "heading", text: "Internal Link Equity" });
    s2.push({
      type: "paragraph",
      text: `The pages the site's own internal linking strengthens most${ts.avgExternalOutlinks != null ? `; pages link out ${ts.avgExternalOutlinks} time${ts.avgExternalOutlinks === 1 ? "" : "s"} on average` : ""}. Pages that should rank belong on this list.`
    });
    s2.push({
      type: "table",
      columns: ["Page", "Link score"],
      rows: ts.topByLinkEquity.map((p2) => [p2.url, String(p2.score)])
    });
  }
  return s2;
};
var onPageSeoSections = (op, pages, kf, cf) => {
  if (!op) return [];
  const s2 = [];
  const items = [];
  for (const [key, check] of Object.entries(ONPAGE_CHECKS)) {
    if (op[key] == null) continue;
    const n = op[key];
    items.push({
      label: check.label,
      value: n === 0 ? "No issues found" : check.issue(n),
      rating: n === 0 ? "good" : check.severe && check.severe(n, pages || 0) ? "poor" : "needs-improvement"
    });
  }
  const issueCount = items.filter((i) => i.rating !== "good").length;
  s2.push({
    type: "sectionDivider",
    number: "03",
    title: "On-Page SEO",
    description: "Titles, meta descriptions, heading structure and content depth across the crawled pages."
  });
  s2.push({ type: "heading", text: "Content Checks" });
  s2.push({
    type: "paragraph",
    text: issueCount === 0 ? "All on-page checks passed across the crawled pages." : `${issueCount} on-page check${issueCount === 1 ? "" : "s"} need${issueCount === 1 ? "s" : ""} attention, detailed below.`
  });
  if (items.length) {
    s2.push({ type: "metrics", title: "Titles, Descriptions & Headings", items });
  }
  if (kf?.terms?.length) {
    const covered = kf.terms.filter((t) => t.inTitle || t.inH1).length;
    s2.push({ type: "heading", text: "Keyword Focus" });
    s2.push({
      type: "paragraph",
      text: "The words the homepage uses most, and whether each appears where search engines weigh it: the title, the meta description, and the main heading."
    });
    s2.push({
      type: "table",
      columns: ["Term", "Uses", "Title", "Meta", "H1"],
      rows: kf.terms.map((t) => [t.term, String(t.count), t.inTitle ? "Yes" : "No", t.inMeta ? "Yes" : "No", t.inH1 ? "Yes" : "No"])
    });
    s2.push({
      type: "checks",
      items: [{
        label: "Keyword alignment",
        value: `${covered} of ${kf.terms.length} dominant terms appear in the title or H1`,
        rating: covered >= 4 ? "good" : covered >= 2 ? "needs-improvement" : "poor",
        recommendation: covered < 4 ? "Work the missing dominant terms into the title and main heading, or rewrite the copy toward the terms the page should rank for; the page currently emphasises words its metadata ignores." : void 0
      }]
    });
  }
  const quality = [];
  if (op.avgReadability != null) {
    const label = op.avgReadability >= 60 ? "plain-language" : op.avgReadability >= 50 ? "fairly hard" : "hard";
    quality.push({
      label: "Readability",
      value: `Average Flesch score ${op.avgReadability} (${label}), ${op.hardReadingPages ?? 0} hard-to-read page${(op.hardReadingPages ?? 0) === 1 ? "" : "s"}`,
      rating: op.avgReadability >= 60 ? "good" : op.avgReadability >= 50 ? "needs-improvement" : "poor",
      recommendation: op.avgReadability < 60 ? "Shorter sentences and simpler wording lift comprehension for readers, and for the AI systems summarising the site." : void 0
    });
  }
  if (cf?.withDates) {
    const monthsSince = Math.floor((Date.now() - new Date(cf.newest)) / (30.44 * 864e5));
    const staleShare = cf.olderThanYear / cf.withDates;
    quality.push({
      label: "Content freshness",
      value: `Newest change ${cf.newest}${cf.olderThanYear ? `; ${cf.olderThanYear} of ${cf.withDates} pages untouched for over a year` : ""}`,
      rating: monthsSince <= 3 && staleShare < 0.5 ? "good" : monthsSince <= 12 ? "needs-improvement" : "poor",
      recommendation: monthsSince > 3 || staleShare >= 0.5 ? "Refresh or retire stale pages; both readers and ranking systems favour sites that visibly maintain their content." : void 0
    });
  }
  if (op.spellingPages != null) {
    quality.push({
      label: "Spelling",
      value: op.spellingPages === 0 ? "No spelling errors detected" : `Errors detected on ${op.spellingPages} page${op.spellingPages === 1 ? "" : "s"}`,
      rating: op.spellingPages === 0 ? "good" : op.spellingPages > 5 ? "poor" : "needs-improvement",
      recommendation: op.spellingPages > 0 ? "Fix the flagged spellings; small errors read as carelessness to visitors and quality raters alike." : void 0
    });
  }
  if (quality.length) {
    s2.push({ type: "heading", text: "Content Quality" });
    s2.push({ type: "checks", items: quality });
  }
  return s2;
};
var AI_SCORE_LABELS = {
  EEAT: "E-E-A-T",
  eeat: "E-E-A-T",
  socials: "Social Signals",
  structuredData: "Structured Data"
};
var ACCESS_CATEGORIES = {
  clickables: { label: "Clickables", fix: "Give every interactive element a discernible name and keyboard focus." },
  titles: { label: "Titles", fix: "Add unique, descriptive titles to pages and frames." },
  lists: { label: "Lists", fix: "Mark up lists with proper list elements so screen readers announce them." },
  graphics: { label: "Graphics", fix: "Add descriptive alt text to informative images; mark decorative ones as such." },
  forms: { label: "Forms", fix: "Label every form field and associate errors with their inputs." },
  document: { label: "Document", fix: "Declare the page language and a valid document structure." },
  readability: { label: "Readability", fix: "Raise text contrast and sizing to meet WCAG AA for readable content." },
  tables: { label: "Tables", fix: "Use header cells and scope attributes so table data reads correctly." },
  general: { label: "General", fix: "Resolve the remaining WCAG failures flagged in the checker's General group." },
  media: { label: "Audio & Video", fix: "Provide captions and transcripts for audio and video content." }
};
var EMAIL_CHECKS = {
  spf: {
    label: "SPF record",
    true: { value: "Present, senders authorised", rating: "good" },
    false: { value: "No SPF record found", rating: "poor" },
    fix: "Add an SPF TXT record listing the servers allowed to send mail for this domain."
  },
  dmarc: {
    label: "DMARC record",
    reject: { value: "Present and enforcing (p=reject)", rating: "good" },
    quarantine: { value: "Present and enforcing (p=quarantine)", rating: "good" },
    none: { value: "Present but not enforcing (p=none)", rating: "needs-improvement" },
    missing: { value: "No DMARC record found", rating: "poor" },
    fix: "Publish a _dmarc record with p=quarantine or p=reject to protect the domain from spoofing."
  }
};
var MISSING_SHARE_OK = 0.25;
var MISSING_SHARE_WARN = 0.5;
var keywordsSections = (k) => {
  if (!k || !k.analysed) return [];
  const s2 = [];
  s2.push({
    type: "sectionDivider",
    number: "07",
    title: "Keyword Visibility",
    description: `Where the site ranks for the keywords that matter in its market, measured against ${k.competitors?.length ? k.competitors.join(" and ") : "its competitors"} across ${k.analysed} analysed keywords.`
  });
  const d = k.rankingDistribution || {};
  s2.push({ type: "heading", text: "Ranking Distribution" });
  s2.push({
    type: "keyValue",
    items: [
      { label: "Top 3 positions", value: `${d.top3 ?? 0} keywords` },
      { label: "Top 10 positions", value: `${d.top10 ?? 0} keywords` },
      { label: "Top 20 positions", value: `${d.top20 ?? 0} keywords` },
      { label: "Top 100 positions", value: `${d.top100 ?? 0} keywords` }
    ]
  });
  const missingShare = k.missing / k.analysed;
  const items = [
    {
      label: "Keyword coverage",
      value: `Absent from ${k.missing} of ${k.analysed} market keywords`,
      rating: missingShare <= MISSING_SHARE_OK ? "good" : missingShare <= MISSING_SHARE_WARN ? "needs-improvement" : "poor",
      recommendation: missingShare > MISSING_SHARE_OK ? "Create or optimise pages for the highest-volume missing keywords below; competitors already prove they can rank." : void 0
    },
    {
      label: "Competitive position",
      value: `Ahead on ${k.ahead}, behind on ${k.behind} shared keywords`,
      rating: k.ahead >= k.behind ? "good" : k.behind > k.ahead * 2 ? "poor" : "needs-improvement",
      recommendation: k.behind > k.ahead ? "Strengthen the pages already ranking: internal links, content depth and freshness close position gaps fastest." : void 0
    }
  ];
  s2.push({ type: "heading", text: "Competitive Gap" });
  s2.push({
    type: "paragraph",
    text: `Of the analysed keywords, the site is missing from ${k.missing}, ranks behind a competitor on ${k.behind}, and leads on ${k.ahead}.`
  });
  s2.push({ type: "checks", items });
  if (k.topOpportunities?.length) {
    s2.push({ type: "heading", text: "Top Opportunities" });
    s2.push({
      type: "paragraph",
      text: "The highest-volume keywords the site is absent from, and the competitor currently holding each."
    });
    s2.push({
      type: "table",
      columns: ["Keyword", "Monthly volume", "Held by", "Their position"],
      rows: k.topOpportunities.map((o) => [o.keyword, String(o.volume), o.competitor, `#${o.position}`])
    });
  }
  return s2;
};
var EXPIRY_WARN_DAYS = 180;
var EXPIRY_URGENT_DAYS = 45;
var usabilitySections = (u) => {
  if (!u) return [];
  const s2 = [];
  s2.push({
    type: "sectionDivider",
    number: "07",
    title: "Usability",
    description: "Whether visitors can accomplish what they came for without friction: page weight, mobile fit, search, forms, error recovery, measured directly, with room for expert evaluation alongside."
  });
  const items = [];
  if (u.pageWeightKb != null)
    items.push({
      label: "Page weight",
      value: `${(u.pageWeightKb / 1024).toFixed(1)} MB transferred on mobile`,
      rating: u.pageWeightKb < 2048 ? "good" : u.pageWeightKb < 5120 ? "needs-improvement" : "poor",
      recommendation: u.pageWeightKb >= 2048 ? "Compress and lazy-load media; every megabyte is seconds of waiting on a mobile connection." : void 0
    });
  if (u.unsizedImages != null)
    items.push({
      label: "Unsized images",
      value: u.unsizedImages === 0 ? "All images declare dimensions" : `${u.unsizedImages} image${u.unsizedImages === 1 ? "" : "s"} without width/height`,
      rating: u.unsizedImages === 0 ? "good" : "needs-improvement",
      recommendation: u.unsizedImages > 0 ? "Declare width and height so the layout cannot jump as images load." : void 0
    });
  if (u.consoleErrors != null)
    items.push({
      label: "Console errors",
      value: u.consoleErrors === 0 ? "No errors logged at load" : `${u.consoleErrors} error${u.consoleErrors === 1 ? "" : "s"} logged at load`,
      rating: u.consoleErrors === 0 ? "good" : "needs-improvement",
      recommendation: u.consoleErrors > 0 ? "Fix logged errors; each one is behaviour some visitor is missing." : void 0
    });
  if (u.mobileOverflow != null)
    items.push({
      label: "Mobile viewport fit",
      value: u.mobileOverflow ? "Content wider than a phone screen, horizontal scrolling required" : "Content fits a phone screen",
      rating: u.mobileOverflow ? "poor" : "good",
      recommendation: u.mobileOverflow ? "Constrain wide elements; horizontal scrolling on mobile loses visitors." : void 0
    });
  if (u.viewportOk != null)
    items.push({ label: "Viewport configuration", value: u.viewportOk ? "Correct mobile viewport" : "Viewport meta missing or wrong", rating: u.viewportOk ? "good" : "poor", recommendation: u.viewportOk ? void 0 : "Add the standard responsive viewport meta tag." });
  if (u.fontLegible != null)
    items.push({ label: "Font legibility", value: u.fontLegible ? "Text sized for reading on mobile" : "Text too small on mobile", rating: u.fontLegible ? "good" : "needs-improvement", recommendation: u.fontLegible ? void 0 : "Use at least 12px-equivalent sizes for body text." });
  if (u.tapTargetsOk != null)
    items.push({ label: "Tap targets", value: u.tapTargetsOk ? "Buttons and links comfortably tappable" : "Some controls too small or close to tap reliably", rating: u.tapTargetsOk ? "good" : "needs-improvement", recommendation: u.tapTargetsOk ? void 0 : "Give interactive elements at least 44px of touchable space." });
  if (u.searchPresent != null)
    items.push({
      label: "Site search",
      value: u.searchPresent ? "Search available" : "No search anywhere on the page",
      rating: u.searchPresent ? "good" : "needs-improvement",
      recommendation: u.searchPresent ? void 0 : "Offer search; visitors who cannot find what they came for leave."
    });
  if (u.formInputs)
    items.push({
      label: "Form labelling",
      value: `${u.labelledInputs} of ${u.formInputs} inputs labelled`,
      rating: u.labelledInputs === u.formInputs ? "good" : u.labelledInputs / u.formInputs >= 0.7 ? "needs-improvement" : "poor",
      recommendation: u.labelledInputs < u.formInputs ? "Label every input; unlabelled fields confuse both people and assistive tech." : void 0
    });
  if (u.notFound) {
    const nf = u.notFound;
    const okay = nf.mentions404 && nf.hasHomeLink;
    items.push({
      label: "404 page",
      value: `${nf.mentions404 ? "Acknowledges the error" : "Does not say the page is missing"}${nf.hasHomeLink ? ", offers a way home" : ", no way home"} (${nf.words} words)`,
      rating: okay && nf.words >= 15 ? "good" : nf.hasHomeLink ? "needs-improvement" : "poor",
      recommendation: okay && nf.words >= 15 ? void 0 : "A useful 404 admits the miss and offers routes onward: home, search, popular pages."
    });
  }
  if (items.length) {
    s2.push({ type: "heading", text: "Measured Checks" });
    s2.push({ type: "checks", items });
  }
  const proto = [];
  if (u.heuristics?.items?.length) {
    s2.push({ type: "heading", text: `Expert Evaluation${u.heuristics.evaluatedOn ? ` (${u.heuristics.evaluatedOn})` : ""}` });
    s2.push({
      type: "checks",
      items: u.heuristics.items.map((h) => ({ label: h.label, value: h.note || h.rating, rating: h.rating }))
    });
  }
  if (u.firstImpression) {
    const fi = u.firstImpression;
    proto.push({
      label: "First impression (5-second test)",
      value: fi.note || `${fi.clear ? "Purpose clear" : "Purpose unclear"}, ${fi.trusted ? "felt trustworthy" : "trust not established"}`,
      rating: fi.clear && fi.trusted ? "good" : fi.clear || fi.trusted ? "needs-improvement" : "poor"
    });
  }
  if (u.tasks?.items?.length)
    for (const t of u.tasks.items) proto.push({ label: `Task: ${t.task}`, value: t.note || t.rating, rating: t.rating });
  if (proto.length) {
    s2.push({ type: "heading", text: "Walked Journeys" });
    s2.push({ type: "checks", items: proto });
  }
  return s2;
};
var technologySections = (t, dom) => {
  if (!t && !dom) return [];
  t = t || {};
  const s2 = [];
  s2.push({
    type: "sectionDivider",
    number: "06",
    title: "Technology",
    description: "The stack the site runs on - platform, libraries and server - and whether the domain's email is protected against spoofing."
  });
  const kv = [
    t.server && { label: "Web server", value: t.server },
    t.ip && { label: "IP address", value: t.ip },
    t.charset && { label: "Charset", value: t.charset },
    t.detected?.length && { label: "Detected technologies", value: t.detected.join(", ") }
  ].filter(Boolean);
  if (kv.length) {
    s2.push({ type: "heading", text: "Stack & Server" });
    s2.push({ type: "keyValue", items: kv });
  }
  if (dom) {
    const kv2 = [];
    if (dom.registered) {
      const days = Math.floor((Date.now() - new Date(dom.registered)) / 864e5);
      const totalMonths = Math.floor(days / 30.44);
      const yrs = Math.floor(totalMonths / 12);
      const months = totalMonths % 12;
      kv2.push({ label: "Domain registered", value: `${dom.registered} (${yrs ? `${yrs} year${yrs === 1 ? "" : "s"}, ` : ""}${months} month${months === 1 ? "" : "s"} ago)` });
    }
    if (dom.firstArchived) kv2.push({ label: "First archived", value: `${dom.firstArchived} (Wayback Machine)` });
    if (dom.archiveMonths) kv2.push({ label: "Archive footprint", value: `Captured in ${dom.archiveMonths} distinct months` });
    if (dom.subdomains?.length) kv2.push({ label: "Known subdomains", value: dom.subdomains.slice(0, 6).join(", ") + (dom.subdomains.length > 6 ? ` and ${dom.subdomains.length - 6} more` : "") });
    if (kv2.length) {
      s2.push({ type: "heading", text: "Domain & History" });
      s2.push({ type: "keyValue", items: kv2 });
    }
    const domItems = [];
    if (dom.expires) {
      const daysLeft = Math.floor((new Date(dom.expires) - Date.now()) / 864e5);
      domItems.push({
        label: "Domain expiry",
        value: daysLeft >= 0 ? `${dom.expires}, ${daysLeft} days away` : `Expired ${dom.expires}`,
        rating: daysLeft > EXPIRY_WARN_DAYS ? "good" : daysLeft > EXPIRY_URGENT_DAYS ? "needs-improvement" : "poor",
        recommendation: daysLeft <= EXPIRY_WARN_DAYS ? "Renew the domain well ahead of expiry; a lapse takes the whole site and its email offline." : void 0
      });
    }
    if (dom.transferLock != null) {
      domItems.push({
        label: "Registrar transfer lock",
        value: dom.transferLock ? "Enabled, hijack-resistant" : "Not enabled",
        rating: dom.transferLock ? "good" : "needs-improvement",
        recommendation: dom.transferLock ? void 0 : "Enable the registrar's transfer lock so the domain cannot be moved without explicit approval."
      });
    }
    if (dom.authority?.score != null) {
      const a = dom.authority;
      const best = a.competitors?.length ? Math.max(...a.competitors.map((c) => c.score)) : null;
      const rating = best != null ? a.score >= best * 0.8 ? "good" : a.score >= best * 0.4 ? "needs-improvement" : "poor" : a.score >= 4 ? "good" : a.score >= 2 ? "needs-improvement" : "poor";
      domItems.push({
        label: "Off-site authority",
        value: `${a.score} of 10${a.referringDomains != null ? `, ${a.referringDomains} referring domain${a.referringDomains === 1 ? "" : "s"}` : ""} (${a.source}, approximate)`,
        rating,
        recommendation: rating !== "good" ? "Earn links from industry press, event listings and partner sites; off-site authority is the slowest lever and the one competitors are already pulling." : void 0
      });
    }
    if (domItems.length) s2.push({ type: "checks", items: domItems });
    if (dom.authority?.competitors?.length) {
      s2.push({
        type: "table",
        columns: ["Domain", "Authority", "Referring domains"],
        rows: [
          [`${"" + (dom.authority.source || "")}`.length ? "This site" : "This site", String(dom.authority.score), String(dom.authority.referringDomains ?? "-")],
          ...dom.authority.competitors.map((c) => [c.domain, String(c.score), String(c.referringDomains ?? "-")])
        ]
      });
    }
  }
  const emailItems = [];
  for (const [key, check] of Object.entries(EMAIL_CHECKS)) {
    if (t[key] == null) continue;
    const state = check[t[key]] || { value: `Unrecognised value "${t[key]}"`, rating: "na" };
    emailItems.push({
      label: check.label,
      value: state.value,
      rating: state.rating,
      recommendation: state.rating !== "good" ? check.fix : void 0
    });
  }
  if (emailItems.length) {
    const bad = emailItems.filter((i) => i.rating !== "good").length;
    s2.push({ type: "heading", text: "Email Security" });
    s2.push({
      type: "paragraph",
      text: bad === 0 ? "The domain's email authentication records are in place and enforcing." : `${bad} of ${emailItems.length} email authentication checks need attention - the domain is not fully protected against spoofing.`
    });
    s2.push({ type: "checks", items: emailItems });
  }
  return s2.length > 1 ? s2 : [];
};
var accessibilitySections = (a) => {
  if (a?.engine === "axe-core") {
    const total2 = (a.rulesPassed || 0) + (a.rulesViolated || 0);
    const score = total2 ? Math.round(a.rulesPassed / total2 * 100) : null;
    const s3 = [];
    s3.push({
      type: "sectionDivider",
      number: "05",
      title: "Accessibility",
      description: "Whether every visitor, including those using assistive technology, can perceive and operate the site. Measured with axe-core, the open-source engine behind industry accessibility audits."
    });
    const IMPACT_COST = { critical: 15, serious: 10, moderate: 5, minor: 2 };
    let headline = null;
    if (a.topIssues || a.rulesViolated != null) {
      const ruleImpacts = (a.topIssues || []).map((t) => t.impact);
      let cost = ruleImpacts.reduce((sum, i) => sum + (IMPACT_COST[i] || 2), 0);
      const uncounted = Math.max(0, (a.rulesViolated || 0) - ruleImpacts.length);
      cost += uncounted * IMPACT_COST.minor;
      headline = Math.max(0, 100 - cost);
    }
    const rings2 = [];
    if (headline != null) rings2.push({ label: "Accessibility Score", score: headline, max: 100 });
    if (a.wcagAA && a.wcagAA.passed + a.wcagAA.failed > 0)
      rings2.push({
        label: "WCAG AA",
        score: Math.round(a.wcagAA.passed / (a.wcagAA.passed + a.wcagAA.failed) * 100),
        max: 100
      });
    const cats = Object.entries(a.categories || {});
    if (cats.length)
      rings2.push({
        label: "Categories clean",
        score: Math.round(cats.filter(([, v]) => !v.failed).length / cats.length * 100),
        max: 100
      });
    if (rings2.length) s3.push({ type: "scorecard", items: rings2 });
    const imp = a.nodesByImpact || {};
    s3.push({
      type: "paragraph",
      text: `Of ${total2} applicable checks, ${a.rulesViolated} failed, affecting ${Object.entries(imp).filter(([, n]) => n).map(([k, n]) => `${n} element${n === 1 ? "" : "s"} (${k})`).join(", ") || "no elements"}.`
    });
    if (cats.length) {
      s3.push({ type: "heading", text: "Category Checks" });
      s3.push({
        type: "checks",
        items: cats.sort((x, y) => y[1].failed - x[1].failed || y[1].elements - x[1].elements).map(([label, v]) => {
          const totalRules = v.passed + v.failed;
          return {
            label,
            value: v.failed ? `${v.failed} of ${totalRules} rule${totalRules === 1 ? "" : "s"} failed, ${v.elements} element${v.elements === 1 ? "" : "s"}` : `All ${totalRules} rule${totalRules === 1 ? "" : "s"} passed`,
            rating: v.failed === 0 ? "good" : v.failed / totalRules >= 0.5 ? "poor" : "needs-improvement"
          };
        })
      });
    }
    if (a.topIssues?.length) {
      s3.push({ type: "heading", text: "Issues Found" });
      s3.push({
        type: "checks",
        items: a.topIssues.map((t) => ({
          label: t.help.length > 60 ? t.help.slice(0, 57) + "..." : t.help,
          value: `${t.elements} element${t.elements === 1 ? "" : "s"} (${t.impact})`,
          rating: t.impact === "critical" || t.impact === "serious" ? "poor" : "needs-improvement",
          recommendation: void 0
        }))
      });
    }
    return s3;
  }
  if (!a || !a.categories) return [];
  const s2 = [];
  let totalPassed = 0;
  let totalFailed = 0;
  const items = [];
  for (const [key, counts] of Object.entries(a.categories)) {
    if (counts == null) continue;
    const meta = ACCESS_CATEGORIES[key] || { label: key };
    const passed = counts.passed ?? 0;
    const failed = counts.failed ?? 0;
    totalPassed += passed;
    totalFailed += failed;
    const rating = failed === 0 ? "good" : failed > passed ? "poor" : "needs-improvement";
    items.push({
      label: meta.label,
      value: failed === 0 ? `All ${passed} checks passed` : `${failed} of ${passed + failed} checks failed`,
      rating,
      recommendation: rating !== "good" ? meta.fix : void 0
    });
  }
  if (!items.length) return [];
  const total = totalPassed + totalFailed;
  const pct = total ? Math.round(totalPassed / total * 100) : null;
  s2.push({
    type: "sectionDivider",
    number: "05",
    title: "Accessibility",
    description: "Whether people with disabilities can perceive and use the site: structure, labels, contrast and assistive-technology support, audited category by category."
  });
  s2.push({ type: "heading", text: "WCAG Category Checks" });
  s2.push({
    type: "paragraph",
    text: totalFailed === 0 ? `All ${total} automated accessibility checks passed across ${items.length} categories.` : `${totalFailed} of ${total} automated checks failed across ${items.length} audited categories, so the site is not compliant under WCAG 2.0, 2.1 and 2.2. Categories the tool could not audit automatically are not shown.`
  });
  const rings = [];
  if (a.score != null) {
    rings.push({
      label: "Accessibility Score",
      score: a.score,
      max: 100,
      display: `${Math.round(a.score)}`,
      size: 72
    });
  }
  if (pct != null) {
    rings.push({
      label: `Checks passed (${totalPassed} of ${total})`,
      score: totalPassed,
      max: total,
      display: `${pct}%`,
      size: 72
    });
    rings.push({
      label: "WCAG 2.0, 2.1 & 2.2 failed",
      score: totalPassed,
      max: total,
      display: `${totalFailed}`,
      size: 72
    });
  }
  if (rings.length) s2.push({ type: "scorecard", items: rings });
  s2.push({ type: "checks", items });
  return s2;
};
var aiReadinessSections = (ai, pages) => {
  if (!ai) return [];
  const s2 = [];
  const STATUS_RATING = { OK: "good", Issues: "needs-improvement", Missing: "poor" };
  const items = [];
  const ORDER = ["llmsTxt", "blockedAiBots", "structuredData", "noindexPages", "noJsWords", "jsDependence", "aiVisibility"];
  if (ai.visibilityCheck?.asked > 0) {
    const vc = ai.visibilityCheck;
    ai = { ...ai, aiVisibility: Math.round(vc.mentioned / vc.asked * 100) };
  }
  if (ai.renderedWords != null && ai.noJsWords != null && ai.renderedWords > 0) {
    const pct = Math.round(Math.min(ai.noJsWords, ai.renderedWords) / ai.renderedWords * 100);
    ai = { ...ai, jsDependence: pct };
  }
  for (const key of ORDER) {
    if (ai[key] == null) continue;
    if (AI_CHECKS[key]) {
      const check = AI_CHECKS[key];
      const state = check[ai[key]] || {
        status: "Unknown",
        notes: `Unrecognised value "${ai[key]}"`
      };
      const rating = STATUS_RATING[state.status] || "na";
      items.push({
        label: check.label,
        value: state.notes,
        rating,
        recommendation: rating !== "good" ? check.fix : void 0
      });
    } else if (AI_FACT_CHECKS[key]) {
      const check = AI_FACT_CHECKS[key];
      const { value, rating } = check.interpret(ai[key], pages);
      items.push({
        label: check.label,
        value,
        rating,
        recommendation: rating !== "good" ? check.fix : void 0
      });
    }
  }
  const issueCount = items.filter((i) => i.rating !== "good").length;
  s2.push({
    type: "sectionDivider",
    number: "04",
    title: "AI Readiness",
    description: "Whether AI systems, the crawlers behind ChatGPT, Claude, Perplexity and Google's AI features, can find, read and correctly interpret this site."
  });
  s2.push({ type: "heading", text: "AI Visibility Checks" });
  s2.push({
    type: "paragraph",
    text: issueCount === 0 ? "All AI readiness checks passed. The site is legible to AI crawlers and assistants." : `${issueCount} of ${items.length} checks need attention. AI systems may be missing or misreading parts of this site.`
  });
  if (ai.scores) {
    s2.push({
      type: "scorecard",
      items: Object.entries(ai.scores).filter(([, v]) => v != null).map(([key, v]) => ({
        label: AI_SCORE_LABELS[key] || AI_SCORE_LABELS[key.toLowerCase?.() ?? key] || key,
        score: v,
        max: 100,
        size: 72
      }))
    });
  }
  if (items.length) {
    s2.push({ type: "checks", items });
  }
  return s2;
};
function composeReport(data2) {
  if (data2.sections) return data2;
  const site = displaySite(data2.site);
  const brand = brandFromSite(data2.site);
  const date = todayLong();
  const reference = makeReference(brand, data2.brandCode);
  const GRADE_BANDS = [
    [90, "A"],
    [80, "B"],
    [70, "C"],
    [60, "D"],
    [0, "F"]
  ];
  const letterFor = (pct) => GRADE_BANDS.find(([min]) => pct >= min)[1];
  const captionFor = (pct) => pct >= 90 ? "This site is in excellent shape." : pct >= 75 ? "Solid foundations with clear room to improve." : pct >= 60 ? "This site needs attention in several areas." : "This site requires urgent work across multiple areas.";
  const RATING_POINTS = { good: 1, "needs-improvement": 0.5, poor: 0 };
  const STATUS_POINTS = { OK: 1, Issues: 0.5, Missing: 0 };
  const sectionPassRate = (blocks) => {
    let pts = 0;
    let n = 0;
    for (const b of blocks) {
      const items = b.items || b.rows || [];
      for (const it of items) {
        const p2 = RATING_POINTS[it.rating] ?? STATUS_POINTS[it.status] ?? null;
        if (p2 != null) {
          pts += p2;
          n += 1;
        }
      }
    }
    return n ? Math.round(pts / n * 100) : null;
  };
  const collectFindings = (sections2) => {
    const out2 = [];
    let where = "Overview";
    for (const b of sections2) {
      if (b.type === "sectionDivider") where = b.title;
      if (b.type === "checks")
        for (const it of b.items || []) {
          if (it.rating === "poor" || it.rating === "needs-improvement")
            out2.push({
              where,
              label: it.label,
              value: it.value,
              severity: it.rating === "poor" ? "High" : "Medium",
              action: it.recommendation
            });
        }
    }
    return out2.sort((a, b) => a.severity === b.severity ? 0 : a.severity === "High" ? -1 : 1);
  };
  const findingsDigest = (findings2) => {
    if (!findings2.length) return [];
    const high = findings2.filter((f) => f.severity === "High").length;
    const med = findings2.length - high;
    return [
      { type: "heading", text: "Findings by Severity" },
      {
        type: "paragraph",
        text: `${findings2.length} findings across the audit: ${high} high severity, ${med} medium. The most consequential first; every one is detailed, with its fix, in its own chapter.`
      },
      {
        type: "table",
        columns: ["Severity", "Finding", "Where"],
        rows: findings2.slice(0, 10).map((f) => [f.severity, `${f.label}: ${f.value}`, f.where])
      }
    ];
  };
  const actionPlan = (findings2) => {
    const actions = findings2.filter((f) => f.action);
    if (!actions.length) return [];
    return [
      {
        type: "sectionDivider",
        number: "08",
        title: "Priority Action Plan",
        description: "Every failing check's fix, ordered by severity. Work top to bottom: the high-severity items move the grades and the visitor experience most."
      },
      {
        type: "table",
        columns: ["#", "Priority", "Action", "Evidence"],
        rows: actions.slice(0, 14).map((f, i) => [String(i + 1), f.severity, f.action, `${f.where}: ${f.label} (${f.value})`])
      }
    ];
  };
  const computeGrades = (sections2, data3) => {
    const chapters = [];
    let current = null;
    for (const b of sections2) {
      if (b.type === "sectionDivider") {
        current = { title: b.title, blocks: [] };
        chapters.push(current);
      } else if (current) current.blocks.push(b);
    }
    const grades = [];
    for (const ch of chapters) {
      let pct;
      if (ch.title === "PageSpeed Insights") {
        const devs = ["mobile", "desktop"].map((d) => data3.pagespeed?.[d]?.scores?.performance ?? data3.pagespeed?.scores?.performance).filter((v) => v != null);
        pct = devs.length ? Math.round(devs.reduce((a, b) => a + b, 0) / devs.length) : null;
        if (pct != null) grades.push({ label: "Performance", grade: letterFor(pct), pct });
        continue;
      }
      pct = sectionPassRate(ch.blocks);
      if (pct != null) grades.push({ label: ch.title, grade: letterFor(pct), pct });
    }
    if (!grades.length) return null;
    const overallPct = Math.round(grades.reduce((a, g) => a + g.pct, 0) / grades.length);
    return [
      {
        type: "auditResults",
        banner: "Audit Results",
        overall: { grade: letterFor(overallPct), caption: captionFor(overallPct) },
        grades: grades.map(({ label, grade }) => ({ label, grade }))
      },
      grades.length >= 3 ? { type: "radar", items: grades.map(({ label, pct }) => ({ label, pct })) } : null
    ].filter(Boolean);
  };
  const sections = [
    { type: "heading", text: "Executive Summary" },
    { type: "paragraph", text: SUMMARY(site, "six") },
    ...pagespeedSections(data2.pagespeed, date),
    ...technicalSeoSections(data2.technicalSeo, data2.contentFreshness),
    ...onPageSeoSections(data2.onPageSeo, data2.technicalSeo?.pagesCrawled, data2.keywordFocus, data2.contentFreshness),
    ...aiReadinessSections(data2.aiReadiness, data2.technicalSeo?.pagesCrawled),
    ...accessibilitySections(data2.accessibility),
    ...technologySections(data2.technology, data2.domain),
    ...usabilitySections(data2.usability),
    ...keywordsSections(data2.keywords)
  ];
  const findings = collectFindings(sections);
  sections.push(...actionPlan(findings));
  const gradeBlocks = computeGrades(sections, data2);
  if (gradeBlocks) {
    sections.splice(2, 0, ...gradeBlocks, ...findingsDigest(findings));
    sections[1] = { type: "paragraph", text: SUMMARY(site, ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight"][gradeBlocks[0].grades.length] || gradeBlocks[0].grades.length, gradeBlocks[0].grades.map((g) => g.label)) };
  }
  return {
    meta: { title: REPORT_TYPE, subtitle: site, date, reference },
    cover: {
      reportType: REPORT_TYPE,
      title: site,
      subtitle: COVER_SUBTITLE,
      date,
      reference,
      preparedBy: PREPARED_BY,
      preparedFor: brand
    },
    sections
  };
}

// src/pdf/templates/ReportDocument.jsx
import { Document, Page as Page2, View as View22, Text as Text10 } from "@react-pdf/renderer";

// src/pdf/organisms/HeadingBlock.jsx
import { View as View7 } from "@react-pdf/renderer";

// src/pdf/atoms/Heading.jsx
import { Text } from "@react-pdf/renderer";

// src/pdf/tokens/global.js
var global = {
  /* =========================================
     PRIMITIVE TOKENS
  ========================================= */
  /* COLORS - scales, 50 (lightest) to 950 (darkest) */
  palette: {
    /* Purple - the brand scale, built around Primary Purple 900 */
    purple: {
      50: "#FAF8FC",
      /* Purple Frost   (was bgAlt) */
      100: "#F6F2F9",
      /* Purple Mist    (was primarySoft) */
      200: "#E9DCF2",
      /* Soft Purple */
      300: "#D9C7EA",
      /* Pale Purple    (was onPrimaryMuted) */
      400: "#C9AEDE",
      /* Muted Purple   (was primaryTint) */
      500: "#B795D1",
      /* Signal Purple  (was onPrimaryFaint) */
      600: "#9A63B8",
      /* Bright Purple */
      700: "#6D3396",
      /* Royal Purple   (was onPrimaryBorder) */
      800: "#571480",
      /* Deep Purple */
      900: "#460073",
      /* Primary Purple (the brand) */
      950: "#2E004C"
      /* Purple Abyss */
    },
    /* Neutral - text, borders, surfaces */
    neutral: {
      0: "#FFFFFF",
      /* White */
      50: "#FCFCFD",
      /* Frost White */
      100: "#F8F9FA",
      /* Cloud Surface */
      200: "#E0E0E0",
      /* Soft Smoke     (border) */
      300: "#C4CBD1",
      /* Mist Gray */
      400: "#9CA3AF",
      /* Muted Slate    (info badge) */
      500: "#888888",
      /* Balanced Slate (faint text) */
      600: "#555555",
      /* Steel Slate    (muted text) */
      700: "#3D444B",
      /* Deep Slate */
      800: "#2A3036",
      /* Graphite Surface */
      900: "#1A1A1A",
      /* Charcoal Ink   (text) */
      950: "#0E1114"
      /* Obsidian */
    },
    /* Success - greens; 400 is the Core Web Vitals green */
    success: {
      50: "#E7FAF1",
      /* Success Tint */
      100: "#C5F3DD",
      /* Soft Success */
      300: "#3FE39A",
      /* Fresh Success */
      400: "#0CCE6B",
      /* Success Green  (CWV good) */
      500: "#0AAD5A",
      /* Brand Success */
      700: "#076B38",
      /* Dark Success */
      900: "#03301A"
      /* Success Deep */
    },
    /* Warning - ambers; 400 is the CWV amber, 500 the severity amber */
    warning: {
      50: "#FFF6E8",
      /* Amber Tint */
      100: "#FFE9C7",
      /* Soft Amber */
      300: "#FFC163",
      /* Warm Amber */
      400: "#FFA400",
      /* Signal Amber   (CWV needs-improvement) */
      500: "#F59E0B",
      /* Brand Amber    (severity medium) */
      700: "#9A6206",
      /* Dark Amber */
      900: "#452C02"
      /* Ink Amber */
    },
    /* Reject - reds; 400 CWV poor, 500 severity high, 800 severity critical */
    reject: {
      50: "#FEF1F0",
      /* Reject Tint */
      100: "#FDDEDC",
      /* Soft Reject */
      300: "#FA8A82",
      /* Bright Reject */
      400: "#FF4E42",
      /* Reject Red     (CWV poor) */
      500: "#DC2626",
      /* Brand Reject   (severity high) */
      700: "#A31515",
      /* Dark Reject */
      800: "#7F1D1D",
      /* Ink Reject     (severity critical) */
      900: "#420404"
      /* Reject Deep */
    },
    /* Blue - informational; 400 is the severity-low blue */
    blue: {
      50: "#EFF6FF",
      /* Blue Tint */
      100: "#DBEAFE",
      /* Soft Blue */
      300: "#93C5FD",
      /* Sky Blue */
      400: "#3B82F6",
      /* Signal Blue    (severity low) */
      500: "#2563EB",
      /* Deep Blue */
      700: "#1E40AF",
      /* Dark Blue */
      900: "#172554"
      /* Blue Ink */
    }
  },
  /* TYPOGRAPHY - family names must match a Font.register in typography.js */
  fontFamilies: {
    heading: "Cabinet Grotesk",
    /* --ds-font-heading */
    sans: "Manrope",
    /* --ds-font-sans (body) */
    mono: "Geist Mono"
    /* --ds-font-mono */
  },
  /* FONT WEIGHTS - only regular and bold have registered files today;
     register more weights in typography.js before using the others */
  fontWeights: {
    air: 100,
    thin: 200,
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900
  },
  /* FONT SIZE SCALE (points) */
  fontSizeScale: {
    xs: 7.5,
    sm: 8,
    base: 9,
    md: 9.5,
    lg: 10,
    xl: 12,
    "2xl": 13,
    "3xl": 20,
    "4xl": 22,
    "5xl": 30,
    display: 40
  },
  /* LINE HEIGHTS (unitless multipliers) */
  lineHeightScale: { tight: 1.1, normal: 1.4, relaxed: 1.5 },
  /* LETTER SPACING (points) */
  letterSpacingScale: { normal: 0, wide: 0.5, wider: 1, widest: 2 },
  /* SPACING (points) - ds-style ladder */
  spaceScale: {
    xxxs: 1,
    xxs: 2,
    xs: 4,
    sm: 6,
    md: 8,
    lg: 10,
    xl: 12,
    "2xl": 16,
    "3xl": 20,
    "4xl": 24,
    "5xl": 32,
    "6xl": 48,
    "7xl": 56,
    "8xl": 64
  },
  /* RADIUS (points) */
  radiusScale: {
    none: 0,
    sm: 3,
    md: 4,
    xl: 12,
    full: 999
  },
  /* BORDERS (points) */
  borderScale: { hairline: 1, thick: 2, heavy: 3 },
  /* PAGE FRAME (points) - PDF-specific, no web equivalent */
  pageFrame: {
    paddingTop: 48,
    paddingBottom: 56,
    paddingHorizontal: 48,
    footerBottom: 24
  }
};

// src/pdf/tokens/colors.js
var p = global.palette;
var colors = {
  /* BACKGROUNDS */
  bg: p.neutral[0],
  surface: p.purple[100],
  /* tinted boxes (was primarySoft) */
  surfaceSoft: p.purple[50],
  /* alternating table rows (was bgAlt) */
  /* TEXT */
  text: p.neutral[900],
  textMuted: p.neutral[600],
  textFaint: p.neutral[500],
  textInverse: p.neutral[0],
  /* BORDERS */
  border: p.neutral[200],
  /* PRIMARY */
  primary: p.purple[900],
  primarySoft: p.purple[100],
  primaryTint: p.purple[400],
  accent: p.purple[400],
  primaryForeground: p.neutral[0],
  /* ON-PRIMARY (cover surface) */
  onPrimary: p.neutral[0],
  onPrimaryMuted: p.purple[300],
  onPrimaryFaint: p.purple[500],
  onPrimaryBorder: p.purple[700],
  onPrimaryDanger: p.reject[300],
  /* kept for backwards compatibility with existing components */
  white: p.neutral[0],
  bgAlt: p.purple[50]
};
var severityColors = {
  critical: { bg: p.reject[800], text: p.neutral[0] },
  high: { bg: p.reject[500], text: p.neutral[0] },
  medium: { bg: p.warning[500], text: p.neutral[900] },
  low: { bg: p.blue[400], text: p.neutral[0] },
  info: { bg: p.neutral[400], text: p.neutral[0] }
};
var ratingColors = {
  good: { color: p.success[400], label: "Good" },
  "needs-improvement": { color: p.warning[400], label: "Needs Improvement" },
  poor: { color: p.reject[400], label: "Poor" },
  na: { color: p.neutral[400], label: "N/A" }
};
var ratingColor = (rating) => (ratingColors[rating] || ratingColors.na).color;
var gradeMap = {
  A: p.success[400],
  B: p.success[500],
  C: p.warning[400],
  D: p.warning[500],
  F: p.reject[500]
};
var gradeColor = (grade) => gradeMap[String(grade).trim().charAt(0).toUpperCase()] || p.neutral[400];
var scoreColor = (score, max = 100) => {
  const pct = score / max * 100;
  if (pct >= 90) return p.success[400];
  if (pct >= 50) return p.warning[400];
  return p.reject[400];
};

// src/pdf/tokens/typography.js
import { Font } from "@react-pdf/renderer";

// src/pdf/fonts/Manrope-Regular.ttf
var Manrope_Regular_default = "./Manrope-Regular.ttf";

// src/pdf/fonts/Manrope-Bold.ttf
var Manrope_Bold_default = "./Manrope-Bold.ttf";

// src/pdf/fonts/GeistMono-Regular.ttf
var GeistMono_Regular_default = "./GeistMono-Regular.ttf";

// src/pdf/fonts/CabinetGrotesk-Extrabold.ttf
var CabinetGrotesk_Extrabold_default = "./CabinetGrotesk-Extrabold.ttf";

// src/pdf/tokens/typography.js
var W = global.fontWeights;
Font.register({
  family: global.fontFamilies.sans,
  fonts: [
    { src: Manrope_Regular_default, fontWeight: W.regular },
    { src: Manrope_Bold_default, fontWeight: W.bold }
  ]
});
Font.register({
  family: global.fontFamilies.mono,
  fonts: [{ src: GeistMono_Regular_default, fontWeight: W.regular }]
});
Font.register({
  family: global.fontFamilies.heading,
  fonts: [{ src: CabinetGrotesk_Extrabold_default, fontWeight: W.bold }]
});
Font.registerHyphenationCallback((word) => [word]);
var fonts = {
  heading: global.fontFamilies.heading,
  sans: global.fontFamilies.sans,
  body: global.fontFamilies.sans,
  mono: global.fontFamilies.mono
};
var fontWeights = global.fontWeights;
var fontSizes = global.fontSizeScale;
var lineHeights = global.lineHeightScale;
var letterSpacing = global.letterSpacingScale;
var DEFAULT_FONTS = {
  heading: global.fontFamilies.heading,
  sans: global.fontFamilies.sans
};

// src/pdf/tokens/spacing.js
var s = global.spaceScale;
var space = {
  xxs: s.xxs,
  /* 2 */
  xs: s.xs,
  /* 4 */
  sm: s.sm,
  /* 6 */
  md: s.md,
  /* 8 */
  lg: s.lg,
  /* 10 */
  xl: s.xl,
  /* 12 */
  "2xl": s["2xl"],
  /* 16 */
  "3xl": s["3xl"],
  /* 20 */
  "4xl": s["6xl"],
  /* 48 - page-level gap */
  "5xl": s["7xl"]
  /* 56 - cover padding */
};
var radii = {
  sm: global.radiusScale.sm,
  md: global.radiusScale.md,
  full: global.radiusScale.full
};
var borders = global.borderScale;
var page = global.pageFrame;

// src/pdf/atoms/Heading.jsx
import { jsx } from "react/jsx-runtime";
var Heading = ({ children, size = "2xl", color = colors.primary, style }) => /* @__PURE__ */ jsx(
  Text,
  {
    style: [
      { fontFamily: fonts.heading, fontWeight: 700, fontSize: fontSizes[size], color },
      style
    ],
    children
  }
);

// src/pdf/atoms/Body.jsx
import { Text as Text2 } from "@react-pdf/renderer";
import { jsx as jsx2 } from "react/jsx-runtime";
var Body = ({ children, size = "lg", bold = false, color = colors.text, style }) => /* @__PURE__ */ jsx2(
  Text2,
  {
    style: [
      {
        fontFamily: fonts.body,
        fontWeight: bold ? 700 : 400,
        fontSize: fontSizes[size],
        lineHeight: lineHeights.normal,
        color
      },
      style
    ],
    children
  }
);

// src/pdf/atoms/Mono.jsx
import { Text as Text3 } from "@react-pdf/renderer";
import { jsx as jsx3 } from "react/jsx-runtime";
var Mono = ({ children, size = "sm", color = colors.textFaint, style }) => /* @__PURE__ */ jsx3(Text3, { style: [{ fontFamily: fonts.mono, fontSize: fontSizes[size], color }, style], children });

// src/pdf/atoms/Label.jsx
import { Text as Text4 } from "@react-pdf/renderer";
import { jsx as jsx4 } from "react/jsx-runtime";
var Label = ({ children, color = colors.textMuted, style }) => /* @__PURE__ */ jsx4(
  Text4,
  {
    style: [
      {
        fontFamily: fonts.body,
        fontWeight: 700,
        fontSize: fontSizes.sm + 1,
        textTransform: "uppercase",
        letterSpacing: letterSpacing.wide,
        color
      },
      style
    ],
    children
  }
);
var Label_default = Label;

// src/pdf/atoms/SeverityBadge.jsx
import { View, Text as Text5 } from "@react-pdf/renderer";
import { jsx as jsx5 } from "react/jsx-runtime";
var SeverityBadge = ({ severity }) => {
  const palette = severityColors[severity] || severityColors.info;
  return /* @__PURE__ */ jsx5(
    View,
    {
      style: {
        backgroundColor: palette.bg,
        borderRadius: radii.sm,
        paddingVertical: space.xxs,
        paddingHorizontal: space.sm
      },
      children: /* @__PURE__ */ jsx5(
        Text5,
        {
          style: {
            fontFamily: fonts.body,
            fontWeight: 700,
            fontSize: fontSizes.xs,
            textTransform: "uppercase",
            letterSpacing: letterSpacing.wide,
            color: palette.text
          },
          children: severity
        }
      )
    }
  );
};

// src/pdf/atoms/RatingDot.jsx
import { View as View2 } from "@react-pdf/renderer";
import { jsx as jsx6 } from "react/jsx-runtime";
var RatingDot = ({ rating }) => {
  const r = ratingColors[rating] || ratingColors.na;
  return /* @__PURE__ */ jsx6(
    View2,
    {
      style: {
        width: 7,
        height: 7,
        borderRadius: 3.5,
        marginRight: space.sm,
        backgroundColor: r.color
      }
    }
  );
};

// src/pdf/atoms/ScoreCircle.jsx
import { View as View3, Text as Text6, Svg, Path } from "@react-pdf/renderer";
import { jsx as jsx7, jsxs } from "react/jsx-runtime";
var arcPath = (cx, cy, r, startAngle, endAngle) => {
  const rad = (deg) => (deg - 90) * Math.PI / 180;
  const x1 = cx + r * Math.cos(rad(startAngle));
  const y1 = cy + r * Math.sin(rad(startAngle));
  const x2 = cx + r * Math.cos(rad(endAngle));
  const y2 = cy + r * Math.sin(rad(endAngle));
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
};
var ScoreCircle = ({
  score,
  max = 100,
  display,
  size = 52,
  color,
  progress,
  trackColor = colors.border
}) => {
  const ringColor = color ?? scoreColor(score, max);
  const stroke = Math.max(2, Math.round(size * 0.06));
  const r = (size - stroke) / 2;
  const c = size / 2;
  const numeric = typeof score === "number" && typeof max === "number" && max > 0;
  let frac = progress ?? (numeric ? score / max : 1);
  frac = Math.min(1, Math.max(0, frac));
  return /* @__PURE__ */ jsxs(View3, { style: { width: size, height: size, position: "relative" }, children: [
    /* @__PURE__ */ jsxs(Svg, { width: size, height: size, viewBox: `0 0 ${size} ${size}`, children: [
      frac < 1 && /* @__PURE__ */ jsx7(
        Path,
        {
          d: arcPath(c, c, r, 0, 359.99),
          stroke: trackColor,
          strokeWidth: stroke,
          fill: "none"
        }
      ),
      frac > 0 && (frac >= 1 ? /* @__PURE__ */ jsx7(
        Path,
        {
          d: arcPath(c, c, r, 0, 359.99),
          stroke: ringColor,
          strokeWidth: stroke,
          fill: "none"
        }
      ) : /* @__PURE__ */ jsx7(
        Path,
        {
          d: arcPath(c, c, r, 0, frac * 360),
          stroke: ringColor,
          strokeWidth: stroke,
          strokeLineCap: "round",
          fill: "none"
        }
      ))
    ] }),
    /* @__PURE__ */ jsx7(
      View3,
      {
        style: {
          position: "absolute",
          top: 0,
          left: 0,
          width: size,
          height: size,
          alignItems: "center",
          justifyContent: "center"
        },
        children: /* @__PURE__ */ jsx7(Text6, { style: { fontFamily: fonts.mono, fontSize: size * 0.26, color: ringColor }, children: display ?? score })
      }
    )
  ] });
};

// src/pdf/atoms/TintedBox.jsx
import { View as View4 } from "@react-pdf/renderer";
import { jsx as jsx8 } from "react/jsx-runtime";
var TintedBox = ({ children, style }) => /* @__PURE__ */ jsx8(
  View4,
  {
    wrap: false,
    style: [
      {
        backgroundColor: colors.primarySoft,
        borderRadius: radii.md,
        padding: space.xl,
        marginBottom: space.lg
      },
      style
    ],
    children
  }
);

// src/pdf/atoms/Card.jsx
import { View as View5 } from "@react-pdf/renderer";
import { jsx as jsx9 } from "react/jsx-runtime";
var Card = ({ children, style }) => /* @__PURE__ */ jsx9(
  View5,
  {
    wrap: false,
    style: [
      {
        borderWidth: borders.hairline,
        borderColor: colors.border,
        borderRadius: radii.md,
        padding: space.lg,
        marginBottom: space.md
      },
      style
    ],
    children
  }
);

// src/pdf/atoms/Banner.jsx
import { View as View6 } from "@react-pdf/renderer";
import { jsx as jsx10 } from "react/jsx-runtime";
var Banner = ({ children, color = colors.primary, textColor = colors.onPrimary }) => /* @__PURE__ */ jsx10(
  View6,
  {
    style: {
      backgroundColor: color,
      borderRadius: radii.md,
      paddingVertical: space.md,
      paddingHorizontal: space.xl,
      marginTop: space.lg,
      marginBottom: space["2xl"]
    },
    children: /* @__PURE__ */ jsx10(Label_default, { color: textColor, style: { fontSize: fontSizes.md + 1.5 }, children })
  }
);

// src/pdf/atoms/StatusIcon.jsx
import { Svg as Svg2, Path as Path2, Circle } from "@react-pdf/renderer";
import { Fragment, jsx as jsx11, jsxs as jsxs2 } from "react/jsx-runtime";
var GLYPHS = {
  good: (s2) => /* @__PURE__ */ jsx11(Path2, { d: `M ${s2 * 0.28} ${s2 * 0.52} L ${s2 * 0.44} ${s2 * 0.68} L ${s2 * 0.73} ${s2 * 0.34}`, stroke: "#fff", strokeWidth: s2 * 0.09, strokeLineCap: "round", fill: "none" }),
  "needs-improvement": (s2) => /* @__PURE__ */ jsxs2(Fragment, { children: [
    /* @__PURE__ */ jsx11(Path2, { d: `M ${s2 * 0.5} ${s2 * 0.26} L ${s2 * 0.5} ${s2 * 0.58}`, stroke: "#fff", strokeWidth: s2 * 0.1, strokeLineCap: "round" }),
    /* @__PURE__ */ jsx11(Circle, { cx: s2 * 0.5, cy: s2 * 0.74, r: s2 * 0.055, fill: "#fff" })
  ] }),
  poor: (s2) => /* @__PURE__ */ jsxs2(Fragment, { children: [
    /* @__PURE__ */ jsx11(Path2, { d: `M ${s2 * 0.34} ${s2 * 0.34} L ${s2 * 0.66} ${s2 * 0.66}`, stroke: "#fff", strokeWidth: s2 * 0.09, strokeLineCap: "round" }),
    /* @__PURE__ */ jsx11(Path2, { d: `M ${s2 * 0.66} ${s2 * 0.34} L ${s2 * 0.34} ${s2 * 0.66}`, stroke: "#fff", strokeWidth: s2 * 0.09, strokeLineCap: "round" })
  ] }),
  na: (s2) => /* @__PURE__ */ jsx11(Path2, { d: `M ${s2 * 0.32} ${s2 * 0.5} L ${s2 * 0.68} ${s2 * 0.5}`, stroke: "#fff", strokeWidth: s2 * 0.09, strokeLineCap: "round" })
};
var StatusIcon = ({ rating, size = 16 }) => {
  const r = ratingColors[rating] || ratingColors.na;
  const glyph = GLYPHS[rating] || GLYPHS.na;
  return /* @__PURE__ */ jsxs2(Svg2, { width: size, height: size, viewBox: `0 0 ${size} ${size}`, children: [
    /* @__PURE__ */ jsx11(Circle, { cx: size / 2, cy: size / 2, r: size / 2, fill: r.color }),
    glyph(size)
  ] });
};

// src/pdf/organisms/HeadingBlock.jsx
import { jsx as jsx12 } from "react/jsx-runtime";
var HeadingBlock = ({ text }) => /* @__PURE__ */ jsx12(View7, { minPresenceAhead: 140, children: /* @__PURE__ */ jsx12(Heading, { style: { marginTop: space["2xl"], marginBottom: space.sm }, children: text }) });

// src/pdf/organisms/ParagraphBlock.jsx
import { jsx as jsx13 } from "react/jsx-runtime";
var ParagraphBlock = ({ text }) => /* @__PURE__ */ jsx13(Body, { style: { marginBottom: space.md }, children: text });

// src/pdf/molecules/MetricRow.jsx
import { View as View8 } from "@react-pdf/renderer";
import { jsx as jsx14, jsxs as jsxs3 } from "react/jsx-runtime";
var MetricRow = ({ label, value, rating }) => /* @__PURE__ */ jsxs3(
  View8,
  {
    style: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: space.xs + 1
    },
    children: [
      /* @__PURE__ */ jsxs3(View8, { style: { flexDirection: "row", alignItems: "center", flex: 1, paddingRight: space.md }, children: [
        /* @__PURE__ */ jsx14(RatingDot, { rating }),
        /* @__PURE__ */ jsx14(Body, { size: "md", children: label })
      ] }),
      /* @__PURE__ */ jsx14(Mono, { size: "lg", color: ratingColor(rating), children: value })
    ]
  }
);

// src/pdf/molecules/KeyValueRow.jsx
import { View as View9 } from "@react-pdf/renderer";
import { jsx as jsx15, jsxs as jsxs4 } from "react/jsx-runtime";
var KeyValueRow = ({ label, value }) => /* @__PURE__ */ jsxs4(View9, { style: { flexDirection: "row", marginBottom: space.xs }, children: [
  /* @__PURE__ */ jsx15(Body, { bold: true, color: colors.primary, style: { width: 90 }, children: label }),
  /* @__PURE__ */ jsx15(Body, { style: { flex: 1 }, children: value })
] });

// src/pdf/molecules/ScoreItem.jsx
import { View as View10 } from "@react-pdf/renderer";
import { jsx as jsx16, jsxs as jsxs5 } from "react/jsx-runtime";
var ScoreItem = ({ label, score, max, display, size }) => /* @__PURE__ */ jsxs5(View10, { style: { flex: 1, alignItems: "center", paddingHorizontal: space.xs }, children: [
  /* @__PURE__ */ jsx16(ScoreCircle, { score, max, display, size }),
  /* @__PURE__ */ jsx16(Body, { size: "sm", color: colors.textMuted, style: { marginTop: space.xs + 1, textAlign: "center" }, children: label })
] });

// src/pdf/molecules/GradeItem.jsx
import { View as View11 } from "@react-pdf/renderer";
import { jsx as jsx17, jsxs as jsxs6 } from "react/jsx-runtime";
var GradeItem = ({ label, grade, size = 44 }) => /* @__PURE__ */ jsxs6(View11, { style: { flex: 1, alignItems: "center", paddingHorizontal: space.xs }, children: [
  /* @__PURE__ */ jsx17(ScoreCircle, { display: grade, color: gradeColor(grade), size }),
  /* @__PURE__ */ jsx17(Body, { size: "sm", color: colors.textMuted, style: { marginTop: space.xs + 1, textAlign: "center" }, children: label })
] });

// src/pdf/molecules/FindingCard.jsx
import { View as View12 } from "@react-pdf/renderer";
import { jsx as jsx18, jsxs as jsxs7 } from "react/jsx-runtime";
var FindingCard = ({ finding }) => /* @__PURE__ */ jsxs7(Card, { children: [
  /* @__PURE__ */ jsxs7(
    View12,
    {
      style: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: space.xs
      },
      children: [
        /* @__PURE__ */ jsxs7(View12, { style: { flex: 1, paddingRight: space.md }, children: [
          finding.id && /* @__PURE__ */ jsx18(Mono, { style: { marginBottom: 1 }, children: finding.id }),
          /* @__PURE__ */ jsx18(Heading, { size: "lg", color: colors.text, style: { fontSize: fontSizes.lg + 0.5 }, children: finding.title })
        ] }),
        /* @__PURE__ */ jsx18(SeverityBadge, { severity: finding.severity })
      ]
    }
  ),
  finding.category && /* @__PURE__ */ jsx18(Body, { size: "sm", bold: true, color: colors.primary, style: { marginBottom: space.xxs + 1 }, children: finding.category }),
  finding.description && /* @__PURE__ */ jsx18(Body, { size: "base", style: { marginBottom: space.xxs + 1 }, children: finding.description }),
  finding.impact && /* @__PURE__ */ jsxs7(Body, { size: "base", style: { marginBottom: space.xxs + 1 }, children: [
    /* @__PURE__ */ jsx18(Body, { size: "sm", bold: true, color: colors.textMuted, children: "Impact: " }),
    finding.impact
  ] }),
  finding.recommendation && /* @__PURE__ */ jsxs7(Body, { size: "base", children: [
    /* @__PURE__ */ jsx18(Body, { size: "sm", bold: true, color: colors.textMuted, children: "Recommendation: " }),
    finding.recommendation
  ] })
] });

// src/pdf/molecules/CheckCard.jsx
import { View as View13 } from "@react-pdf/renderer";
import { jsx as jsx19, jsxs as jsxs8 } from "react/jsx-runtime";
var CheckCard = ({ check }) => /* @__PURE__ */ jsx19(Card, { style: { marginBottom: space.sm }, children: /* @__PURE__ */ jsxs8(View13, { style: { flexDirection: "row", alignItems: "flex-start" }, children: [
  /* @__PURE__ */ jsx19(View13, { style: { marginRight: space.md, marginTop: 1 }, children: /* @__PURE__ */ jsx19(StatusIcon, { rating: check.rating }) }),
  /* @__PURE__ */ jsxs8(View13, { style: { flex: 1 }, children: [
    /* @__PURE__ */ jsxs8(View13, { style: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }, children: [
      /* @__PURE__ */ jsx19(Body, { bold: true, children: check.label }),
      check.value && /* @__PURE__ */ jsx19(Body, { size: "sm", color: colors.textMuted, style: { textAlign: "right", maxWidth: 220 }, children: check.value })
    ] }),
    check.recommendation && /* @__PURE__ */ jsx19(Body, { size: "base", color: colors.textMuted, style: { marginTop: space.xxs + 1 }, children: check.recommendation })
  ] })
] }) });

// src/pdf/organisms/KeyValueBlock.jsx
import { jsx as jsx20 } from "react/jsx-runtime";
var KeyValueBlock = ({ items = [] }) => /* @__PURE__ */ jsx20(TintedBox, { children: items.map((item, i) => /* @__PURE__ */ jsx20(KeyValueRow, { label: item.label, value: item.value }, i)) });

// src/pdf/organisms/MetricsBlock.jsx
import { jsx as jsx21, jsxs as jsxs9 } from "react/jsx-runtime";
var MetricsBlock = ({ title, items = [] }) => /* @__PURE__ */ jsxs9(TintedBox, { children: [
  title && /* @__PURE__ */ jsx21(Label, { style: { marginBottom: space.md }, children: title }),
  items.map((item, i) => /* @__PURE__ */ jsx21(MetricRow, { ...item }, i))
] });

// src/pdf/organisms/ScorecardBlock.jsx
import { View as View14 } from "@react-pdf/renderer";
import { jsx as jsx22 } from "react/jsx-runtime";
var ScorecardBlock = ({ items = [] }) => /* @__PURE__ */ jsx22(
  View14,
  {
    wrap: false,
    style: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: space.xxs,
      marginBottom: space.xl
    },
    children: items.map((item, i) => /* @__PURE__ */ jsx22(ScoreItem, { ...item }, i))
  }
);

// src/pdf/organisms/FindingsBlock.jsx
import { View as View15 } from "@react-pdf/renderer";
import { jsx as jsx23 } from "react/jsx-runtime";
var FindingsBlock = ({ items = [] }) => /* @__PURE__ */ jsx23(View15, { children: items.map((finding, i) => /* @__PURE__ */ jsx23(FindingCard, { finding }, finding.id || i)) });

// src/pdf/organisms/TableBlock.jsx
import { View as View16, Text as Text7 } from "@react-pdf/renderer";
import { jsx as jsx24, jsxs as jsxs10 } from "react/jsx-runtime";
var TableBlock = ({ columns = [], rows = [] }) => /* @__PURE__ */ jsxs10(View16, { style: { marginBottom: space.lg }, children: [
  /* @__PURE__ */ jsx24(View16, { style: { flexDirection: "row", backgroundColor: colors.primary }, fixed: true, children: columns.map((col, i) => /* @__PURE__ */ jsx24(
    Text7,
    {
      style: {
        flex: 1,
        padding: space.sm,
        color: colors.onPrimary,
        fontFamily: fonts.body,
        fontWeight: 700,
        fontSize: fontSizes.base
      },
      children: col
    },
    i
  )) }),
  rows.map((row, ri) => /* @__PURE__ */ jsx24(
    View16,
    {
      wrap: false,
      style: {
        flexDirection: "row",
        borderBottomWidth: borders.hairline,
        borderBottomColor: colors.border,
        backgroundColor: ri % 2 === 1 ? colors.bgAlt : void 0
      },
      children: row.map((cell, ci) => /* @__PURE__ */ jsx24(
        Text7,
        {
          style: { flex: 1, padding: space.sm, fontFamily: fonts.body, fontSize: fontSizes.base },
          children: cell
        },
        ci
      ))
    },
    ri
  ))
] });

// src/pdf/organisms/SectionDividerBlock.jsx
import { View as View17, Text as Text8 } from "@react-pdf/renderer";
import { jsx as jsx25, jsxs as jsxs11 } from "react/jsx-runtime";
var SectionDividerBlock = ({ number, title, description }) => /* @__PURE__ */ jsxs11(View17, { style: { marginBottom: space["2xl"] + 2 }, break: true, children: [
  /* @__PURE__ */ jsxs11(
    View17,
    {
      style: {
        flexDirection: "row",
        alignItems: "flex-end",
        borderBottomWidth: borders.thick,
        borderBottomColor: colors.primary,
        paddingBottom: space.lg,
        marginBottom: space.lg
      },
      children: [
        number && /* @__PURE__ */ jsx25(
          Text8,
          {
            style: {
              fontFamily: fonts.mono,
              fontSize: fontSizes["5xl"],
              color: colors.accent,
              marginRight: space.xl
            },
            children: number
          }
        ),
        /* @__PURE__ */ jsx25(Heading, { size: "4xl", children: title })
      ]
    }
  ),
  description && /* @__PURE__ */ jsx25(Body, { color: colors.textMuted, style: { maxWidth: 420 }, children: description })
] });

// src/pdf/organisms/AuditResultsBlock.jsx
import { View as View18 } from "@react-pdf/renderer";
import { jsx as jsx26, jsxs as jsxs12 } from "react/jsx-runtime";
var AuditResultsBlock = ({ banner, overall, grades = [] }) => /* @__PURE__ */ jsxs12(View18, { wrap: false, children: [
  banner && /* @__PURE__ */ jsx26(Banner, { children: banner }),
  overall && /* @__PURE__ */ jsxs12(View18, { style: { alignItems: "center", marginBottom: space["2xl"] }, children: [
    /* @__PURE__ */ jsx26(ScoreCircle, { display: overall.grade, color: gradeColor(overall.grade), size: 90 }),
    overall.caption && /* @__PURE__ */ jsx26(Heading, { size: "2xl", color: colors.text, style: { marginTop: space.lg }, children: overall.caption })
  ] }),
  grades.length > 0 && /* @__PURE__ */ jsx26(View18, { style: { flexDirection: "row", justifyContent: "space-between", marginBottom: space.xl }, children: grades.map((g, i) => /* @__PURE__ */ jsx26(GradeItem, { ...g }, i)) })
] });

// src/pdf/organisms/RadarBlock.jsx
import { View as View19, Svg as Svg3, Polygon, Line, Text as SvgText } from "@react-pdf/renderer";
import { jsx as jsx27, jsxs as jsxs13 } from "react/jsx-runtime";
var W2 = 380;
var H = 262;
var CX = W2 / 2;
var CY = H / 2;
var R = 78;
var point = (i, n, r) => {
  const angle = Math.PI * 2 * i / n - Math.PI / 2;
  return [CX + r * Math.cos(angle), CY + r * Math.sin(angle)];
};
var ring = (n, frac) => Array.from({ length: n }, (_, i) => point(i, n, R * frac).map((v) => v.toFixed(1)).join(",")).join(" ");
var RadarBlock = ({ items = [] }) => {
  if (items.length < 3) return null;
  const n = items.length;
  const dataPoints = items.map((it, i) => point(i, n, R * Math.max(0, Math.min(100, it.pct)) / 100)).map((p2) => p2.map((v) => v.toFixed(1)).join(",")).join(" ");
  return /* @__PURE__ */ jsx27(View19, { wrap: false, style: { alignItems: "center", marginTop: space.md, height: H + 8 }, children: /* @__PURE__ */ jsxs13(Svg3, { width: W2, height: H, viewBox: `0 0 ${W2} ${H}`, children: [
    [0.25, 0.5, 0.75, 1].map((f) => /* @__PURE__ */ jsx27(Polygon, { points: ring(n, f), fill: "none", stroke: colors.border, strokeWidth: f === 1 ? 1 : 0.6, strokeDasharray: "3 3" }, f)),
    items.map((_, i) => {
      const [x, y] = point(i, n, R);
      return /* @__PURE__ */ jsx27(Line, { x1: CX, y1: CY, x2: x, y2: y, stroke: colors.border, strokeWidth: 0.6, strokeDasharray: "3 3" }, i);
    }),
    /* @__PURE__ */ jsx27(Polygon, { points: dataPoints, fill: colors.primarySoft, fillOpacity: 0.7, stroke: colors.primary, strokeWidth: 2 }),
    items.map((it, i) => {
      const [x, y] = point(i, n, R * Math.max(0, Math.min(100, it.pct)) / 100);
      return /* @__PURE__ */ jsx27(Polygon, { points: `${x - 2.6},${y} ${x},${y - 2.6} ${x + 2.6},${y} ${x},${y + 2.6}`, fill: colors.primary }, i);
    }),
    items.map((it, i) => {
      const [x, y] = point(i, n, R + 14);
      const anchor = Math.abs(x - CX) < 8 ? "middle" : x < CX ? "end" : "start";
      return /* @__PURE__ */ jsx27(SvgText, { x, y: y + 3, textAnchor: anchor, style: { fontFamily: fonts.body, fontSize: fontSizes.xs, fill: colors.textMuted }, children: it.label }, i);
    })
  ] }) });
};

// src/pdf/organisms/ChecksBlock.jsx
import { View as View20 } from "@react-pdf/renderer";
import { jsx as jsx28 } from "react/jsx-runtime";
var ChecksBlock = ({ items = [] }) => /* @__PURE__ */ jsx28(View20, { children: items.map((check, i) => /* @__PURE__ */ jsx28(CheckCard, { check }, i)) });

// src/pdf/organisms/index.js
var blockMap = {
  heading: HeadingBlock,
  paragraph: ParagraphBlock,
  keyValue: KeyValueBlock,
  metrics: MetricsBlock,
  scorecard: ScorecardBlock,
  findings: FindingsBlock,
  table: TableBlock,
  sectionDivider: SectionDividerBlock,
  auditResults: AuditResultsBlock,
  radar: RadarBlock,
  checks: ChecksBlock
};

// src/pdf/templates/CoverPage.jsx
import { Page, View as View21, Text as Text9 } from "@react-pdf/renderer";
import { jsx as jsx29, jsxs as jsxs14 } from "react/jsx-runtime";
var MetaItem = ({ label, value, mono }) => value ? /* @__PURE__ */ jsxs14(View21, { style: { flex: 1, paddingRight: space.xl }, children: [
  /* @__PURE__ */ jsx29(
    Label,
    {
      color: colors.onPrimaryFaint,
      style: { fontSize: fontSizes.xs, letterSpacing: letterSpacing.wider, marginBottom: space.xxs + 1 },
      children: label
    }
  ),
  mono ? /* @__PURE__ */ jsx29(Mono, { size: "md", color: colors.onPrimary, children: value }) : /* @__PURE__ */ jsx29(Body, { size: "md", color: colors.onPrimary, children: value })
] }) : null;
var CoverPage = ({ cover }) => /* @__PURE__ */ jsxs14(
  Page,
  {
    size: "A4",
    style: {
      backgroundColor: colors.primary,
      padding: space["5xl"],
      flexDirection: "column",
      justifyContent: "space-between"
    },
    children: [
      /* @__PURE__ */ jsxs14(View21, { children: [
        /* @__PURE__ */ jsx29(View21, { style: { borderTopWidth: borders.thick, borderTopColor: colors.onPrimary, width: 64 } }),
        /* @__PURE__ */ jsx29(
          Text9,
          {
            style: {
              fontFamily: fonts.body,
              fontWeight: 700,
              fontSize: fontSizes.md + 1.5,
              textTransform: "uppercase",
              letterSpacing: letterSpacing.widest,
              color: colors.onPrimaryMuted,
              marginTop: space["2xl"] - 2
            },
            children: cover.reportType || "Audit Report"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs14(View21, { style: { marginTop: -40 }, children: [
        /* @__PURE__ */ jsx29(Heading, { size: "display", color: colors.onPrimary, style: { lineHeight: lineHeights.tight }, children: cover.title }),
        cover.subtitle && /* @__PURE__ */ jsx29(
          Body,
          {
            size: "xl",
            color: colors.onPrimaryMuted,
            style: { marginTop: space.lg, maxWidth: 380 },
            children: cover.subtitle
          }
        )
      ] }),
      /* @__PURE__ */ jsxs14(
        View21,
        {
          style: {
            flexDirection: "row",
            borderTopWidth: borders.hairline,
            borderTopColor: colors.onPrimaryBorder,
            paddingTop: space["2xl"]
          },
          children: [
            /* @__PURE__ */ jsx29(MetaItem, { label: "Date", value: cover.date }),
            /* @__PURE__ */ jsx29(MetaItem, { label: "Reference", value: cover.reference, mono: true }),
            /* @__PURE__ */ jsx29(MetaItem, { label: "Prepared by", value: cover.preparedBy }),
            /* @__PURE__ */ jsx29(MetaItem, { label: "Prepared for", value: cover.preparedFor })
          ]
        }
      )
    ]
  }
);
var CoverPage_default = CoverPage;

// src/pdf/templates/ReportDocument.jsx
import { jsx as jsx30, jsxs as jsxs15 } from "react/jsx-runtime";
var SectionRenderer = ({ section }) => {
  const Block = blockMap[section.type];
  if (!Block) return null;
  return /* @__PURE__ */ jsx30(Block, { ...section });
};
var ReportDocument = ({ data: data2 }) => /* @__PURE__ */ jsxs15(Document, { title: data2.meta.title, children: [
  data2.cover && /* @__PURE__ */ jsx30(CoverPage_default, { cover: data2.cover }),
  /* @__PURE__ */ jsxs15(
    Page2,
    {
      size: "A4",
      style: {
        paddingTop: page.paddingTop,
        paddingBottom: page.paddingBottom,
        paddingHorizontal: page.paddingHorizontal,
        fontSize: fontSizes.lg,
        fontFamily: fonts.body,
        color: colors.text
      },
      children: [
        /* @__PURE__ */ jsxs15(
          View22,
          {
            style: {
              borderBottomWidth: borders.thick,
              borderBottomColor: colors.primary,
              paddingBottom: space.xl,
              marginBottom: space["3xl"]
            },
            children: [
              /* @__PURE__ */ jsx30(Heading, { size: "3xl", children: data2.meta.title }),
              data2.meta.subtitle && /* @__PURE__ */ jsx30(Body, { size: "xl", color: colors.textMuted, style: { marginTop: space.xxs }, children: data2.meta.subtitle }),
              /* @__PURE__ */ jsxs15(View22, { style: { flexDirection: "row", justifyContent: "space-between", marginTop: space.md }, children: [
                /* @__PURE__ */ jsx30(Body, { size: "sm", color: colors.textFaint, children: data2.meta.date }),
                data2.meta.reference && /* @__PURE__ */ jsxs15(Mono, { children: [
                  "Ref: ",
                  data2.meta.reference
                ] })
              ] })
            ]
          }
        ),
        data2.sections.map((section, i) => /* @__PURE__ */ jsx30(SectionRenderer, { section }, i)),
        /* @__PURE__ */ jsxs15(
          View22,
          {
            fixed: true,
            style: {
              position: "absolute",
              bottom: page.footerBottom,
              left: page.paddingHorizontal,
              right: page.paddingHorizontal,
              flexDirection: "row",
              justifyContent: "space-between",
              borderTopWidth: borders.hairline,
              borderTopColor: colors.border,
              paddingTop: space.sm
            },
            children: [
              /* @__PURE__ */ jsx30(Body, { size: "sm", color: colors.textFaint, children: data2.meta.title }),
              /* @__PURE__ */ jsx30(
                Text10,
                {
                  style: { fontFamily: fonts.body, fontSize: fontSizes.sm, color: colors.textFaint },
                  render: ({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`
                }
              )
            ]
          }
        )
      ]
    }
  )
] });
var ReportDocument_default = ReportDocument;
{
}
{
}
{
}

// scripts/render-pdf.jsx
import { jsx as jsx31 } from "react/jsx-runtime";
var here = path.dirname(fileURLToPath(import.meta.url));
var root = path.resolve(here, "..");
var out = process.argv[2] || path.join(root, "report.pdf");
var data = JSON.parse(fs.readFileSync(path.join(root, "src/data/audit-data.json"), "utf8"));
var doc = composeReport(data);
var buf = await pdf(/* @__PURE__ */ jsx31(ReportDocument_default, { data: doc })).toBuffer();
var chunks = [];
for await (const c of buf) chunks.push(c);
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, Buffer.concat(chunks));
console.log(`PDF written: ${out} (${Buffer.concat(chunks).length} bytes)`);
