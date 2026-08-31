// src/pdf/tokens/global.js
// GLOBAL VALUES: every raw value in the design system lives HERE and only here.
// No imports, no references. Numbers are unitless (react-pdf points). Strings quoted.
// colors.js / typography.js / spacing.js derive their semantic exports from this file.
// RULE: components never import this file directly - they import the semantic
// tokens (colors, fonts, space...) which are built from it.

export const global = {
  // ---- Raw palette (what colours ARE, not what they're for) ----
  palette: {
    purple700: "#460073",
    purple500: "#6d3396",
    purple400: "#d9c7ea",
    purple300: "#b795d1",
    purple200: "#c9aede",
    purple100: "#faf8fc",
    purple50: "#f6f2f9",

    gray900: "#1a1a1a",
    gray600: "#555555",
    gray400: "#888888",
    gray100: "#e0e0e0",
    white: "#ffffff",

    red900: "#7f1d1d",
    red500: "#dc2626",
    amber500: "#f59e0b",
    blue500: "#3b82f6",
    gray500: "#9ca3af",

    cwvGreen: "#0cce6b",
    cwvAmber: "#ffa400",
    cwvRed: "#ff4e42",
  },

  // ---- Font family names (must match a Font.register in typography.js) ----
  fontFamilies: {
    heading: "Cabinet Grotesk",
    body: "Manrope",
    mono: "Geist Mono",
  },

  // ---- Type scale (points) ----
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

  // ---- Spacing scale (points) ----
  spaceScale: {
    xxs: 2,
    xs: 4,
    sm: 6,
    md: 8,
    lg: 10,
    xl: 12,
    "2xl": 16,
    "3xl": 20,
    "4xl": 48,
    "5xl": 56,
  },

  // ---- Shape ----
  radii: { sm: 3, md: 4, full: 999 },
  borders: { hairline: 1, thick: 2, heavy: 3 },

  // ---- Page frame (points) ----
  pageFrame: {
    paddingTop: 48,
    paddingBottom: 56,
    paddingHorizontal: 48,
    footerBottom: 24,
  },

  // ---- Line heights (unitless multipliers) ----
  lineHeightScale: { tight: 1.1, normal: 1.4, relaxed: 1.5 },

  // ---- Letter spacing (points) ----
  letterSpacingScale: { normal: 0, wide: 0.5, wider: 1, widest: 2 },
};
