// ORGANISM: type "auditResults" - banner, hero grade, sub-grade row.
// JSON contract:
// { "type": "auditResults", "banner": "Audit Results",
//   "overall": { "grade": "C", "caption": "Your page could be better" },
//   "grades": [{ "label": "On-Page SEO", "grade": "C+" }, ...] }
import { View } from "@react-pdf/renderer";
import { Heading, Banner, ScoreCircle } from "../atoms";
import { GradeItem } from "../molecules";
import { colors, gradeColor, space } from "../tokens";

export const AuditResultsBlock = ({ banner, overall, grades = [] }) => (
  <View wrap={false}>
    {banner && <Banner>{banner}</Banner>}

    {overall && (
      <View style={{ alignItems: "center", marginBottom: space["2xl"] }}>
        <ScoreCircle display={overall.grade} color={gradeColor(overall.grade)} size={90} />
        {overall.caption && (
          <Heading size="2xl" color={colors.text} style={{ marginTop: space.lg }}>
            {overall.caption}
          </Heading>
        )}
      </View>
    )}

    {grades.length > 0 && (
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: space.xl }}>
        {grades.map((g, i) => (
          <GradeItem key={i} {...g} />
        ))}
      </View>
    )}
  </View>
);

export default AuditResultsBlock;
