// src/pdf/tokens/typography.js
// DESIGN TOKENS: fonts and type scale.
// Font files live in src/pdf/fonts/. Registration happens once, here.

import { Font } from "@react-pdf/renderer";

import ManropeRegular from "../fonts/Manrope-Regular.ttf";
import ManropeBold from "../fonts/Manrope-Bold.ttf";
import GeistMonoRegular from "../fonts/GeistMono-Regular.ttf";
// If this import fails, download Cabinet Grotesk (free) from
// https://www.fontshare.com/fonts/cabinet-grotesk and copy
// Fonts/WEB/fonts/CabinetGrotesk-Extrabold.ttf into src/pdf/fonts/,
// or comment the 5 Cabinet lines and set heading: "Manrope" below.
import CabinetGroteskXBold from "../fonts/CabinetGrotesk-Extrabold.ttf";

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

Font.register({
  family: "Cabinet Grotesk",
  fonts: [{ src: CabinetGroteskXBold, fontWeight: 700 }],
});

// Disable hyphenation (react-pdf hyphenates aggressively by default)
Font.registerHyphenationCallback((word) => [word]);

export const fonts = {
  heading: "Cabinet Grotesk",
  body: "Manrope",
  mono: "Geist Mono",
};

// Type scale: use these instead of raw numbers in components
export const fontSizes = {
  xs: 7.5,    // badges, tiny labels
  sm: 8,      // meta, ids, footers
  base: 9,    // card body text, table cells
  md: 9.5,    // metric labels
  lg: 10,     // page default, paragraphs
  xl: 12,     // subtitles
  "2xl": 13,  // block headings
  "3xl": 20,  // page header title
  "4xl": 22,  // section divider title
  "5xl": 30,  // divider numeral
  display: 40 // cover title
};

export const lineHeights = {
  tight: 1.1,
  normal: 1.4,
  relaxed: 1.5,
};

export const letterSpacing = {
  normal: 0,
  wide: 0.5,
  wider: 1,
  widest: 2,
};
