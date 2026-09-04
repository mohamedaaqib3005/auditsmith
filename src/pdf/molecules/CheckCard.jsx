// MOLECULE: one check as a card - status icon, name, verdict, and an
// optional recommendation line. Generic: any section can emit these.
import { View } from "@react-pdf/renderer";
import { Body, Card, StatusIcon } from "../atoms";
import { colors, space } from "../tokens";

export const CheckCard = ({ check }) => (
  <Card style={{ marginBottom: space.sm }}>
    <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
      <View style={{ marginRight: space.md, marginTop: 1 }}>
        <StatusIcon rating={check.rating} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
          <Body bold>{check.label}</Body>
          {check.value && (
            <Body size="sm" color={colors.textMuted} style={{ textAlign: "right", maxWidth: 220 }}>
              {check.value}
            </Body>
          )}
        </View>
        {check.recommendation && (
          <Body size="base" color={colors.textMuted} style={{ marginTop: space.xxs + 1 }}>
            {check.recommendation}
          </Body>
        )}
      </View>
    </View>
  </Card>
);

export default CheckCard;
