// ATOM: soft tinted container surface.
import { View } from "@react-pdf/renderer";
import { colors, radii, space } from "../tokens";

export const TintedBox = ({ children, style }) => (
  <View
    wrap={false}
    style={[
      {
        backgroundColor: colors.primarySoft,
        borderRadius: radii.md,
        padding: space.xl,
        marginBottom: space.lg,
      },
      style,
    ]}
  >
    {children}
  </View>
);

export default TintedBox;
