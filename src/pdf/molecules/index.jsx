// src/pdf/molecules/index.jsx
// MOLECULES: small compositions of atoms. Each is one repeatable row/card.

import { View } from "@react-pdf/renderer";
import {
  Heading,
  Body,
  Mono,
  Label,
  SeverityBadge,
  RatingDot,
  ScoreCircle,
  ratingColor,
  Card,
} from "../atoms";
import { colors, fonts, fontSizes, space } from "../tokens";

// One metric line: dot + label ........ value (mono, rating-coloured)
export const MetricRow = ({ label, value, rating }) => (
  <View
    style={{
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: space.xs + 1,
    }}
  >
    <View style={{ flexDirection: "row", alignItems: "center", flex: 1, paddingRight: space.md }}>
      <RatingDot rating={rating} />
      <Body size="md">{label}</Body>
    </View>
    <Mono size="lg" color={ratingColor(rating)}>
      {value}
    </Mono>
  </View>
);

// One label: value line for keyValue boxes
export const KeyValueRow = ({ label, value }) => (
  <View style={{ flexDirection: "row", marginBottom: space.xs }}>
    <Body bold color={colors.primary} style={{ width: 90 }}>
      {label}
    </Body>
    <Body style={{ flex: 1 }}>{value}</Body>
  </View>
);

// One score circle + caption, used in the scorecard row
export const ScoreItem = ({ label, score, max, display }) => (
  <View style={{ flex: 1, alignItems: "center", paddingHorizontal: space.xs }}>
    <ScoreCircle score={score} max={max} display={display} />
    <Body size="sm" color={colors.textMuted} style={{ marginTop: space.xs + 1, textAlign: "center" }}>
      {label}
    </Body>
  </View>
);

// One finding card: id, title, badge, category, impact, recommendation
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
