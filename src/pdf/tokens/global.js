// src/pdf/tokens/global.js
// GLOBAL VALUES - primitive design tokens, mirroring the ds-* structure of the
// Auditsmith web globals.css. Every raw value lives HERE and only here.
// No imports, no references. Numbers are unitless react-pdf points.
//
// Structure mirrors the web design system:
//   :root primitives  ->  global.*        (this file)
//   semantic tokens   ->  colors.js / typography.js / spacing.js
//   components        ->  import semantics only, never this file
//
// NOT PORTED from the web system (react-pdf has no support for them):
//   gradients (CSS), shadows/elevation, motion/durations, z-index.
//   If a gradient cover is ever needed, it must be drawn as SVG.

export const global = {
  /* =========================================
     PRIMITIVE TOKENS
  ========================================= */

  /* COLORS - scales, 50 (lightest) to 950 (darkest) */
  palette: {
    /* Purple - the brand scale, built around Primary Purple 900 */
    purple: {
      50: "#FAF8FC",   /* Purple Frost   (was bgAlt) */
      100: "#F6F2F9",  /* Purple Mist    (was primarySoft) */
      200: "#E9DCF2",  /* Soft Purple */
      300: "#D9C7EA",  /* Pale Purple    (was onPrimaryMuted) */
      400: "#C9AEDE",  /* Muted Purple   (was primaryTint) */
      500: "#B795D1",  /* Signal Purple  (was onPrimaryFaint) */
      600: "#9A63B8",  /* Bright Purple */
      700: "#6D3396",  /* Royal Purple   (was onPrimaryBorder) */
      800: "#571480",  /* Deep Purple */
      900: "#460073",  /* Primary Purple (the brand) */
      950: "#2E004C",  /* Purple Abyss */
    },

    /* Neutral - text, borders, surfaces */
    neutral: {
      0: "#FFFFFF",    /* White */
      50: "#FCFCFD",   /* Frost White */
      100: "#F8F9FA",  /* Cloud Surface */
      200: "#E0E0E0",  /* Soft Smoke     (border) */
      300: "#C4CBD1",  /* Mist Gray */
      400: "#9CA3AF",  /* Muted Slate    (info badge) */
      500: "#888888",  /* Balanced Slate (faint text) */
      600: "#555555",  /* Steel Slate    (muted text) */
      700: "#3D444B",  /* Deep Slate */
      800: "#2A3036",  /* Graphite Surface */
      900: "#1A1A1A",  /* Charcoal Ink   (text) */
      950: "#0E1114",  /* Obsidian */
    },

    /* Success - greens; 400 is the Core Web Vitals green */
    success: {
      50: "#E7FAF1",   /* Success Tint */
      100: "#C5F3DD",  /* Soft Success */
      300: "#3FE39A",  /* Fresh Success */
      400: "#0CCE6B",  /* Success Green  (CWV good) */
      500: "#0AAD5A",  /* Brand Success */
      700: "#076B38",  /* Dark Success */
      900: "#03301A",  /* Success Deep */
    },

    /* Warning - ambers; 400 is the CWV amber, 500 the severity amber */
    warning: {
      50: "#FFF6E8",   /* Amber Tint */
      100: "#FFE9C7",  /* Soft Amber */
      300: "#FFC163",  /* Warm Amber */
      400: "#FFA400",  /* Signal Amber   (CWV needs-improvement) */
      500: "#F59E0B",  /* Brand Amber    (severity medium) */
      700: "#9A6206",  /* Dark Amber */
      900: "#452C02",  /* Ink Amber */
    },

    /* Reject - reds; 400 CWV poor, 500 severity high, 800 severity critical */
    reject: {
      50: "#FEF1F0",   /* Reject Tint */
      100: "#FDDEDC",  /* Soft Reject */
      300: "#FA8A82",  /* Bright Reject */
      400: "#FF4E42",  /* Reject Red     (CWV poor) */
      500: "#DC2626",  /* Brand Reject   (severity high) */
      700: "#A31515",  /* Dark Reject */
      800: "#7F1D1D",  /* Ink Reject     (severity critical) */
      900: "#420404",  /* Reject Deep */
    },

    /* Blue - informational; 400 is the severity-low blue */
    blue: {
      50: "#EFF6FF",   /* Blue Tint */
      100: "#DBEAFE",  /* Soft Blue */
      300: "#93C5FD",  /* Sky Blue */
      400: "#3B82F6",  /* Signal Blue    (severity low) */
      500: "#2563EB",  /* Deep Blue */
      700: "#1E40AF",  /* Dark Blue */
      900: "#172554",  /* Blue Ink */
    },
  },

  /* TYPOGRAPHY - family names must match a Font.register in typography.js */
  fontFamilies: {
    heading: "Cabinet Grotesk",  /* --ds-font-heading */
    sans: "Manrope",             /* --ds-font-sans (body) */
    mono: "Geist Mono",          /* --ds-font-mono */
  },

  /* FONT WEIGHTS - only regular and bold have registered files today;
     register more weights in typography.js before using the others */
  fontWeights: {
    air: 100,
    thin: 200,
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
  },

  /* FONT SIZE SCALE (points) */
  fontSizeScale: {
    xs: 7.5,
    sm: 8,
    base: 9,
    md: 9.5,
    lg: 10,
    xl: 12,
    "2xl": 13,
    "3xl": 20,
    "4xl": 22,
    "5xl": 30,
    display: 40,
  },

  /* LINE HEIGHTS (unitless multipliers) */
  lineHeightScale: { tight: 1.1, normal: 1.4, relaxed: 1.5 },

  /* LETTER SPACING (points) */
  letterSpacingScale: { normal: 0, wide: 0.5, wider: 1, widest: 2 },

  /* SPACING (points) - ds-style ladder */
  spaceScale: {
    xxxs: 1,
    xxs: 2,
    xs: 4,
    sm: 6,
    md: 8,
    lg: 10,
    xl: 12,
    "2xl": 16,
    "3xl": 20,
    "4xl": 24,
    "5xl": 32,
    "6xl": 48,
    "7xl": 56,
    "8xl": 64,
  },

  /* RADIUS (points) */
  radiusScale: {
    none: 0,
    sm: 3,
    md: 4,
    xl: 12,
    full: 999,
  },

  /* BORDERS (points) */
  borderScale: { hairline: 1, thick: 2, heavy: 3 },

  /* PAGE FRAME (points) - PDF-specific, no web equivalent */
  pageFrame: {
    paddingTop: 48,
    paddingBottom: 56,
    paddingHorizontal: 48,
    footerBottom: 24,
  },
};
