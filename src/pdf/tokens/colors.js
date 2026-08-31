// src/pdf/tokens/colors.js
// SEMANTIC COLOURS - roles built from global.js primitives. Zero hex codes here.
// Mirrors the web system's semantic tier (--ds-bg, --ds-text, --ds-primary...).
// Components import THIS, never global.js.

import { global } from "./global";

const p = global.palette;

export const colors = {
  /* BACKGROUNDS */
  bg: p.neutral[0],
  surface: p.purple[100],        /* tinted boxes (was primarySoft) */
  surfaceSoft: p.purple[50],     /* alternating table rows (was bgAlt) */

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
  primaryForeground: p.neutral[0],

  /* ON-PRIMARY (cover surface) */
  onPrimary: p.neutral[0],
  onPrimaryMuted: p.purple[300],
  onPrimaryFaint: p.purple[500],
  onPrimaryBorder: p.purple[700],

  /* kept for backwards compatibility with existing components */
  white: p.neutral[0],
  bgAlt: p.purple[50],
};

/* SEVERITY (finding badges) */
export const severityColors = {
  critical: { bg: p.reject[800], text: p.neutral[0] },
  high: { bg: p.reject[500], text: p.neutral[0] },
  medium: { bg: p.warning[500], text: p.neutral[900] },
  low: { bg: p.blue[400], text: p.neutral[0] },
  info: { bg: p.neutral[400], text: p.neutral[0] },
};

/* RATINGS (Core Web Vitals convention) */
export const ratingColors = {
  good: { color: p.success[400], label: "Good" },
  "needs-improvement": { color: p.warning[400], label: "Needs Improvement" },
  poor: { color: p.reject[400], label: "Poor" },
  na: { color: p.neutral[400], label: "N/A" },
};

/* Lighthouse score bands: 0-49 reject, 50-89 warning, 90-100 success */
export const scoreColor = (score, max = 100) => {
  const pct = (score / max) * 100;
  if (pct >= 90) return p.success[400];
  if (pct >= 50) return p.warning[400];
  return p.reject[400];
};
