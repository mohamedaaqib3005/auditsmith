// ORGANISM: type "metrics".
import { Label, TintedBox } from "../atoms";
import { MetricRow } from "../molecules";
import { space } from "../tokens";

export const MetricsBlock = ({ title, items = [] }) => (
  <TintedBox>
    {title && <Label style={{ marginBottom: space.md }}>{title}</Label>}
    {items.map((item, i) => (
      <MetricRow key={i} {...item} />
    ))}
  </TintedBox>
);

export default MetricsBlock;
