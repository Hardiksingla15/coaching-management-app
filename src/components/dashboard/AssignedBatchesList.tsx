import { Text, View } from "react-native";

import { COLORS } from "../../constants/colors";
import { SPACING } from "../../constants/spacing";
import type { AssignedSubject } from "../../types/user";

type Props = {
  batches: AssignedSubject[];
};

function formatBatchLabel(batch: AssignedSubject) {
  return `Class ${batch.classLevel} · ${batch.batch} · ${batch.subject}`;
}

export default function AssignedBatchesList({ batches }: Props) {
  if (!batches || batches.length === 0) {
    return (
      <View
        style={{
          backgroundColor: COLORS.card,
          padding: SPACING.md,
          borderRadius: 16,
          marginBottom: SPACING.md,
        }}
      >
        <Text style={{ color: COLORS.gray }}>
          No teaching subject slots assigned yet.
        </Text>
      </View>
    );
  }

  return (
    <>
      {batches.map((batch, index) => (
        <View
          key={`${batch.classLevel}-${batch.batch}-${batch.subject}-${index}`}
          style={{
            backgroundColor: COLORS.card,
            padding: SPACING.md,
            borderRadius: 16,
            marginBottom: SPACING.sm,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: COLORS.text,
            }}
          >
            {formatBatchLabel(batch)}
          </Text>
        </View>
      ))}
    </>
  );
}
