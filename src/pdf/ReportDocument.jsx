// src/pdf/ReportDocument.jsx
// The PDF is a pure function of the `data` prop.
// One component per block type + a mapper that switches on section.type.
// Later: blocks move to src/pdf/blocks/ and styles to src/pdf/styles/theme.js

import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from "@react-pdf/renderer";

// ---------- Styles ----------
const styles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 56,
    paddingHorizontal: 48,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1a1a1a",
  },

  // Header
  headerBar: {
    borderBottomWidth: 2,
    borderBottomColor: "#0f3d5c",
    paddingBottom: 12,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: "#0f3d5c",
  },
  subtitle: {
    fontSize: 12,
    color: "#555555",
    marginTop: 2,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  metaText: {
    fontSize: 8,
    color: "#888888",
  },

  // Blocks
  heading: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#0f3d5c",
    marginTop: 16,
    marginBottom: 6,
  },
  paragraph: {
    lineHeight: 1.4,
    marginBottom: 8,
  },

  // Key-value block
  kvContainer: {
    backgroundColor: "#f4f7f9",
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
    fontFamily: "Helvetica-Bold",
    color: "#0f3d5c",
  },
  kvValue: {
    flex: 1,
  },

  // Table block (built from flexbox rows)
  table: {
    marginBottom: 10,
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#0f3d5c",
  },
  tableHeaderCell: {
    flex: 1,
    padding: 6,
    color: "#ffffff",
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  tableRowAlt: {
    backgroundColor: "#f8f9fa",
  },
  tableCell: {
    flex: 1,
    padding: 6,
    fontSize: 9,
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 24,
    left: 48,
    right: 48,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    paddingTop: 6,
  },
  footerText: {
    fontSize: 8,
    color: "#999999",
  },
});

// ---------- Block components ----------
const HeadingBlock = ({ text }) => <Text style={styles.heading}>{text}</Text>;

const ParagraphBlock = ({ text }) => (
  <Text style={styles.paragraph}>{text}</Text>
);

const KeyValueBlock = ({ items = [] }) => (
  <View style={styles.kvContainer} wrap={false}>
    {items.map((item, i) => (
      <View style={styles.kvRow} key={i}>
        <Text style={styles.kvLabel}>{item.label}</Text>
        <Text style={styles.kvValue}>{item.value}</Text>
      </View>
    ))}
  </View>
);

const TableBlock = ({ columns = [], rows = [] }) => (
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

// ---------- The mapper: JSON type -> component ----------
const blockMap = {
  heading: HeadingBlock,
  paragraph: ParagraphBlock,
  keyValue: KeyValueBlock,
  table: TableBlock,
};

const SectionRenderer = ({ section }) => {
  const Block = blockMap[section.type];
  if (!Block) return null; // unknown types are skipped gracefully
  return <Block {...section} />;
};

// ---------- The document ----------
const ReportDocument = ({ data }) => (
  <Document title={data.meta.title}>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.headerBar}>
        <Text style={styles.title}>{data.meta.title}</Text>
        {data.meta.subtitle && (
          <Text style={styles.subtitle}>{data.meta.subtitle}</Text>
        )}
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>{data.meta.date}</Text>
          {data.meta.reference && (
            <Text style={styles.metaText}>Ref: {data.meta.reference}</Text>
          )}
        </View>
      </View>

      {/* Body: every section rendered from JSON */}
      {data.sections.map((section, i) => (
        <SectionRenderer key={i} section={section} />
      ))}

      {/* Footer with page numbers, repeats on every page */}
      <View style={styles.footer} fixed>
        <Text style={styles.footerText}>{data.meta.title}</Text>
        <Text
          style={styles.footerText}
          render={({ pageNumber, totalPages }) =>
            `Page ${pageNumber} of ${totalPages}`
          }
        />
      </View>
    </Page>
  </Document>
);

export default ReportDocument;
