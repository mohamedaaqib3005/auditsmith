// ORGANISM: type "heading".
import { View } from "@react-pdf/renderer";
import { Heading } from "../atoms";
import { space } from "../tokens";

export const HeadingBlock = ({ text }) => (
  <View minPresenceAhead={140}>
    <Heading style={{ marginTop: space["2xl"], marginBottom: space.sm }}>{text}</Heading>
  </View>
);

export default HeadingBlock;
