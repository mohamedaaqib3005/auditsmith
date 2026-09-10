// src/pdf/tokens/typography.js
// SEMANTIC TYPOGRAPHY - font registration + exports derived from global.js.
// Family names come from global.fontFamilies; a font swap is: register the
// new files here, change one value in global.js.

import { Font } from "@react-pdf/renderer";
import { global } from "./global";

import ManropeRegular from "../fonts/Manrope-Regular.ttf";
import ManropeBold from "../fonts/Manrope-Bold.ttf";
import GeistMonoRegular from "../fonts/GeistMono-Regular.ttf";
// If this import fails: download free from https://www.fontshare.com/fonts/cabinet-grotesk
// and copy Fonts/WEB/fonts/CabinetGrotesk-Extrabold.ttf into src/pdf/fonts/
import CabinetGroteskXBold from "../fonts/CabinetGrotesk-Extrabold.ttf";

const W = global.fontWeights;

Font.register({
  family: global.fontFamilies.sans,
  fonts: [
    { src: ManropeRegular, fontWeight: W.regular },
    { src: ManropeBold, fontWeight: W.bold },
  ],
});

Font.register({
  family: global.fontFamilies.mono,
  fonts: [{ src: GeistMonoRegular, fontWeight: W.regular }],
});

Font.register({
  family: global.fontFamilies.heading,
  fonts: [{ src: CabinetGroteskXBold, fontWeight: W.bold }],
});

// Disable hyphenation (react-pdf hyphenates aggressively by default)
Font.registerHyphenationCallback((word) => [word]);

// Semantic exports (components import these, never global directly).
// fonts.body is an alias of fonts.sans so existing components keep working.
export const fonts = {
  heading: global.fontFamilies.heading,
  sans: global.fontFamilies.sans,
  body: global.fontFamilies.sans,
  mono: global.fontFamilies.mono,
};

export const fontWeights = global.fontWeights;
export const fontSizes = global.fontSizeScale;
export const lineHeights = global.lineHeightScale;
export const letterSpacing = global.letterSpacingScale;

/* =========================================
   BRAND FONTS - like applyTheme, but for type.
   theme.fonts names the families ({heading, body}); theme.fontFiles holds
   the resolved TTF urls the brand script wrote ({Family: {regular, bold}}).
   A family without resolved files is ignored: the default stays. Layout
   metrics are tuned to the defaults, so eyeball a font-swapped report.
========================================= */
const DEFAULT_FONTS = {
  heading: global.fontFamilies.heading,
  sans: global.fontFamilies.sans,
};

export const applyFonts = (theme) => {
  let heading = DEFAULT_FONTS.heading;
  let body = DEFAULT_FONTS.sans;

  const files = theme?.fontFiles || {};
  const usable = (fam) => fam && files[fam]?.regular;

  if (usable(theme?.fonts?.heading)) {
    const fam = theme.fonts.heading;
    Font.register({
      family: fam,
      fonts: [
        { src: files[fam].regular, fontWeight: W.regular },
        { src: files[fam].bold || files[fam].regular, fontWeight: W.bold },
      ],
    });
    heading = fam;
  }
  if (usable(theme?.fonts?.body)) {
    const fam = theme.fonts.body;
    Font.register({
      family: fam,
      fonts: [
        { src: files[fam].regular, fontWeight: W.regular },
        { src: files[fam].bold || files[fam].regular, fontWeight: W.bold },
      ],
    });
    body = fam;
  }

  fonts.heading = heading;
  fonts.sans = body;
  fonts.body = body;
  return fonts;
};
