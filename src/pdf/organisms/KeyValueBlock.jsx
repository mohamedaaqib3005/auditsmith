// ORGANISM: type "keyValue".
import { TintedBox } from "../atoms";
import { KeyValueRow } from "../molecules";

export const KeyValueBlock = ({ items = [] }) => (
  <TintedBox>
    {items.map((item, i) => (
      <KeyValueRow key={i} label={item.label} value={item.value} />
    ))}
  </TintedBox>
);

export default KeyValueBlock;
