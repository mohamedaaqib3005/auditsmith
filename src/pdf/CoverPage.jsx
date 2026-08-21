// src/pdf/CoverPage.jsx
// Full-bleed brand cover. Rendered by ReportDocument when data.cover exists.
// Fields: reportType, title, subtitle, date, reference, preparedBy, preparedFor.

import { Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { colors, fonts } from "./styles/theme";

const styles = StyleSheet.create({
  page: {
    backgroundColor: colors.primary,
    padding: 56,
    color: colors.white,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  topRule: {
    borderTopWidth: 2,
    borderTopColor: "#ffffff",
    opacity: 0.9,
    width: 64,
  },
  reportType: {
    fontSize: 11,
    fontFamily: fonts.body,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 2,
    color: "#d9c7ea",
    marginTop: 14,
  },
  centerBlock: {
    marginTop: -40,
  },
  title: {
    fontSize: 40,
    fontFamily: fonts.heading,
    fontWeight: 700,
    color: colors.white,
    lineHeight: 1.1,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: fonts.body,
    color: "#d9c7ea",
    marginTop: 10,
    lineHeight: 1.4,
    maxWidth: 380,
  },
  metaGrid: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#6d3396",
    paddingTop: 16,
  },
  metaCol: {
    flex: 1,
    paddingRight: 12,
  },
  metaLabel: {
    fontSize: 7.5,
    fontFamily: fonts.body,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "#b795d1",
    marginBottom: 3,
  },
  metaValue: {
    fontSize: 9.5,
    fontFamily: fonts.body,
    color: colors.white,
  },
  metaValueMono: {
    fontSize: 9.5,
    fontFamily: fonts.mono,
    color: colors.white,
  },
});

const MetaItem = ({ label, value, mono }) =>
  value ? (
    <View style={styles.metaCol}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={mono ? styles.metaValueMono : styles.metaValue}>
        {value}
      </Text>
    </View>
  ) : null;

const CoverPage = ({ cover }) => (
  <Page size="A4" style={styles.page}>
    {/* Top: mark */}
    <View>
      <View style={styles.topRule} />
      <Text style={styles.reportType}>
        {cover.reportType || "Audit Report"}
      </Text>
    </View>

    {/* Middle: title */}
    <View style={styles.centerBlock}>
      <Text style={styles.title}>{cover.title}</Text>
      {cover.subtitle && <Text style={styles.subtitle}>{cover.subtitle}</Text>}
    </View>

    {/* Bottom: meta grid */}
    <View style={styles.metaGrid}>
      <MetaItem label="Date" value={cover.date} />
      <MetaItem label="Reference" value={cover.reference} mono />
      <MetaItem label="Prepared by" value={cover.preparedBy} />
      <MetaItem label="Prepared for" value={cover.preparedFor} />
    </View>
  </Page>
);

export default CoverPage;
