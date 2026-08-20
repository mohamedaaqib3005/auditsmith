// src/pdf/blocks/FindingsBlock.jsx
// Finding cards: ID (mono), title, severity badge, category, impact, recommendation.

import { View, Text, StyleSheet } from "@react-pdf/renderer";
import { colors, severityColors, fonts } from "../styles/theme";

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    padding: 10,
    marginBottom: 8,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  titleWrap: {
    flex: 1,
    paddingRight: 8,
  },
  id: {
    fontSize: 8,
    fontFamily: fonts.mono,
    color: colors.textFaint,
    marginBottom: 1,
  },
  title: {
    fontSize: 10.5,
    fontFamily: fonts.heading,
    fontWeight: 700,
    color: colors.text,
  },
  badge: {
    borderRadius: 3,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 7.5,
    fontFamily: fonts.body,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  category: {
    fontSize: 8,
    color: colors.primary,
    fontFamily: fonts.body,
    fontWeight: 700,
    marginBottom: 3,
  },
  label: {
    fontSize: 8,
    fontFamily: fonts.body,
    fontWeight: 700,
    color: colors.textMuted,
  },
  bodyText: {
    fontSize: 9,
    fontFamily: fonts.body,
    lineHeight: 1.4,
    color: colors.text,
  },
  row: {
    marginBottom: 3,
  },
});

const SeverityBadge = ({ severity }) => {
  const palette = severityColors[severity] || severityColors.info;
  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }]}>
      <Text style={[styles.badgeText, { color: palette.text }]}>
        {severity}
      </Text>
    </View>
  );
};

const FindingCard = ({ finding }) => (
  <View style={styles.card} wrap={false}>
    <View style={styles.topRow}>
      <View style={styles.titleWrap}>
        {finding.id && <Text style={styles.id}>{finding.id}</Text>}
        <Text style={styles.title}>{finding.title}</Text>
      </View>
      <SeverityBadge severity={finding.severity} />
    </View>

    {finding.category && (
      <Text style={styles.category}>{finding.category}</Text>
    )}

    {finding.description && (
      <View style={styles.row}>
        <Text style={styles.bodyText}>{finding.description}</Text>
      </View>
    )}

    {finding.impact && (
      <View style={styles.row}>
        <Text style={styles.bodyText}>
          <Text style={styles.label}>Impact: </Text>
          {finding.impact}
        </Text>
      </View>
    )}

    {finding.recommendation && (
      <View style={styles.row}>
        <Text style={styles.bodyText}>
          <Text style={styles.label}>Recommendation: </Text>
          {finding.recommendation}
        </Text>
      </View>
    )}
  </View>
);

const FindingsBlock = ({ items = [] }) => (
  <View>
    {items.map((finding, i) => (
      <FindingCard key={finding.id || i} finding={finding} />
    ))}
  </View>
);

export default FindingsBlock;
