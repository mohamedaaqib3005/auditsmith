// src/pdf/ReportDocument.jsx
// Document shell: cover page (optional), content pages with header + footer.

import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { blockMap } from "./blocks";
import CoverPage from "./CoverPage";
import { colors, fonts } from "./styles/theme";

const styles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 56,
    paddingHorizontal: 48,
    fontSize: 10,
    fontFamily: fonts.body,
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
    fontFamily: fonts.heading,
    fontWeight: 700,
    color: colors.primary,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: fonts.body,
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
    fontFamily: fonts.body,
    color: colors.textFaint,
  },
  metaMono: {
    fontSize: 8,
    fontFamily: fonts.mono,
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
    fontFamily: fonts.body,
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
    {data.cover && <CoverPage cover={data.cover} />}

    <Page size="A4" style={styles.page}>
      <View style={styles.headerBar}>
        <Text style={styles.title}>{data.meta.title}</Text>
        {data.meta.subtitle && (
          <Text style={styles.subtitle}>{data.meta.subtitle}</Text>
        )}
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>{data.meta.date}</Text>
          {data.meta.reference && (
            <Text style={styles.metaMono}>Ref: {data.meta.reference}</Text>
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
