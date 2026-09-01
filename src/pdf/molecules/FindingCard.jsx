// MOLECULE: one finding card - id, title, badge, category, impact, recommendation.
import { View } from "@react-pdf/renderer";
import { Heading, Body, Mono, SeverityBadge, Card } from "../atoms";
import { colors, fontSizes, space } from "../tokens";

export const FindingCard = ({ finding }) => (
  <Card>
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: space.xs,
      }}
    >
      <View style={{ flex: 1, paddingRight: space.md }}>
        {finding.id && <Mono style={{ marginBottom: 1 }}>{finding.id}</Mono>}
        <Heading size="lg" color={colors.text} style={{ fontSize: fontSizes.lg + 0.5 }}>
          {finding.title}
        </Heading>
      </View>
      <SeverityBadge severity={finding.severity} />
    </View>

    {finding.category && (
      <Body size="sm" bold color={colors.primary} style={{ marginBottom: space.xxs + 1 }}>
        {finding.category}
      </Body>
    )}

    {finding.description && (
      <Body size="base" style={{ marginBottom: space.xxs + 1 }}>
        {finding.description}
      </Body>
    )}

    {finding.impact && (
      <Body size="base" style={{ marginBottom: space.xxs + 1 }}>
        <Body size="sm" bold color={colors.textMuted}>Impact: </Body>
        {finding.impact}
      </Body>
    )}

    {finding.recommendation && (
      <Body size="base">
        <Body size="sm" bold color={colors.textMuted}>Recommendation: </Body>
        {finding.recommendation}
      </Body>
    )}
  </Card>
);

export default FindingCard;
