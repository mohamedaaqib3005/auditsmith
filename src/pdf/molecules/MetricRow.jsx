// MOLECULE: one metric line - dot + label ... value (mono, rating-coloured).
import { View } from "@react-pdf/renderer";
import { Body, Mono, RatingDot } from "../atoms";
import { ratingColor, space } from "../tokens";

export const MetricRow = ({ label, value, rating }) => (
  <View
    style={{
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: space.xs + 1,
    }}
  >
    <View style={{ flexDirection: "row", alignItems: "center", flex: 1, paddingRight: space.md }}>
      <RatingDot rating={rating} />
      <Body size="md">{label}</Body>
    </View>
    <Mono size="lg" color={ratingColor(rating)}>
      {value}
    </Mono>
  </View>
);

export default MetricRow;
