// src/pdf/blocks/BasicBlocks.jsx
// The four original block types, moved out of ReportDocument
// so all blocks live in one folder.

import { View, Text, StyleSheet } from "@react-pdf/renderer";
import { colors, fonts } from "../styles/theme";

const styles = StyleSheet.create({
  heading: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: colors.primary,
    marginTop: 16,
    marginBottom: 6,
  },
  paragraph: {
    lineHeight: 1.4,
    marginBottom: 8,
  },

  kvContainer: {
    backgroundColor: colors.bgLight,
    borderRadius: 4,
    padding: 12,
    marginBottom: 10,
  },
  kvRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  kvLabel: {
    width: 90,
    fontFamily: fonts.bold,
    color: colors.primary,
  },
  kvValue: {
    flex: 1,
  },

  table: {
    marginBottom: 10,
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: colors.primary,
  },
  tableHeaderCell: {
    flex: 1,
    padding: 6,
    color: colors.white,
    fontFamily: fonts.bold,
    fontSize: 9,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableRowAlt: {
    backgroundColor: colors.bgAlt,
  },
  tableCell: {
    flex: 1,
    padding: 6,
    fontSize: 9,
  },
});

export const HeadingBlock = ({ text }) => (
  <Text style={styles.heading}>{text}</Text>
);

export const ParagraphBlock = ({ text }) => (
  <Text style={styles.paragraph}>{text}</Text>
);

export const KeyValueBlock = ({ items = [] }) => (
  <View style={styles.kvContainer} wrap={false}>
    {items.map((item, i) => (
      <View style={styles.kvRow} key={i}>
        <Text style={styles.kvLabel}>{item.label}</Text>
        <Text style={styles.kvValue}>{item.value}</Text>
      </View>
    ))}
  </View>
);

export const TableBlock = ({ columns = [], rows = [] }) => (
  <View style={styles.table}>
    <View style={styles.tableHeaderRow} fixed>
      {columns.map((col, i) => (
        <Text style={styles.tableHeaderCell} key={i}>
          {col}
        </Text>
      ))}
    </View>
    {rows.map((row, ri) => (
      <View
        style={[styles.tableRow, ri % 2 === 1 && styles.tableRowAlt]}
        key={ri}
        wrap={false}
      >
        {row.map((cell, ci) => (
          <Text style={styles.tableCell} key={ci}>
            {cell}
          </Text>
        ))}
      </View>
    ))}
  </View>
);
