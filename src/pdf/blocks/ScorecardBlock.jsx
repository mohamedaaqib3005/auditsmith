// src/pdf/blocks/ScorecardBlock.jsx
// Renders sections of type "scorecard".
// Each item: label, score, max (default 100), optional display override.
// Colour follows Lighthouse bands: 0-49 red, 50-89 amber, 90-100 green.

import { View, Text, StyleSheet } from "@react-pdf/renderer";
import { colors, scoreColor, fonts } from "../styles/theme";

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    marginTop: 2,
  },
  item: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 4,
  },
  circle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 5,
  },
  score: {
    fontSize: 14,
    fontFamily: fonts.bold,
  },
  label: {
    fontSize: 8,
    color: colors.textMuted,
    textAlign: "center",
  },
});

const ScorecardBlock = ({ items = [] }) => (
  <View style={styles.row} wrap={false}>
    {items.map((item, i) => {
      const max = item.max ?? 100;
      const color = scoreColor(item.score, max);
      return (
        <View style={styles.item} key={i}>
          <View style={[styles.circle, { borderColor: color }]}>
            <Text style={[styles.score, { color }]}>
              {item.display ?? item.score}
            </Text>
          </View>
          <Text style={styles.label}>{item.label}</Text>
        </View>
      );
    })}
  </View>
);

export default ScorecardBlock;
