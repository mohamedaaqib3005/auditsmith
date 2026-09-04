// MOLECULE: one numeric score circle + caption (Lighthouse categories).
import { View } from "@react-pdf/renderer";
import { Body, ScoreCircle } from "../atoms";
import { colors, space } from "../tokens";

export const ScoreItem = ({ label, score, max, display, size }) => (
  <View style={{ flex: 1, alignItems: "center", paddingHorizontal: space.xs }}>
    <ScoreCircle score={score} max={max} display={display} size={size} />
    <Body size="sm" color={colors.textMuted} style={{ marginTop: space.xs + 1, textAlign: "center" }}>
      {label}
    </Body>
  </View>
);

export default ScoreItem;
