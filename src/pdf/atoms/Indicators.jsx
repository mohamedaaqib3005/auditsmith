// src/pdf/atoms/Indicators.jsx
// ATOMS: RatingDot (CWV colour dot) and ScoreCircle (Lighthouse ring).

import { View, Text } from "@react-pdf/renderer";
import { ratingColors, scoreColor, fonts, fontSizes, space } from "../tokens";

// Small coloured dot for a metric rating
export const RatingDot = ({ rating }) => {
  const r = ratingColors[rating] || ratingColors.na;
  return (
    <View
      style={{
        width: 7,
        height: 7,
        borderRadius: 3.5,
        marginRight: space.sm,
        backgroundColor: r.color,
      }}
    />
  );
};

// Helper so molecules can colour values consistently
export const ratingColor = (rating) =>
  (ratingColors[rating] || ratingColors.na).color;

// Lighthouse-style ring with the score inside
export const ScoreCircle = ({ score, max = 100, display, size = 52 }) => {
  const color = scoreColor(score, max);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 3,
        borderColor: color,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          fontFamily: fonts.mono,
          fontSize: fontSizes["2xl"],
          color,
        }}
      >
        {display ?? score}
      </Text>
    </View>
  );
};






