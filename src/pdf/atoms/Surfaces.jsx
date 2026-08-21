// src/pdf/atoms/Surfaces.jsx
// ATOMS: container surfaces. TintedBox (soft background) and Card (bordered).

import { View } from "@react-pdf/renderer";
import { colors, radii, space, borders } from "../tokens";

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
