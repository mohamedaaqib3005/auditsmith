// src/pdf/tokens/colors.js
// SEMANTIC COLOURS: roles built from global.js raw values. Zero hex codes here.
// This is what components import.

import { global } from "./global";

const p = global.palette;

export const colors = {
  primary: p.purple700,
  primaryTint: p.purple200,
  primarySoft: p.purple50,
  text: p.gray900,
  textMuted: p.gray600,
  textFaint: p.gray400,
  border: p.gray100,
  bgAlt: p.purple100,
  white: p.white,

  // Cover (on-primary surface)
  onPrimary: p.white,
  onPrimaryMuted: p.purple400,
  onPrimaryFaint: p.purple300,
  onPrimaryBorder: p.purple500,
};

export const severityColors = {
  critical: { bg: p.red900, text: p.white },
  high: { bg: p.red500, text: p.white },
  medium: { bg: p.amber500, text: p.gray900 },
  low: { bg: p.blue500, text: p.white },
  info: { bg: p.gray500, text: p.white },
};

export const ratingColors = {
  good: { color: p.cwvGreen, label: "Good" },
  "needs-improvement": { color: p.cwvAmber, label: "Needs Improvement" },
  poor: { color: p.cwvRed, label: "Poor" },
  na: { color: p.gray500, label: "N/A" },
};

// Lighthouse score bands: 0-49 red, 50-89 amber, 90-100 green
export const scoreColor = (score, max = 100) => {
  const pct = (score / max) * 100;
  if (pct >= 90) return p.cwvGreen;
  if (pct >= 50) return p.cwvAmber;
  return p.cwvRed;
};
