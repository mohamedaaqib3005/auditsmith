// ATOM: small coloured dot for a metric rating (CWV convention).
import { View } from "@react-pdf/renderer";
import { ratingColors, space } from "../tokens";

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

export default RatingDot;
