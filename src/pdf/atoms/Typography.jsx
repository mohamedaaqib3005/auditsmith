// src/pdf/atoms/Typography.jsx
// ATOMS: the four text primitives every component builds from.
// Pass a style prop to extend, e.g. <Body style={{ color: colors.white }}>

import { Text } from "@react-pdf/renderer";
import { colors, fonts, fontSizes, lineHeights, letterSpacing } from "../tokens";

// Section/heading text: Cabinet Grotesk, bold, brand colour
export const Heading = ({ children, size = "2xl", color = colors.primary, style }) => (
  <Text
    style={[
      {
        fontFamily: fonts.heading,
        fontWeight: 700,
        fontSize: fontSizes[size],
        color,
      },
      style,
    ]}
  >
    {children}
  </Text>
);

// Body copy: Manrope
export const Body = ({ children, size = "lg", bold = false, color = colors.text, style }) => (
  <Text
    style={[
      {
        fontFamily: fonts.body,
        fontWeight: bold ? 700 : 400,
        fontSize: fontSizes[size],
        lineHeight: lineHeights.normal,
        color,
      },
      style,
    ]}
  >
    {children}
  </Text>
);

// Numbers, ids, references: Geist Mono
export const Mono = ({ children, size = "sm", color = colors.textFaint, style }) => (
  <Text
    style={[
      {
        fontFamily: fonts.mono,
        fontSize: fontSizes[size],
        color,
      },
      style,
    ]}
  >
    {children}
  </Text>
);

// Small uppercase label: box titles, meta labels
export const Label = ({ children, color = colors.textMuted, style }) => (
  <Text
    style={[
      {
        fontFamily: fonts.body,
        fontWeight: 700,
        fontSize: fontSizes.sm + 1,
        textTransform: "uppercase",
        letterSpacing: letterSpacing.wide,
        color,
      },
      style,
    ]}
  >
    {children}
  </Text>
);
