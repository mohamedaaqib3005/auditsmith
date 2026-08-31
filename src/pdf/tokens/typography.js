// src/pdf/tokens/typography.js
// TYPOGRAPHY: font registration + semantic exports derived from global.js.
// Font files live in src/pdf/fonts/. Family names come from global.fontFamilies
// so a swap (e.g. to Poppins) is: register the new files, change ONE value in global.js.

import { Font } from "@react-pdf/renderer";
import { global } from "./global";

import ManropeRegular from "../fonts/Manrope-Regular.ttf";
import ManropeBold from "../fonts/Manrope-Bold.ttf";
import GeistMonoRegular from "../fonts/GeistMono-Regular.ttf";
// If this import fails: download free from https://www.fontshare.com/fonts/cabinet-grotesk
// and copy Fonts/WEB/fonts/CabinetGrotesk-Extrabold.ttf into src/pdf/fonts/
import CabinetGroteskXBold from "../fonts/CabinetGrotesk-Extrabold.ttf";

Font.register({
  family: global.fontFamilies.body,
  fonts: [
    { src: ManropeRegular, fontWeight: 400 },
    { src: ManropeBold, fontWeight: 700 },
  ],
});

Font.register({
  family: global.fontFamilies.mono,
  fonts: [{ src: GeistMonoRegular, fontWeight: 400 }],
});

Font.register({
  family: global.fontFamilies.heading,
  fonts: [{ src: CabinetGroteskXBold, fontWeight: 700 }],
});

// Disable hyphenation (react-pdf hyphenates aggressively by default)
Font.registerHyphenationCallback((word) => [word]);

// Semantic exports (components import these, never global directly)
export const fonts = global.fontFamilies;
export const fontSizes = global.fontSizeScale;
export const lineHeights = global.lineHeightScale;
export const letterSpacing = global.letterSpacingScale;
