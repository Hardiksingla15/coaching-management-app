import { Text, View } from "react-native";

import { COLORS } from "../../constants/colors";
import { SPACING } from "../../constants/spacing";
import { formatBatchLabel } from "../../services/batchUtils";
import type { AssignedBatch } from "../../types/user";

type Props = {
  activeBatch: AssignedBatch | null;
  subtitle?: string;
};

export default function ContextHeader({ activeBatch, subtitle }: Props) {
  if (!activeBatch) {
    return null;
  }

  return (
    <View
      style={{
        backgroundColor: COLORS.card,
        padding: SPACING.md,
        borderRadius: 16,
        marginBottom: SPACING.md,
      }}
    >
      <Text
        style={{
          fontSize: 13,
          color: COLORS.gray,
          marginBottom: 4,
        }}
      >
        Active context
      </Text>
      <Text
        style={{
          fontSize: 17,
          fontWeight: "700",
          color: COLORS.text,
        }}
      >
        {formatBatchLabel(activeBatch)}
      </Text>
      {subtitle ? (
        <Text style={{ marginTop: 6, color: COLORS.gray, fontSize: 14 }}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
