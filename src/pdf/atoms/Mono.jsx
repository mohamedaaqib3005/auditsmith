// ATOM: monospace text - Geist Mono. Ids, references, numeric values.
import { Text } from "@react-pdf/renderer";
import { colors, fonts, fontSizes } from "../tokens";

export const Mono = ({ children, size = "sm", color = colors.textFaint, style }) => (
  <Text style={[{ fontFamily: fonts.mono, fontSize: fontSizes[size], color }, style]}>
    {children}
  </Text>
);

export default Mono;
