// ORGANISM: type "table".
import { View, Text } from "@react-pdf/renderer";
import { colors, fonts, fontSizes, space, borders } from "../tokens";

export const TableBlock = ({ columns = [], rows = [] }) => (
  <View style={{ marginBottom: space.lg }}>
    <View style={{ flexDirection: "row", backgroundColor: colors.primary }} fixed>
      {columns.map((col, i) => (
        <Text
          key={i}
          style={{
            flex: 1,
            padding: space.sm,
            color: colors.white,
            fontFamily: fonts.body,
            fontWeight: 700,
            fontSize: fontSizes.base,
          }}
        >
          {col}
        </Text>
      ))}
    </View>
    {rows.map((row, ri) => (
      <View
        key={ri}
        wrap={false}
        style={{
          flexDirection: "row",
          borderBottomWidth: borders.hairline,
          borderBottomColor: colors.border,
          backgroundColor: ri % 2 === 1 ? colors.bgAlt : undefined,
        }}
      >
        {row.map((cell, ci) => (
          <Text
            key={ci}
            style={{ flex: 1, padding: space.sm, fontFamily: fonts.body, fontSize: fontSizes.base }}
          >
            {cell}
          </Text>
        ))}
      </View>
    ))}
  </View>
);

export default TableBlock;
