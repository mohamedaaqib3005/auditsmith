// ORGANISM: type "radar" - dimension scores as a filled radar polygon.
// { "type": "radar", "items": [{ "label": "Performance", "pct": 42 }, ...] }
// Needs 3+ items; grid rings at 25/50/75/100, brand-tinted data polygon.
import { View, Svg, Polygon, Line, Text as SvgText } from "@react-pdf/renderer";
import { colors, fonts, fontSizes, space } from "../tokens";

const W = 380;
const H = 262;
const CX = W / 2;
const CY = H / 2;
const R = 78;

const point = (i, n, r) => {
  const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
  return [CX + r * Math.cos(angle), CY + r * Math.sin(angle)];
};
const ring = (n, frac) =>
  Array.from({ length: n }, (_, i) => point(i, n, R * frac).map((v) => v.toFixed(1)).join(",")).join(" ");

export const RadarBlock = ({ items = [] }) => {
  if (items.length < 3) return null;
  const n = items.length;
  const dataPoints = items
    .map((it, i) => point(i, n, (R * Math.max(0, Math.min(100, it.pct))) / 100))
    .map((p) => p.map((v) => v.toFixed(1)).join(","))
    .join(" ");
  return (
    <View wrap={false} style={{ alignItems: "center", marginTop: space.md, height: H + 8 }}>
      <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <Polygon key={f} points={ring(n, f)} fill="none" stroke={colors.border} strokeWidth={f === 1 ? 1 : 0.6} strokeDasharray="3 3" />
        ))}
        {items.map((_, i) => {
          const [x, y] = point(i, n, R);
          return <Line key={i} x1={CX} y1={CY} x2={x} y2={y} stroke={colors.border} strokeWidth={0.6} strokeDasharray="3 3" />;
        })}
        <Polygon points={dataPoints} fill={colors.primarySoft} fillOpacity={0.7} stroke={colors.primary} strokeWidth={2} />
        {items.map((it, i) => {
          const [x, y] = point(i, n, (R * Math.max(0, Math.min(100, it.pct))) / 100);
          return <Polygon key={i} points={`${x - 2.6},${y} ${x},${y - 2.6} ${x + 2.6},${y} ${x},${y + 2.6}`} fill={colors.primary} />;
        })}
        {items.map((it, i) => {
          const [x, y] = point(i, n, R + 14);
          const anchor = Math.abs(x - CX) < 8 ? "middle" : x < CX ? "end" : "start";
          return (
            <SvgText key={i} x={x} y={y + 3} textAnchor={anchor} style={{ fontFamily: fonts.body, fontSize: fontSizes.xs, fill: colors.textMuted }}>
              {it.label}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
};

export default RadarBlock;
