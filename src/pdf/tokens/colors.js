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
  onPrimaryDanger: p.reject[300],

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

/* Rating -> colour lookup (safe fallback to na) */
export const ratingColor = (rating) =>
  (ratingColors[rating] || ratingColors.na).color;

/* LETTER GRADES (A-F, modifiers ignored: "C+" colours as "C") */
const gradeMap = {
  A: p.success[400],
  B: p.success[500],
  C: p.warning[400],
  D: p.warning[500],
  F: p.reject[500],
};
export const gradeColor = (grade) =>
  gradeMap[String(grade).trim().charAt(0).toUpperCase()] || p.neutral[400];

/* Lighthouse score bands: 0-49 reject, 50-89 warning, 90-100 success */
export const scoreColor = (score, max = 100) => {
  const pct = (score / max) * 100;
  if (pct >= 90) return p.success[400];
  if (pct >= 50) return p.warning[400];
  return p.reject[400];
};

/* =========================================
   BRAND THEMING - one hex in, the whole ramp out.
   applyTheme({ brand: "#0B5FFF" }) rebuilds the brand-hued semantic slots
   in place (cover, headings, tints, app bar). Ratings, severity, grades and
   score bands are audit semantics, never rebranded. applyTheme() with no
   argument restores the default purple.
========================================= */

const hexToHsl = (hex) => {
  const n = hex.replace("#", "");
  const r = parseInt(n.slice(0, 2), 16) / 255;
  const g = parseInt(n.slice(2, 4), 16) / 255;
  const b = parseInt(n.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, sat = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    sat = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return { h: h * 360, s: sat * 100, l: l * 100 };
};

const hslToHex = (h, s, l) => {
  s /= 100; l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const c = l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return Math.round(255 * c).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
};

// The default purple ramp's lightness/saturation curve, applied to any hue.
// Steps mirror global.js purple: 50..950.
const RAMP_CURVE = {
  50:  { s: 0.35, l: 98 },
  100: { s: 0.40, l: 96 },
  200: { s: 0.55, l: 91 },
  300: { s: 0.60, l: 85 },
  400: { s: 0.62, l: 78 },
  500: { s: 0.65, l: 70 },
  600: { s: 0.80, l: 55 },
  700: { s: 1.00, l: 39 },
  800: { s: 1.00, l: 29 },
  900: { s: 1.00, l: 23 },
  950: { s: 1.00, l: 15 },
};

const rampFrom = (brandHex) => {
  const { h, s } = hexToHsl(brandHex);
  const ramp = {};
  for (const [step, c] of Object.entries(RAMP_CURVE)) {
    ramp[step] = hslToHex(h, Math.min(100, s * c.s), c.l);
  }
  return ramp;
};

const brandSlots = (ramp) => ({
  surface: ramp[100],
  surfaceSoft: ramp[50],
  primary: ramp[900],
  primarySoft: ramp[100],
  primaryTint: ramp[400],
  onPrimaryMuted: ramp[300],
  onPrimaryFaint: ramp[500],
  onPrimaryBorder: ramp[700],
  bgAlt: ramp[50],
});

const normalizeBrand = (brand) => {
  if (typeof brand !== "string") return null;
  let x = brand.trim().replace("#", "");
  if (/^[0-9a-f]{3}$/i.test(x)) x = x.split("").map((c) => c + c).join("");
  return /^[0-9a-f]{6}$/i.test(x) ? `#${x}` : null;
};

export const applyTheme = (theme) => {
  // Invalid or absent brand -> the default purple. A typo must never
  // produce a broken (NaN/black) palette.
  const brand = normalizeBrand(theme?.brand);
  const ramp = brand ? rampFrom(brand) : p.purple;
  Object.assign(colors, brandSlots(ramp));
  return colors;
};
