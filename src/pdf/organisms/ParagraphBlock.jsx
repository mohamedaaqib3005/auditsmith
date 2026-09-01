// ORGANISM: type "paragraph".
import { Body } from "../atoms";
import { space } from "../tokens";

export const ParagraphBlock = ({ text }) => (
  <Body style={{ marginBottom: space.md }}>{text}</Body>
);

export default ParagraphBlock;
