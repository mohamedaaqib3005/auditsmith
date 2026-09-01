// ORGANISM: type "scorecard".
import { View } from "@react-pdf/renderer";
import { ScoreItem } from "../molecules";
import { space } from "../tokens";

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

export default ScorecardBlock;
