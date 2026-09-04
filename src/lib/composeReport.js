// src/lib/composeReport.js
// COMPOSER: turns minimal audit data (what users type) into the document JSON.
// Users type: site URL, device, scores, fieldData, labMetrics. Everything else
// is a constant or computed here.
//
// Derived automatically:
//   client      - brand name from the URL (vlncy.com -> Vlncy)
//   reference   - AUD-<BRAND>-<YEAR>-001
//   date        - today (also used for testedOn)
//   summary     - constant template with the site substituted in
//   assessment  - computed from field-data Core Web Vitals ratings
//   ratings     - computed from Google's official thresholds

/* =========================================
   CONSTANTS - change once, applies to every report
========================================= */
const PREPARED_BY = "Mohamed Aaqib";
const REPORT_TYPE = "Website Audit Report";
const COVER_SUBTITLE =
  "Technical SEO, on-page SEO, AI readiness, backlinks, UI/UX, accessibility and architecture analysis.";
const SUMMARY = (site) =>
  `This audit reviews ${site} across seven dimensions. The site is fundamentally healthy: Core Web Vitals pass and best practices score well. The largest opportunities sit in image delivery, accessibility labelling, and AI readiness, where quick wins are available before launch traffic scales.`;

const TEST_CONDITIONS = {
  mobile: {
    deviceDetail: "Emulated Moto G Power",
    tool: "Lighthouse 13.4.1, HeadlessChromium 151.0.7922.71",
    network: "Slow 4G throttling",
  },
  desktop: {
    deviceDetail: "Emulated desktop",
    tool: "Lighthouse 13.4.1, HeadlessChromium 151.0.7922.71",
    network: "Custom throttling",
  },
};

/* =========================================
   Google thresholds (good <= first, poor > second)
   Units as typed: seconds, except tbt/inp in ms, cls unitless
========================================= */
const FIELD_THRESHOLDS = {
  lcp: { good: 2.5, poor: 4.0, unit: "s", label: "Largest Contentful Paint (LCP)", core: true },
  inp: { good: 200, poor: 500, unit: "ms", label: "Interaction to Next Paint (INP)", core: true },
  cls: { good: 0.1, poor: 0.25, unit: "", label: "Cumulative Layout Shift (CLS)", core: true },
  fcp: { good: 1.8, poor: 3.0, unit: "s", label: "First Contentful Paint (FCP)" },
  ttfb: { good: 0.8, poor: 1.8, unit: "s", label: "Time to First Byte (TTFB)" },
};

const LAB_THRESHOLDS = {
  fcp: { good: 1.8, poor: 3.0, unit: "s", label: "First Contentful Paint" },
  lcp: { good: 2.5, poor: 4.0, unit: "s", label: "Largest Contentful Paint" },
  tbt: { good: 200, poor: 600, unit: "ms", label: "Total Blocking Time" },
  cls: { good: 0.1, poor: 0.25, unit: "", label: "Cumulative Layout Shift" },
  speedIndex: { good: 3.4, poor: 5.8, unit: "s", label: "Speed Index" },
};

/* ---------- helpers ---------- */
const rate = (value, t) => {
  if (value === null || value === undefined) return "na";
  if (value <= t.good) return "good";
  if (value <= t.poor) return "needs-improvement";
  return "poor";
};

const fmt = (value, t) => {
  if (value === null || value === undefined) return "N/A";
  return t.unit ? `${value} ${t.unit}` : `${value}`;
};

const metricItems = (data = {}, thresholds) =>
  Object.entries(thresholds)
    .filter(([key]) => key in data)
    .map(([key, t]) => ({
      label: t.label,
      value: fmt(data[key], t),
      rating: rate(data[key], t),
    }));

// Brand from URL: "https://www.vlncy.com/x" -> "Vlncy"
const brandFromSite = (site = "") => {
  const host = site
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0];
  const name = host.split(".")[0] || host;
  return name.charAt(0).toUpperCase() + name.slice(1);
};

// Clean site for display: strip protocol and path
const displaySite = (site = "") =>
  site.replace(/^https?:\/\//, "").replace(/\/$/, "").split("/")[0];

const todayLong = () =>
  new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

// AUD-VLNCY-2026-001
const makeReference = (brand) =>
  `AUD-${brand.toUpperCase()}-${new Date().getFullYear()}-001`;

// Core Web Vitals assessment: every core metric WITH data must rate "good".
// (Google's rule: LCP, INP, CLS; metrics without field data are skipped.)
const assess = (fieldData = {}) => {
  const cores = Object.entries(FIELD_THRESHOLDS).filter(([k, t]) => t.core && fieldData[k] != null);
  if (cores.length === 0) return "Not available";
  return cores.every(([k, t]) => rate(fieldData[k], t) === "good") ? "Passed" : "Failed";
};

const SCORE_LABELS = {
  performance: "Performance",
  accessibility: "Accessibility",
  bestPractices: "Best Practices",
  seo: "SEO",
  agenticBrowsing: "Agentic Browsing",
};

const scoreItems = (scores = {}) =>
  Object.entries(scores).map(([key, v]) => {
    const label = SCORE_LABELS[key] || key;
    if (typeof v === "string" && v.includes("/")) {
      const [num, max] = v.split("/").map(Number);
      return { label, score: num, max, display: v };
    }
    return { label, score: v, max: 100 };
  });

/* =========================================
   Technical SEO knowledge - status enums -> display text + verdict
========================================= */
const TECH_CHECKS = {
  sitemap: {
    label: "XML Sitemap",
    ok: { status: "OK", notes: "Present, valid" },
    stale: { status: "Issues", notes: "Present, contains stale URLs" },
    missing: { status: "Missing", notes: "Not found" },
  },
  robotsTxt: {
    label: "Robots.txt",
    ok: { status: "OK", notes: "Present, valid" },
    missing: { status: "Missing", notes: "Not found" },
  },
  https: {
    label: "HTTPS",
    ok: { status: "OK", notes: "Enforced site-wide" },
    partial: { status: "Issues", notes: "Not enforced on all pages" },
  },
};

/* =========================================
   On-Page SEO knowledge - field -> label + issue phrasing
   Counts of pages with each problem; 0 means the check passes.
========================================= */
// severe(n, pages): when a check's count escalates it from amber to red.
// Structural checks go red past half the crawled pages; cosmetic ones never do.
const MOST_PAGES = (n, pages) => pages > 0 && n / pages > 0.5;

const ONPAGE_CHECKS = {
  missingTitles: { label: "Page titles", issue: (n) => `Missing on ${n} page${n === 1 ? "" : "s"}`, severe: MOST_PAGES },
  duplicateTitles: { label: "Duplicate titles", issue: (n) => `${n} page${n === 1 ? "" : "s"} share a title` },
  missingMeta: { label: "Meta descriptions", issue: (n) => `Missing on ${n} page${n === 1 ? "" : "s"}`, severe: MOST_PAGES },
  duplicateMeta: { label: "Duplicate meta descriptions", issue: (n) => `${n} page${n === 1 ? "" : "s"} share one` },
  missingH1: { label: "H1 headings", issue: (n) => `Missing on ${n} page${n === 1 ? "" : "s"}`, severe: MOST_PAGES },
  multipleH1: { label: "Multiple H1s", issue: (n) => `${n} page${n === 1 ? "" : "s"} have more than one`, severe: MOST_PAGES },
  thinPages: { label: "Thin content", issue: (n) => `${n} page${n === 1 ? "" : "s"} under 200 words` },
};

/* =========================================
   AI Readiness knowledge - can AI systems read and use this site?
   Enum values: ok | partial | missing (typed by hand; see docs 3h)
========================================= */
const AI_CHECKS = {
  llmsTxt: {
    label: "llms.txt",
    ok: { status: "OK", notes: "Present at /llms.txt" },
    missing: { status: "Missing", notes: "No /llms.txt file found" },
    fix: "Add an llms.txt file at the site root describing the site and its key pages for AI systems.",
  },
  aiCrawlers: {
    label: "AI crawler access",
    ok: { status: "OK", notes: "GPTBot, ClaudeBot, PerplexityBot allowed" },
    partial: { status: "Issues", notes: "Some AI crawlers blocked in robots.txt" },
    missing: { status: "Missing", notes: "AI crawlers blocked in robots.txt" },
    fix: "Remove the robots.txt Disallow rules for the AI crawlers the site should be visible to.",
  },
  structuredData: {
    label: "Structured data (Schema.org)",
    ok: { status: "OK", notes: "Schema.org markup present" },
    partial: { status: "Issues", notes: "Only some pages or types marked up" },
    missing: { status: "Missing", notes: "No Schema.org markup detected" },
    fix: "Add Schema.org JSON-LD (Organization, WebSite, and page-type markup) so AI systems can interpret the site.",
  },
  metaRobots: {
    label: "Meta robots",
    ok: { status: "OK", notes: "No accidental noindex or noai blocking" },
    partial: { status: "Issues", notes: "Some pages carry blocking directives" },
    missing: { status: "Missing", notes: "Key pages blocked from indexing" },
    fix: "Remove accidental noindex/none directives from pages that should be visible.",
  },
  contentAccess: {
    label: "Content without JavaScript",
    ok: { status: "OK", notes: "Core content readable without JS" },
    partial: { status: "Issues", notes: "Some content requires JS to appear" },
    missing: { status: "Missing", notes: "Page is empty without JS execution" },
    fix: "Server-render or statically generate key content; many AI crawlers do not execute JavaScript.",
  },
};

/* ---------- section builders ---------- */
const pagespeedSections = (ps, date) => {
  if (!ps) return [];
  const s = [];
  const device = ps.device === "desktop" ? "desktop" : "mobile";
  const cond = TEST_CONDITIONS[device];
  const assessment = assess(ps.fieldData);

  s.push({
    type: "sectionDivider",
    number: "01",
    title: "PageSpeed Insights",
    description: `Google PageSpeed Insights results: real-user Core Web Vitals, Lighthouse lab metrics. Tested ${date} on ${device}.`,
  });

  if (ps.fieldData) {
    s.push({ type: "heading", text: "Core Web Vitals Assessment" });
    s.push({
      type: "paragraph",
      text: `Field data from real users over the latest 28-day period (Chrome UX Report). Overall assessment: ${assessment}.`,
    });
  }

  if (ps.scores) s.push({ type: "scorecard", items: scoreItems(ps.scores) });

  if (ps.fieldData)
    s.push({
      type: "metrics",
      title: "Field Data (Real Users)",
      items: metricItems(ps.fieldData, FIELD_THRESHOLDS),
    });

  if (ps.labMetrics) {
    s.push({ type: "heading", text: "Lab Metrics (Lighthouse)" });
    s.push({
      type: "metrics",
      title: "Single Page Session, Initial Load",
      items: metricItems(ps.labMetrics, LAB_THRESHOLDS),
    });
  }

  if (ps.findings?.length) {
    s.push({ type: "heading", text: "Performance Findings" });
    s.push({ type: "findings", items: ps.findings });
  }

  s.push({ type: "heading", text: "Test Conditions" });
  s.push({
    type: "keyValue",
    items: [
      { label: "Tool", value: cond.tool },
      { label: "Device", value: cond.deviceDetail },
      { label: "Network", value: cond.network },
      { label: "Session", value: "Single page session, initial page load" },
      { label: "Field data", value: "Latest 28-day period, Chrome UX Report" },
    ],
  });

  return s;
};

const technicalSeoSections = (ts) => {
  if (!ts) return [];
  const s = [];

  const pct =
    ts.pagesCrawled > 0 && ts.indexable != null
      ? Math.round((ts.indexable / ts.pagesCrawled) * 100)
      : null;

  const rows = [];
  for (const [key, check] of Object.entries(TECH_CHECKS)) {
    if (ts[key] == null) continue;
    const state = check[ts[key]] || {
      status: "Unknown",
      notes: `Unrecognised value "${ts[key]}"`,
    };
    rows.push([check.label, state.status, state.notes]);
  }
  if (ts.brokenLinks != null)
    rows.push([
      "Broken internal links",
      ts.brokenLinks === 0 ? "OK" : "Issues",
      ts.brokenLinks === 0 ? "None detected" : `${ts.brokenLinks} found`,
    ]);
  if (ts.redirectChains != null)
    rows.push([
      "Redirect chains",
      ts.redirectChains === 0 ? "OK" : "Issues",
      ts.redirectChains === 0 ? "None detected" : `${ts.redirectChains} found`,
    ]);

  const issueCount = rows.filter((r) => r[1] !== "OK").length;

  // Same data, section-01 presentation: each check as a rated metric row.
  const STATUS_RATING = { OK: "good", Issues: "needs-improvement", Missing: "poor" };
  const checkItems = rows.map(([label, status, notes]) => ({
    label,
    value: notes,
    rating: STATUS_RATING[status] || "na",
  }));

  s.push({
    type: "sectionDivider",
    number: "02",
    title: "Technical SEO",
    description:
      "Crawlability, indexation, sitemaps, redirects and site health as seen by search engine bots.",
  });

  s.push({ type: "heading", text: "Crawl Overview" });
  s.push({
    type: "paragraph",
    text:
      issueCount === 0
        ? `A crawl of ${ts.pagesCrawled} pages found no technical issues across the checks below.`
        : `A crawl of ${ts.pagesCrawled} pages found ${issueCount} check${issueCount === 1 ? "" : "s"} needing attention, detailed below.`,
  });
  // Indexability as a section-01 style score ring
  if (pct != null) {
    s.push({
      type: "scorecard",
      items: [
        {
          label: `Indexable (${ts.indexable} of ${ts.pagesCrawled} pages)`,
          score: ts.indexable,
          max: ts.pagesCrawled,
          display: `${pct}%`,
        },
      ],
    });
  } else if (ts.pagesCrawled != null) {
    s.push({
      type: "keyValue",
      items: [{ label: "Pages crawled", value: `${ts.pagesCrawled}` }],
    });
  }

  if (checkItems.length) {
    s.push({ type: "heading", text: "Health Checks" });
    s.push({ type: "metrics", title: "Crawl & Site Health", items: checkItems });
  }

  // Indexability breakdown (why pages are excluded), when the crawl knows it
  if (ts.nonIndexable && Object.keys(ts.nonIndexable).length) {
    s.push({ type: "heading", text: "Indexability" });
    s.push({
      type: "keyValue",
      items: Object.entries(ts.nonIndexable).map(([reason, n]) => ({
        label: `${n} page${n === 1 ? "" : "s"}`,
        value: reason,
      })),
    });
  }

  // Architecture, URLs and assets from the crawl's structural columns
  const archItems = [
    ts.parameterUrls != null && {
      label: "Parameterised URLs",
      value: ts.parameterUrls === 0 ? "None found" : `${ts.parameterUrls} URL${ts.parameterUrls === 1 ? "" : "s"} with query parameters`,
      rating: ts.parameterUrls === 0 ? "good" : "needs-improvement",
    },
    ts.deepPages != null && {
      label: "Deep pages (4+ clicks from home)",
      value: ts.deepPages === 0 ? "None found" : `${ts.deepPages} page${ts.deepPages === 1 ? "" : "s"}`,
      rating: ts.deepPages === 0 ? "good" : "needs-improvement",
    },
    ts.weakPages != null && {
      label: "Weakly linked pages (1 or fewer inlinks)",
      value: ts.weakPages === 0 ? "None found" : `${ts.weakPages} page${ts.weakPages === 1 ? "" : "s"}, orphan candidates`,
      rating: ts.weakPages === 0 ? "good" : "needs-improvement",
    },
    ts.largeImages != null && {
      label: "Large images (over 100 KB)",
      value: ts.largeImages === 0 ? "None found" : `${ts.largeImages} of ${ts.imagesCrawled} images`,
      rating: ts.largeImages === 0 ? "good" : "needs-improvement",
    },
  ].filter(Boolean);

  if (archItems.length) {
    s.push({ type: "heading", text: "Architecture & Assets" });
    s.push({ type: "metrics", title: "Structure, Linking & Images", items: archItems });
  }

  return s;
};

const onPageSeoSections = (op, pages) => {
  if (!op) return [];
  const s = [];

  const items = [];
  for (const [key, check] of Object.entries(ONPAGE_CHECKS)) {
    if (op[key] == null) continue;
    const n = op[key];
    items.push({
      label: check.label,
      value: n === 0 ? "No issues found" : check.issue(n),
      rating:
        n === 0
          ? "good"
          : check.severe && check.severe(n, pages || 0)
          ? "poor"
          : "needs-improvement",
    });
  }
  const issueCount = items.filter((i) => i.rating !== "good").length;

  s.push({
    type: "sectionDivider",
    number: "03",
    title: "On-Page SEO",
    description:
      "Titles, meta descriptions, heading structure and content depth across the crawled pages.",
  });

  s.push({ type: "heading", text: "Content Checks" });
  s.push({
    type: "paragraph",
    text:
      issueCount === 0
        ? "All on-page checks passed across the crawled pages."
        : `${issueCount} on-page check${issueCount === 1 ? "" : "s"} need${issueCount === 1 ? "s" : ""} attention, detailed below.`,
  });

  if (items.length) {
    s.push({ type: "metrics", title: "Titles, Descriptions & Headings", items });
  }

  return s;
};

const AI_SCORE_LABELS = {
  eeat: "E-E-A-T",
  socials: "Social Signals",
  structuredData: "Structured Data",
};

const aiReadinessSections = (ai) => {
  if (!ai) return [];
  const s = [];

  const STATUS_RATING = { OK: "good", Issues: "needs-improvement", Missing: "poor" };
  const items = [];
  for (const [key, check] of Object.entries(AI_CHECKS)) {
    if (ai[key] == null) continue;
    const state = check[ai[key]] || {
      status: "Unknown",
      notes: `Unrecognised value "${ai[key]}"`,
    };
    const rating = STATUS_RATING[state.status] || "na";
    items.push({
      label: check.label,
      value: state.notes,
      rating,
      recommendation: rating !== "good" ? check.fix : undefined,
    });
  }
  const issueCount = items.filter((i) => i.rating !== "good").length;

  s.push({
    type: "sectionDivider",
    number: "04",
    title: "AI Readiness",
    description:
      "Whether AI systems, the crawlers behind ChatGPT, Claude, Perplexity and Google's AI features, can find, read and correctly interpret this site.",
  });

  s.push({ type: "heading", text: "AI Visibility Checks" });
  s.push({
    type: "paragraph",
    text:
      issueCount === 0
        ? "All AI readiness checks passed. The site is legible to AI crawlers and assistants."
        : `${issueCount} of ${items.length} checks need attention. AI systems may be missing or misreading parts of this site.`,
  });

  // Big score rings (typed from the Seomator audit for now)
  if (ai.scores) {
    s.push({
      type: "scorecard",
      items: Object.entries(ai.scores)
        .filter(([, v]) => v != null)
        .map(([key, v]) => ({
          label: AI_SCORE_LABELS[key] || key,
          score: v,
          max: 100,
          size: 72,
        })),
    });
  }

  if (items.length) {
    s.push({ type: "checks", items });
  }

  return s;
};

/* ---------- the composer ---------- */
export function composeReport(data) {
  // Escape hatch: already a document? Render as-is.
  if (data.sections) return data;

  const site = displaySite(data.site);
  const brand = brandFromSite(data.site);
  const date = todayLong();
  const reference = makeReference(brand);

  const sections = [
    { type: "heading", text: "Executive Summary" },
    { type: "paragraph", text: SUMMARY(site) },
    ...(data.auditResults ? [{ type: "auditResults", ...data.auditResults }] : []),
    ...pagespeedSections(data.pagespeed, date),
    ...technicalSeoSections(data.technicalSeo),
    ...onPageSeoSections(data.onPageSeo, data.technicalSeo?.pagesCrawled),
    ...aiReadinessSections(data.aiReadiness),
  ];

  return {
    meta: { title: REPORT_TYPE, subtitle: site, date, reference },
    cover: {
      reportType: REPORT_TYPE,
      title: site,
      subtitle: COVER_SUBTITLE,
      date,
      reference,
      preparedBy: PREPARED_BY,
      preparedFor: brand,
    },
    sections,
  };
}
