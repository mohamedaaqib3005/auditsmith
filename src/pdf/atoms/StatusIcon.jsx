// ATOM: filled status circle with a drawn glyph - check, exclamation, cross.
// Glyphs are SVG paths (not font characters) so they render identically
// regardless of embedded fonts. Colour comes from the rating system.
import { Svg, Path, Circle } from "@react-pdf/renderer";
import { ratingColors } from "../tokens";

// rating -> glyph: good=check, needs-improvement=exclamation, poor=cross, na=dash
const GLYPHS = {
  good: (s) => <Path d={`M ${s * 0.28} ${s * 0.52} L ${s * 0.44} ${s * 0.68} L ${s * 0.73} ${s * 0.34}`} stroke="#fff" strokeWidth={s * 0.09} strokeLineCap="round" fill="none" />,
  "needs-improvement": (s) => (
    <>
      <Path d={`M ${s * 0.5} ${s * 0.26} L ${s * 0.5} ${s * 0.58}`} stroke="#fff" strokeWidth={s * 0.1} strokeLineCap="round" />
      <Circle cx={s * 0.5} cy={s * 0.74} r={s * 0.055} fill="#fff" />
    </>
  ),
  poor: (s) => (
    <>
      <Path d={`M ${s * 0.34} ${s * 0.34} L ${s * 0.66} ${s * 0.66}`} stroke="#fff" strokeWidth={s * 0.09} strokeLineCap="round" />
      <Path d={`M ${s * 0.66} ${s * 0.34} L ${s * 0.34} ${s * 0.66}`} stroke="#fff" strokeWidth={s * 0.09} strokeLineCap="round" />
    </>
  ),
  na: (s) => <Path d={`M ${s * 0.32} ${s * 0.5} L ${s * 0.68} ${s * 0.5}`} stroke="#fff" strokeWidth={s * 0.09} strokeLineCap="round" />,
};

export const StatusIcon = ({ rating, size = 16 }) => {
  const r = ratingColors[rating] || ratingColors.na;
  const glyph = GLYPHS[rating] || GLYPHS.na;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={r.color} />
      {glyph(size)}
    </Svg>
  );
};

export default StatusIcon;
