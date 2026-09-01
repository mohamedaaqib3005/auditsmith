// ATOM: score ring with progress arc. The ring is drawn as an SVG arc
// spanning (value/max) of the circumference - a 90/100 score fills 90%
// of the ring, the remaining 10% shows as a faint track.
//
// Props:
//   score       number - the value (drives arc length and band colour)
//   max         number - full-circle value (default 100)
//   display     string - override the text inside ("2/2", "C+")
//   size        number - diameter in pt; font, stroke and track scale with it
//   color       string - override colour (bypasses score bands, e.g. gradeColor)
//   progress    number - override arc fraction 0..1 (else score/max)
//   trackColor  string - the unfilled remainder (default: faint border grey)
import { View, Text, Svg, Path } from "@react-pdf/renderer";
import { scoreColor, colors, fonts } from "../tokens";

// Arc path from startAngle to endAngle (degrees, 0 = 12 o'clock, clockwise)
const arcPath = (cx, cy, r, startAngle, endAngle) => {
  const rad = (deg) => ((deg - 90) * Math.PI) / 180;
  const x1 = cx + r * Math.cos(rad(startAngle));
  const y1 = cy + r * Math.sin(rad(startAngle));
  const x2 = cx + r * Math.cos(rad(endAngle));
  const y2 = cy + r * Math.sin(rad(endAngle));
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
};

export const ScoreCircle = ({
  score,
  max = 100,
  display,
  size = 52,
  color,
  progress,
  trackColor = colors.border,
}) => {
  const ringColor = color ?? scoreColor(score, max);
  const stroke = Math.max(2, Math.round(size * 0.06));
  const r = (size - stroke) / 2;
  const c = size / 2;

  // Arc fraction: explicit progress prop, else score/max, clamped 0..1.
  // Non-numeric scores (letter grades via display+color) get a full ring.
  const numeric = typeof score === "number" && typeof max === "number" && max > 0;
  let frac = progress ?? (numeric ? score / max : 1);
  frac = Math.min(1, Math.max(0, frac));

  return (
    <View style={{ width: size, height: size, position: "relative" }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* track: the unfilled remainder */}
        {frac < 1 && (
          <Path
            d={arcPath(c, c, r, 0, 359.99)}
            stroke={trackColor}
            strokeWidth={stroke}
            fill="none"
          />
        )}
        {/* progress arc */}
        {frac > 0 &&
          (frac >= 1 ? (
            <Path
              d={arcPath(c, c, r, 0, 359.99)}
              stroke={ringColor}
              strokeWidth={stroke}
              fill="none"
            />
          ) : (
            <Path
              d={arcPath(c, c, r, 0, frac * 360)}
              stroke={ringColor}
              strokeWidth={stroke}
              strokeLineCap="round"
              fill="none"
            />
          ))}
      </Svg>
      {/* centred value */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: size,
          height: size,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ fontFamily: fonts.mono, fontSize: size * 0.26, color: ringColor }}>
          {display ?? score}
        </Text>
      </View>
    </View>
  );
};

export default ScoreCircle;
