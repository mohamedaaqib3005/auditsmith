// ORGANISM: type "checks" - a stack of check cards.
// JSON contract:
// { "type": "checks",
//   "items": [{ "label": "llms.txt", "value": "No file found",
//               "rating": "poor", "recommendation": "Add an llms.txt..." }] }
import { View } from "@react-pdf/renderer";
import { CheckCard } from "../molecules";

export const ChecksBlock = ({ items = [] }) => (
  <View>
    {items.map((check, i) => (
      <CheckCard key={i} check={check} />
    ))}
  </View>
);

export default ChecksBlock;
