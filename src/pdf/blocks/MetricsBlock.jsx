// src/pdf/blocks/MetricsBlock.jsx
// Metric rows: coloured rating dot + label, value in Geist Mono.

import { View, Text, StyleSheet } from "@react-pdf/renderer";
import { colors, ratingColors, fonts } from "../styles/theme";

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bgLight,
    borderRadius: 4,
    padding: 12,
    marginBottom: 10,
  },
  blockTitle: {
    fontSize: 9,
    fontFamily: fonts.body,
    fontWeight: 700,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingRight: 8,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 6,
  },
  label: {
    fontSize: 9.5,
    fontFamily: fonts.body,
    color: colors.text,
  },
  value: {
    fontSize: 10,
    fontFamily: fonts.mono,
  },
});

const MetricsBlock = ({ title, items = [] }) => (
  <View style={styles.container} wrap={false}>
    {title && <Text style={styles.blockTitle}>{title}</Text>}
    {items.map((item, i) => {
      const rating = ratingColors[item.rating] || ratingColors.na;
      return (
        <View style={styles.row} key={i}>
          <View style={styles.left}>
            <View style={[styles.dot, { backgroundColor: rating.color }]} />
            <Text style={styles.label}>{item.label}</Text>
          </View>
          <Text style={[styles.value, { color: rating.color }]}>
            {item.value}
          </Text>
        </View>
      );
    })}
  </View>
);

export default MetricsBlock;
