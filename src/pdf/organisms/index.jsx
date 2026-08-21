// src/pdf/organisms/index.jsx
// ORGANISMS: the JSON-facing blocks. Each maps to a "type" in the report JSON.
// They compose molecules and atoms; layout numbers come from tokens.
//
// To add a new section type:
// 1. Build the organism here (or in its own file and import it)
// 2. Add one line to blockMap at the bottom

import { View, Text } from "@react-pdf/renderer";
import { Heading, Body, Label, TintedBox } from "../atoms";
import { MetricRow, KeyValueRow, ScoreItem, FindingCard } from "../molecules";
import { colors, fonts, fontSizes, space, borders } from "../tokens";

// ---------- heading ----------
export const HeadingBlock = ({ text }) => (
  <Heading style={{ marginTop: space["2xl"], marginBottom: space.sm }}>
    {text}
  </Heading>
);

// ---------- paragraph ----------
export const ParagraphBlock = ({ text }) => (
  <Body style={{ marginBottom: space.md }}>{text}</Body>
);

// ---------- keyValue ----------
export const KeyValueBlock = ({ items = [] }) => (
  <TintedBox>
    {items.map((item, i) => (
      <KeyValueRow key={i} label={item.label} value={item.value} />
    ))}
  </TintedBox>
);

// ---------- metrics ----------
export const MetricsBlock = ({ title, items = [] }) => (
  <TintedBox>
    {title && <Label style={{ marginBottom: space.md }}>{title}</Label>}
    {items.map((item, i) => (
      <MetricRow key={i} {...item} />
    ))}
  </TintedBox>
);

// ---------- scorecard ----------
export const ScorecardBlock = ({ items = [] }) => (
  <View
    wrap={false}
    style={{
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: space.xxs,
      marginBottom: space.xl,
    }}
  >
    {items.map((item, i) => (
      <ScoreItem key={i} {...item} />
    ))}
  </View>
);

// ---------- findings ----------
export const FindingsBlock = ({ items = [] }) => (
  <View>
    {items.map((finding, i) => (
      <FindingCard key={finding.id || i} finding={finding} />
    ))}
  </View>
);

// ---------- table ----------
export const TableBlock = ({ columns = [], rows = [] }) => (
  <View style={{ marginBottom: space.lg }}>
    <View style={{ flexDirection: "row", backgroundColor: colors.primary }} fixed>
      {columns.map((col, i) => (
        <Text
          key={i}
          style={{
            flex: 1,
            padding: space.sm,
            color: colors.white,
            fontFamily: fonts.body,
            fontWeight: 700,
            fontSize: fontSizes.base,
          }}
        >
          {col}
        </Text>
      ))}
    </View>
    {rows.map((row, ri) => (
      <View
        key={ri}
        wrap={false}
        style={{
          flexDirection: "row",
          borderBottomWidth: borders.hairline,
          borderBottomColor: colors.border,
          backgroundColor: ri % 2 === 1 ? colors.bgAlt : undefined,
        }}
      >
        {row.map((cell, ci) => (
          <Text
            key={ci}
            style={{
              flex: 1,
              padding: space.sm,
              fontFamily: fonts.body,
              fontSize: fontSizes.base,
            }}
          >
            {cell}
          </Text>
        ))}
      </View>
    ))}
  </View>
);

// ---------- sectionDivider ----------
export const SectionDividerBlock = ({ number, title, description }) => (
  <View style={{ marginBottom: space["2xl"] + 2 }} break>
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-end",
        borderBottomWidth: borders.thick,
        borderBottomColor: colors.primary,
        paddingBottom: space.lg,
        marginBottom: space.lg,
      }}
    >
      {number && (
        <Text
          style={{
            fontFamily: fonts.mono,
            fontSize: fontSizes["5xl"],
            color: colors.primaryTint,
            marginRight: space.xl,
          }}
        >
          {number}
        </Text>
      )}
      <Heading size="4xl">{title}</Heading>
    </View>
    {description && (
      <Body color={colors.textMuted} style={{ maxWidth: 420 }}>
        {description}
      </Body>
    )}
  </View>
);

// ---------- THE REGISTRY ----------
export const blockMap = {
  heading: HeadingBlock,
  paragraph: ParagraphBlock,
  keyValue: KeyValueBlock,
  metrics: MetricsBlock,
  scorecard: ScorecardBlock,
  findings: FindingsBlock,
  table: TableBlock,
  sectionDivider: SectionDividerBlock,
};
