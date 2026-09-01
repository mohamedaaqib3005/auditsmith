// ATOM: body copy - Manrope.
import { Text } from "@react-pdf/renderer";
import { colors, fonts, fontSizes, lineHeights } from "../tokens";

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

export default Body;
