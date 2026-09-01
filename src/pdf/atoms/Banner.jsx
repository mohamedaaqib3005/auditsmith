// ATOM: full-width filled strip with an uppercase label.
import { View } from "@react-pdf/renderer";
import Label from "./Label";
import { colors, fontSizes, radii, space } from "../tokens";

export const Banner = ({ children, color = colors.primary, textColor = colors.onPrimary }) => (
  <View
    style={{
      backgroundColor: color,
      borderRadius: radii.md,
      paddingVertical: space.md,
      paddingHorizontal: space.xl,
      marginTop: space.lg,
      marginBottom: space["2xl"],
    }}
  >
    <Label color={textColor} style={{ fontSize: fontSizes.md + 1.5 }}>
      {children}
    </Label>
  </View>
);

export default Banner;
