import { Text, View } from "react-native";

import { COLORS } from "../../constants/colors";
import { SPACING } from "../../constants/spacing";
import type { CurrentUser } from "../../hooks/useCurrentUser";

type Props = {
  user: CurrentUser | null;
};

export default function CurrentBatchCard({ user }: Props) {
  const firstSlot = user?.assignedSubjects?.[0];

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
          fontSize: 14,
          color: COLORS.gray,
          marginBottom: SPACING.xs,
        }}
      >
        Current Subject Slot
      </Text>

      {firstSlot ? (
        <>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "700",
              color: COLORS.text,
            }}
          >
            Class {firstSlot.classLevel} · {firstSlot.batch}
          </Text>

          <Text
            style={{
              marginTop: SPACING.xs,
              color: COLORS.gray,
            }}
          >
            Subject: {firstSlot.subject}
          </Text>
        </>
      ) : (
        <Text style={{ color: COLORS.gray }}>
          Not assigned to a subject slot yet.
        </Text>
      )}
    </View>
  );
}
