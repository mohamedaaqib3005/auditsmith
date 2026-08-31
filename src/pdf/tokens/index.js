// src/pdf/tokens/index.js
// Single import point for all design tokens:
//   import { colors, fonts, space } from "../tokens";
// Note: global.js is intentionally NOT exported here. Components must use
// the semantic tokens; only the token files themselves read global.

export * from "./colors";
export * from "./typography";
export * from "./spacing";
