import { Text, TouchableOpacity } from "react-native";

import { COLORS } from "../../constants/colors";
import { SPACING } from "../../constants/spacing";
import { formatBatchLabel } from "../../services/batchUtils";
import type { AssignedSubject } from "../../types/user";

type Props = {
  batch: AssignedSubject;
  selected?: boolean;
  onPress?: () => void;
};

export default function BatchCard({ batch, selected = false, onPress }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      style={{
        backgroundColor: selected ? COLORS.primary : COLORS.card,
        padding: SPACING.md,
        borderRadius: 16,
        marginRight: SPACING.sm,
        minWidth: 200,
        borderWidth: selected ? 0 : 1,
        borderColor: COLORS.border,
      }}
    >
      <Text
        style={{
          fontSize: 15,
          fontWeight: "600",
          color: selected ? "#fff" : COLORS.text,
        }}
      >
        {formatBatchLabel(batch)}
      </Text>
    </TouchableOpacity>
  );
}
