// MOLECULE: one label/value line for keyValue boxes.
import { View } from "@react-pdf/renderer";
import { Body } from "../atoms";
import { colors, space } from "../tokens";

export const KeyValueRow = ({ label, value }) => (
  <View style={{ flexDirection: "row", marginBottom: space.xs }}>
    <Body bold color={colors.primary} style={{ width: 90 }}>
      {label}
    </Body>
    <Body style={{ flex: 1 }}>{value}</Body>
  </View>
);

export default KeyValueRow;
