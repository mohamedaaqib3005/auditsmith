// src/pdf/templates/ReportDocument.jsx
// TEMPLATE: the document shell. Cover (optional) + content pages with
// header and footer. Content comes from organisms via the blockMap.

import { Document, Page, View, Text } from "@react-pdf/renderer";
import { blockMap } from "../organisms";
import CoverPage from "./CoverPage";
import { Heading, Body, Mono } from "../atoms";
import { colors, fonts, fontSizes, space, borders, page } from "../tokens";

const SectionRenderer = ({ section }) => {
  const Block = blockMap[section.type];// fetch the function into a variable
  //   export const blockMap = {
  //   heading: HeadingBlock,
  //   metrics: MetricsBlock,
  //   findings: FindingsBlock,
  //   // ...nine entries
  // };
  if (!Block) return null; // unknown types are skipped gracefully
  return <Block {...section} />;
};

const ReportDocument = ({ data }) => (
  <Document title={data.meta.title}>
    {data.cover && <CoverPage cover={data.cover} />}

    <Page
      size="A4"
      style={{
        paddingTop: page.paddingTop,
        paddingBottom: page.paddingBottom,
        paddingHorizontal: page.paddingHorizontal,
        fontSize: fontSizes.lg,
        fontFamily: fonts.body,
        color: colors.text,
      }}
    >
      {/* Header */}
      <View
        style={{
          borderBottomWidth: borders.thick,
          borderBottomColor: colors.primary,
          paddingBottom: space.xl,
          marginBottom: space["3xl"],
        }}
      >
        <Heading size="3xl">{data.meta.title}</Heading>
        {data.meta.subtitle && (
          <Body size="xl" color={colors.textMuted} style={{ marginTop: space.xxs }}>
            {data.meta.subtitle}
          </Body>
        )}
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: space.md }}>
          <Body size="sm" color={colors.textFaint}>{data.meta.date}</Body>
          {data.meta.reference && (
            <Mono>Ref: {data.meta.reference}</Mono>
          )}
        </View>
      </View>

      {/* Body */}
      {data.sections.map((section, i) => (
        <SectionRenderer key={i} section={section} />
      ))}

      {/* Footer */}
      <View
        fixed
        style={{
          position: "absolute",
          bottom: page.footerBottom,
          left: page.paddingHorizontal,
          right: page.paddingHorizontal,
          flexDirection: "row",
          justifyContent: "space-between",
          borderTopWidth: borders.hairline,
          borderTopColor: colors.border,
          paddingTop: space.sm,
        }}
      >
        <Body size="sm" color={colors.textFaint}>{data.meta.title}</Body>
        <Text
          style={{ fontFamily: fonts.body, fontSize: fontSizes.sm, color: colors.textFaint }}
          render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
        />
      </View>
    </Page>
  </Document>
);

export default ReportDocument;

{/* <Document> --> react pdf root element */ }
{/* <Page> --> react pdf single page element */ }
{/* <View> --> react pdf div equivalent */ }