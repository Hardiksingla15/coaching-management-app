import { Text, View } from "react-native";

import { COLORS } from "../../constants/colors";
import { SPACING } from "../../constants/spacing";

type Props = {
  title: string;
  children: React.ReactNode;
};

export default function DashboardSection({ title, children }: Props) {
  return (
    <View style={{ marginBottom: SPACING.md }}>
      <Text
        style={{
          fontSize: 20,
          fontWeight: "700",
          color: COLORS.text,
          marginBottom: SPACING.sm,
        }}
      >
        {title}
      </Text>
      {children}
    </View>
  );
}
