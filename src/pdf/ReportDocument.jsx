// src/pdf/ReportDocument.jsx
// The document shell: header, footer, page setup.
// All content blocks come from ./blocks via the blockMap registry.

import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { blockMap } from "./blocks";
import { colors, fonts } from "./styles/theme";

const styles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 56,
    paddingHorizontal: 48,
    fontSize: 10,
    fontFamily: fonts.regular,
    color: colors.text,
  },
  headerBar: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    paddingBottom: 12,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.primary,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  metaText: {
    fontSize: 8,
    color: colors.textFaint,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 48,
    right: 48,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 6,
  },
  footerText: {
    fontSize: 8,
    color: colors.textFaint,
  },
});

const SectionRenderer = ({ section }) => {
  const Block = blockMap[section.type];
  if (!Block) return null; // unknown types are skipped gracefully
  return <Block {...section} />;
};

const ReportDocument = ({ data }) => (
  <Document title={data.meta.title}>
    <Page size="A4" style={styles.page}>
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

      {data.sections.map((section, i) => (
        <SectionRenderer key={i} section={section} />
      ))}

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
