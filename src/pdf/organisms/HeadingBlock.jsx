// ORGANISM: type "heading".
import { Heading } from "../atoms";
import { space } from "../tokens";

export const HeadingBlock = ({ text }) => (
  <Heading style={{ marginTop: space["2xl"], marginBottom: space.sm }}>{text}</Heading>
);

export default HeadingBlock;
