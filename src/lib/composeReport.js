// src/lib/composeReport.js
// COMPOSER: turns raw audit data (what users type) into the document JSON
// (what the renderer consumes). All report boilerplate lives HERE:
// section order, headings, divider text, metric labels, test conditions.
//
// Users type numbers; ratings are COMPUTED from Google's official
// Core Web Vitals / Lighthouse thresholds. date: "auto" stamps today.

// ---------- Google thresholds (good ≤ first, poor > second) ----------
// Times in the unit users type: seconds, except tbt/inp in ms, cls unitless.
const THRESHOLDS = {
  lcp: { good: 2.5, poor: 4.0, unit: "s", label: "Largest Contentful Paint (LCP)" },
  inp: { good: 200, poor: 500, unit: "ms", label: "Interaction to Next Paint (INP)" },
  cls: { good: 0.1, poor: 0.25, unit: "", label: "Cumulative Layout Shift (CLS)" },
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

// ---------- helpers ----------
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

const stampDate = (date) => {
  if (date && date !== "auto") return date;
  return new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
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
    // "2/2"-style string scores become display overrides
    if (typeof v === "string" && v.includes("/")) {
      const [num, max] = v.split("/").map(Number);
      return { label, score: num, max, display: v };
    }
    return { label, score: v, max: 100 };
  });

// ---------- section builders ----------
const pagespeedSections = (ps) => {
  if (!ps) return [];
  const s = [];

  s.push({
    type: "sectionDivider",
    number: "01",
    title: "PageSpeed Insights",
    description: `Google PageSpeed Insights results: real-user Core Web Vitals, Lighthouse lab metrics, and prioritised performance findings.${
      ps.testedOn ? ` Tested ${ps.testedOn} on ${ps.device || "mobile"}.` : ""
    }`,
  });

  s.push({ type: "heading", text: "Core Web Vitals Assessment" });
  s.push({
    type: "paragraph",
    text: `Field data from real users over the latest 28-day period (Chrome UX Report). Overall assessment: ${
      ps.assessment || "Not available"
    }.`,
  });

  if (ps.scores) s.push({ type: "scorecard", items: scoreItems(ps.scores) });

  if (ps.fieldData)
    s.push({
      type: "metrics",
      title: "Field Data (Real Users)",
      items: metricItems(ps.fieldData, THRESHOLDS),
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
      { label: "Tool", value: ps.tool || "Google PageSpeed Insights (Lighthouse)" },
      { label: "Device", value: ps.deviceDetail || (ps.device === "desktop" ? "Desktop" : "Emulated mobile device") },
      { label: "Network", value: ps.network || "Slow 4G throttling" },
      { label: "Session", value: "Single page session, initial page load" },
      { label: "Field data", value: "Latest 28-day period, Chrome UX Report" },
    ],
  });

  return s;
};

// ---------- the composer ----------
export function composeReport(data) {
  // Escape hatch: already a document? Render as-is.
  if (data.sections) return data;

  const date = stampDate(data.date);

  const sections = [
    { type: "heading", text: "Executive Summary" },
    ...(data.summary ? [{ type: "paragraph", text: data.summary }] : []),
    ...(data.auditResults ? [{ type: "auditResults", ...data.auditResults }] : []),
    ...pagespeedSections(data.pagespeed),
  ];

  return {
    meta: {
      title: "Website Audit Report",
      subtitle: data.site,
      date,
      reference: data.reference,
    },
    cover: {
      reportType: "Website Audit Report",
      title: data.site,
      subtitle:
        data.coverSubtitle ||
        "Technical SEO, on-page SEO, AI readiness, backlinks, UI/UX, accessibility and architecture analysis.",
      date,
      reference: data.reference,
      preparedBy: data.preparedBy,
      preparedFor: data.client,
    },
    sections,
  };
}
