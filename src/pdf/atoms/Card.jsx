// ATOM: bordered card container.
import { View } from "@react-pdf/renderer";
import { colors, radii, space, borders } from "../tokens";

export const Card = ({ children, style }) => (
  <View
    wrap={false}
    style={[
      {
        borderWidth: borders.hairline,
        borderColor: colors.border,
        borderRadius: radii.md,
        padding: space.lg,
        marginBottom: space.md,
      },
      style,
    ]}
  >
    {children}
  </View>
);

export default Card;
