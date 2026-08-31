// src/pdf/tokens/spacing.js
// SEMANTIC SPACING & SHAPE - derived from global.js primitive scales.
// The component-facing keys are preserved exactly (same values as before),
// mapped onto the ds-style primitive ladder.

import { global } from "./global";

const s = global.spaceScale;

export const space = {
  xxs: s.xxs,      /* 2 */
  xs: s.xs,        /* 4 */
  sm: s.sm,        /* 6 */
  md: s.md,        /* 8 */
  lg: s.lg,        /* 10 */
  xl: s.xl,        /* 12 */
  "2xl": s["2xl"], /* 16 */
  "3xl": s["3xl"], /* 20 */
  "4xl": s["6xl"], /* 48 - page-level gap */
  "5xl": s["7xl"], /* 56 - cover padding */
};

export const radii = {
  sm: global.radiusScale.sm,
  md: global.radiusScale.md,
  full: global.radiusScale.full,
};

export const borders = global.borderScale;

export const page = global.pageFrame;
