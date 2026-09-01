// ATOM: small uppercase label - box titles, meta labels.
import { Text } from "@react-pdf/renderer";
import { colors, fonts, fontSizes, letterSpacing } from "../tokens";

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

export default Label;
