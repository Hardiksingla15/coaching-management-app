import { Text, View } from "react-native";

import { COLORS } from "../../constants/colors";
import { SPACING } from "../../constants/spacing";
import type { CurrentUser } from "../../hooks/useCurrentUser";

type Props = {
  user: CurrentUser | null;
};

export default function CurrentBatchCard({ user }: Props) {
  const hasBatch = user?.classLevel && user?.batch;

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
        Current Batch
      </Text>

      {hasBatch ? (
        <>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "700",
              color: COLORS.text,
            }}
          >
            Class {user.classLevel} · {user.batch}
          </Text>

          {user.subjects && user.subjects.length > 0 && (
            <Text
              style={{
                marginTop: SPACING.xs,
                color: COLORS.gray,
              }}
            >
              Subjects: {user.subjects.join(", ")}
            </Text>
          )}
        </>
      ) : (
        <Text style={{ color: COLORS.gray }}>
          Not assigned to a batch yet.
        </Text>
      )}
    </View>
  );
}
