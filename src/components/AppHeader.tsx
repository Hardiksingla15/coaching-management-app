import { Text } from "react-native";

import { SPACING } from "../constants/spacing";
import { COLORS } from "../constants/colors";

type Props = {
  title: string;
};

export default function AppHeader({ title }: Props) {
  return (
    <Text
      style={{
        fontSize: 28,
        fontWeight: "bold",
        marginBottom: SPACING.lg,
        color: COLORS.text,
      }}
    >
      {title}
    </Text>
  );
}