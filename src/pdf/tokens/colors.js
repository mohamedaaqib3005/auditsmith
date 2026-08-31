// src/pdf/tokens/colors.js
// DESIGN TOKENS: colour. The only place hex codes are allowed to live.

export const colors = {
  // Brand
  primary: "#460073",
  primaryTint: "#c9aede",   // large decorative numerals, light accents
  primarySoft: "#f6f2f9",   // tinted box backgrounds

  // Neutrals
  text: "#1a1a1a",
  textMuted: "#555555",
  textFaint: "#888888",
  border: "#e0e0e0",
  bgAlt: "#faf8fc",
  white: "#ffffff",

  // Cover page (on-primary surfaces)
  onPrimary: "#ffffff",
  onPrimaryMuted: "#d9c7ea",
  onPrimaryFaint: "#b795d1",
  onPrimaryBorder: "#6d3396",
};

// Severity palette: badge background + text colour
export const severityColors = {
  critical: { bg: "#7f1d1d", text: "#ffffff" },
  high:     { bg: "#dc2626", text: "#ffffff" },
  medium:   { bg: "#f59e0b", text: "#1a1a1a" },
  low:      { bg: "#3b82f6", text: "#ffffff" },
  info:     { bg: "#9ca3af", text: "#ffffff" },
};

// Metric rating palette (Google CWV convention)
export const ratingColors = {
  good:                { color: "#0cce6b", label: "Good" },
  "needs-improvement": { color: "#ffa400", label: "Needs Improvement" },
  poor:                { color: "#ff4e42", label: "Poor" },
  na:                  { color: "#9ca3af", label: "N/A" },
};

// Lighthouse score bands: 0-49 red, 50-89 amber, 90-100 green
export const scoreColor = (score, max = 100) => {
  const pct = (score / max) * 100;
  if (pct >= 90) return "#0cce6b";
  if (pct >= 50) return "#ffa400";
  return "#ff4e42";
};


// severity path  should be constant