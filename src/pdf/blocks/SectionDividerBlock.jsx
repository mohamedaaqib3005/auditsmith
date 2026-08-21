// src/pdf/blocks/SectionDividerBlock.jsx
// Renders sections of type "sectionDivider".
// Starts a new page and opens a chapter: big number, title, description.
// Fields: number ("01"), title, description (optional).

import { View, Text, StyleSheet } from "@react-pdf/renderer";
import { colors, fonts } from "../styles/theme";

const styles = StyleSheet.create({
  container: {
    marginBottom: 18,
  },
  numberRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    paddingBottom: 10,
    marginBottom: 10,
  },
  number: {
    fontSize: 30,
    fontFamily: fonts.mono,
    color: "#c9aede",
    marginRight: 12,
  },
  title: {
    fontSize: 22,
    fontFamily: fonts.heading,
    fontWeight: 700,
    color: colors.primary,
  },
  description: {
    fontSize: 10,
    fontFamily: fonts.body,
    color: colors.textMuted,
    lineHeight: 1.5,
    maxWidth: 420,
  },
});

const SectionDividerBlock = ({ number, title, description }) => (
  <View style={styles.container} break>
    <View style={styles.numberRow}>
      {number && <Text style={styles.number}>{number}</Text>}
      <Text style={styles.title}>{title}</Text>
    </View>
    {description && <Text style={styles.description}>{description}</Text>}
  </View>
);

export default SectionDividerBlock;
