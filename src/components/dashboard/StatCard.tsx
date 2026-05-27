import { Text, View } from "react-native";

import { COLORS } from "../../constants/colors";
import { SPACING } from "../../constants/spacing";

type Props = {
  label: string;
  value: number | string;
};

export default function StatCard({ label, value }: Props) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: COLORS.card,
        padding: SPACING.md,
        borderRadius: 16,
        minWidth: 100,
      }}
    >
      <Text
        style={{
          fontSize: 24,
          fontWeight: "bold",
          color: COLORS.text,
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          marginTop: SPACING.xs,
          color: COLORS.gray,
          fontSize: 14,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
