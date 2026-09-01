// ORGANISM: type "sectionDivider". Starts a new page, opens a chapter.
import { View, Text } from "@react-pdf/renderer";
import { Heading, Body } from "../atoms";
import { colors, fonts, fontSizes, space, borders } from "../tokens";

export const SectionDividerBlock = ({ number, title, description }) => (
  <View style={{ marginBottom: space["2xl"] + 2 }} break>
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-end",
        borderBottomWidth: borders.thick,
        borderBottomColor: colors.primary,
        paddingBottom: space.lg,
        marginBottom: space.lg,
      }}
    >
      {number && (
        <Text
          style={{
            fontFamily: fonts.mono,
            fontSize: fontSizes["5xl"],
            color: colors.primaryTint,
            marginRight: space.xl,
          }}
        >
          {number}
        </Text>
      )}
      <Heading size="4xl">{title}</Heading>
    </View>
    {description && (
      <Body color={colors.textMuted} style={{ maxWidth: 420 }}>
        {description}
      </Body>
    )}
  </View>
);

export default SectionDividerBlock;
