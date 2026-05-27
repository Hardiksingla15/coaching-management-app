import { Text, View } from "react-native";

import { COLORS } from "../../constants/colors";
import { SPACING } from "../../constants/spacing";

type Props = {
  message: string;
};

export default function EmptyState({ message }: Props) {
  return (
    <View
      style={{
        backgroundColor: COLORS.card,
        padding: SPACING.md,
        borderRadius: 16,
      }}
    >
      <Text style={{ color: COLORS.gray, fontSize: 15 }}>{message}</Text>
    </View>
  );
}
