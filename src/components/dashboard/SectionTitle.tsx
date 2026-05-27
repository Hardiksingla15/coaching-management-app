import { Text } from "react-native";

import { COLORS } from "../../constants/colors";
import { SPACING } from "../../constants/spacing";

type Props = {
  title: string;
};

export default function SectionTitle({ title }: Props) {
  return (
    <Text
      style={{
        fontSize: 20,
        fontWeight: "700",
        color: COLORS.text,
        marginBottom: SPACING.sm,
        marginTop: SPACING.md,
      }}
    >
      {title}
    </Text>
  );
}
