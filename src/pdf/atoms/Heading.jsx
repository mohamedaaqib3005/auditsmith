// ATOM: heading text - Cabinet Grotesk, bold, brand colour by default.
import { Text } from "@react-pdf/renderer";
import { colors, fonts, fontSizes } from "../tokens";

export const Heading = ({ children, size = "2xl", color = colors.primary, style }) => (
  <Text
    style={[
      { fontFamily: fonts.heading, fontWeight: 700, fontSize: fontSizes[size], color },
      style,
    ]}
  >
    {children}
  </Text>
);

export default Heading;
