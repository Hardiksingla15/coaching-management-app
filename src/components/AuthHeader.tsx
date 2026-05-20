import { View, Text } from "react-native";

import { COLORS } from "../constants/colors";
import { SPACING } from "../constants/spacing";

type Props = {
  title: string;
  subtitle: string;
};

export default function AuthHeader({
  title,
  subtitle,
}: Props) {
  return (
    <View
      style={{
        marginBottom: SPACING.xl,
      }}
    >
      <Text
        style={{
          fontSize: 32,
          fontWeight: "bold",
          color: COLORS.text,
          marginBottom: SPACING.sm,
        }}
      >
        {title}
      </Text>

      <Text
        style={{
          fontSize: 16,
          color: COLORS.gray,
        }}
      >
        {subtitle}
      </Text>
    </View>
  );
}