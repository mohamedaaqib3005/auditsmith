// MOLECULE: one letter-grade circle + caption. Sibling of ScoreItem:
// same shape, different input (letter, coloured via gradeColor).
import { View } from "@react-pdf/renderer";
import { Body, ScoreCircle } from "../atoms";
import { colors, gradeColor, space } from "../tokens";

export const GradeItem = ({ label, grade, size = 44 }) => (
  <View style={{ flex: 1, alignItems: "center", paddingHorizontal: space.xs }}>
    <ScoreCircle display={grade} color={gradeColor(grade)} size={size} />
    <Body size="sm" color={colors.textMuted} style={{ marginTop: space.xs + 1, textAlign: "center" }}>
      {label}
    </Body>
  </View>
);

export default GradeItem;
