// src/pdf/templates/CoverPage.jsx
// TEMPLATE: the cover. Composes atoms on the primary surface.

import { Page, View, Text } from "@react-pdf/renderer";
import { Heading, Body, Mono, Label } from "../atoms";
import { colors, fonts, fontSizes, space, borders, lineHeights, letterSpacing } from "../tokens";


/**
 * One column of the cover's bottom meta grid: an uppercase caption
 * over a value, on the primary (purple) surface. Renders nothing when
 * `value` is empty, so sibling columns (flex: 1 each) widen to fill.
 *
 * @param {object} props
 * @param {string} props.label - Caption shown above the value, rendered uppercase (e.g. "Prepared by").
 * @param {string | null | undefined} [props.value] - The content. Falsy → the whole column renders as null.
 * @param {boolean} [props.mono=false] - Typeface switch for the value: true → Geist Mono (ids, references), false → Manrope body.
 * @returns {JSX.Element | null} The column, or null when value is empty.
 *
 * @example
 * <MetaItem label="Reference" value="AUD-VLNCY-2026-001" mono />
 * @example
 * <MetaItem label="Prepared for" value={cover.preparedFor} />
 */
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


/**
@param { object } props
  * @param { object } props.cover - Cover content, typically composer - generated.
 * @param { string } [props.cover.reportType = "Audit Report"] - Uppercase kicker under the top rule.
 * @param { string } props.cover.title - The hero line, rendered at display size(the site, e.g. "vlncy.com").
 * @param { string } [props.cover.subtitle] - Supporting line under the title; omitted entirely when absent.Wraps within a 380pt column.
 * @param { string } [props.cover.date] - Meta grid: report date(composer auto - stamps today).
 * @param { string } [props.cover.reference] - Meta grid: report reference, rendered in mono(e.g. "AUD-VLNCY-2026-001").
 * @param { string } [props.cover.preparedBy] - Meta grid: author name.
 * @param { string } [props.cover.preparedFor] - Meta grid: client / brand name(composer derives it from the URL).
 * @returns { JSX.Element } One complete `<Page>` element.
 *
 * @example
  * // Inside a <Document>, before the content pages:
 * { data.cover && <CoverPage cover={data.cover} /> }
  *
 * @example
  * <CoverPage
 * cover={
  {
 * reportType: "Website Audit Report",
 * title: "vlncy.com",
 * subtitle: "Technical SEO, on-page SEO, AI readiness...",
 * date: "1 September 2026",
 * reference: "AUD-VLNCY-2026-001",
 * preparedBy: "Mohamed Aaqib",
 * preparedFor: "Vlncy",
 *   }
}
 * />
  */
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
