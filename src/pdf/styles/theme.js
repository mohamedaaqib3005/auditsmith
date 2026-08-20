// src/pdf/styles/theme.js
// Single source of truth for PDF styling: fonts, colours, palettes.

import { Font } from "@react-pdf/renderer";

// ---------- Fonts ----------
// Manrope (body) and Geist Mono (numbers) ship in src/pdf/fonts/ (OFL licence).
import ManropeRegular from "../fonts/Manrope-Regular.ttf";
import ManropeBold from "../fonts/Manrope-Bold.ttf";
import GeistMonoRegular from "../fonts/GeistMono-Regular.ttf";

Font.register({
  family: "Manrope",
  fonts: [
    { src: ManropeRegular, fontWeight: 400 },
    { src: ManropeBold, fontWeight: 700 },
  ],
});

Font.register({
  family: "Geist Mono",
  fonts: [{ src: GeistMonoRegular, fontWeight: 400 }],
});

// --- CABINET GROTESK (headings), 2-minute setup ---
// Fontshare's licence doesn't allow bundling the file, so add it yourself:
// 1) Download free from https://www.fontshare.com/fonts/cabinet-grotesk
// 2) From the zip, copy Fonts/WEB/fonts/CabinetGrotesk-Extrabold.ttf
//    into src/pdf/fonts/
// 3) Uncomment the import and Font.register lines below
// 4) Change fonts.heading to "Cabinet Grotesk"

import CabinetGroteskXBold from "../fonts/CabinetGrotesk-Extrabold.ttf";
Font.register({
  family: "Cabinet Grotesk",
  fonts: [{ src: CabinetGroteskXBold, fontWeight: 700 }],
});

export const fonts = {
  heading: "Manrope", // change to "Cabinet Grotesk" after the steps above
  body: "Manrope",
  mono: "Geist Mono",
};

// Disable hyphenation (react-pdf hyphenates aggressively by default)
Font.registerHyphenationCallback((word) => [word]);

// ---------- Colours ----------
export const colors = {
  primary: "#460073", // brand purple: headings, header bar, table headers, labels
  text: "#1a1a1a",
  textMuted: "#555555",
  textFaint: "#888888",
  border: "#e0e0e0",
  bgLight: "#f6f2f9", // light tint of the brand purple for boxes
  bgAlt: "#faf8fc",   // alternating table rows
  white: "#ffffff",
};

// Severity palette: badge background + text colour
export const severityColors = {
  critical: { bg: "#7f1d1d", text: "#ffffff" },
  high: { bg: "#dc2626", text: "#ffffff" },
  medium: { bg: "#f59e0b", text: "#1a1a1a" },
  low: { bg: "#3b82f6", text: "#ffffff" },
  info: { bg: "#9ca3af", text: "#ffffff" },
};

// Metric rating palette (Google CWV convention, left as-is on purpose)
export const ratingColors = {
  good: { color: "#0cce6b", label: "Good" },
  "needs-improvement": { color: "#ffa400", label: "Needs Improvement" },
  poor: { color: "#ff4e42", label: "Poor" },
  na: { color: "#9ca3af", label: "N/A" },
};

// Lighthouse score bands: 0-49 red, 50-89 amber, 90-100 green
export const scoreColor = (score, max = 100) => {
  const pct = (score / max) * 100;
  if (pct >= 90) return "#0cce6b";
  if (pct >= 50) return "#ffa400";
  return "#ff4e42";
};
