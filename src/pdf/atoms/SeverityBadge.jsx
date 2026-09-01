// ATOM: coloured severity pill.
import { View, Text } from "@react-pdf/renderer";
import { severityColors, fonts, fontSizes, radii, letterSpacing, space } from "../tokens";

export const SeverityBadge = ({ severity }) => {
  const palette = severityColors[severity] || severityColors.info;
  return (
    <View
      style={{
        backgroundColor: palette.bg,
        borderRadius: radii.sm,
        paddingVertical: space.xxs,
        paddingHorizontal: space.sm,
      }}
    >
      <Text
        style={{
          fontFamily: fonts.body,
          fontWeight: 700,
          fontSize: fontSizes.xs,
          textTransform: "uppercase",
          letterSpacing: letterSpacing.wide,
          color: palette.text,
        }}
      >
        {severity}
      </Text>
    </View>
  );
};

export default SeverityBadge;
