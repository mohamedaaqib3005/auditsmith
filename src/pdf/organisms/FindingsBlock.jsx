// ORGANISM: type "findings".
import { View } from "@react-pdf/renderer";
import { FindingCard } from "../molecules";

export const FindingsBlock = ({ items = [] }) => (
  <View>
    {items.map((finding, i) => (
      <FindingCard key={finding.id || i} finding={finding} />
    ))}
  </View>
);

export default FindingsBlock;
