// src/pdf/templates/CoverPage.jsx
// TEMPLATE: the cover. Composes atoms on the primary surface.

import { Page, View, Text } from "@react-pdf/renderer";
import { Heading, Body, Mono, Label } from "../atoms";
import { colors, fonts, fontSizes, space, borders, lineHeights, letterSpacing } from "../tokens";

const MetaItem = ({ label, value, mono }) =>
  value ? (
    <View style={{ flex: 1, paddingRight: space.xl }}>
      <Label
        color={colors.onPrimaryFaint}
        style={{ fontSize: fontSizes.xs, letterSpacing: letterSpacing.wider, marginBottom: space.xxs + 1 }}
      >
        {label}
      </Label>
      {mono ? (
        <Mono size="md" color={colors.onPrimary}>{value}</Mono>
      ) : (
        <Body size="md" color={colors.onPrimary}>{value}</Body>
      )}
    </View>
  ) : null;

const CoverPage = ({ cover }) => (
  <Page
    size="A4"
    style={{
      backgroundColor: colors.primary,
      padding: space["5xl"],
      flexDirection: "column",
      justifyContent: "space-between",
    }}
  >
    <View>
      <View style={{ borderTopWidth: borders.thick, borderTopColor: colors.onPrimary, width: 64 }} />
      <Text
        style={{
          fontFamily: fonts.body,
          fontWeight: 700,
          fontSize: fontSizes.md + 1.5,
          textTransform: "uppercase",
          letterSpacing: letterSpacing.widest,
          color: colors.onPrimaryMuted,
          marginTop: space["2xl"] - 2,
        }}
      >
        {cover.reportType || "Audit Report"}
      </Text>
    </View>

    <View style={{ marginTop: -40 }}>
      <Heading size="display" color={colors.onPrimary} style={{ lineHeight: lineHeights.tight }}>
        {cover.title}
      </Heading>
      {cover.subtitle && (
        <Body
          size="xl"
          color={colors.onPrimaryMuted}
          style={{ marginTop: space.lg, maxWidth: 380 }}
        >
          {cover.subtitle}
        </Body>
      )}
    </View>

    <View
      style={{
        flexDirection: "row",
        borderTopWidth: borders.hairline,
        borderTopColor: colors.onPrimaryBorder,
        paddingTop: space["2xl"],
      }}
    >
      <MetaItem label="Date" value={cover.date} />
      <MetaItem label="Reference" value={cover.reference} mono />
      <MetaItem label="Prepared by" value={cover.preparedBy} />
      <MetaItem label="Prepared for" value={cover.preparedFor} />
    </View>
  </Page>
);

export default CoverPage;
