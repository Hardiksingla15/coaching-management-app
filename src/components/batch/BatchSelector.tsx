import { ScrollView, View } from "react-native";

import { SPACING } from "../../constants/spacing";
import { batchesEqual } from "../../services/batchUtils";
import type { AssignedBatch } from "../../types/user";
import BatchCard from "./BatchCard";
import DashboardSection from "./DashboardSection";
import EmptyState from "./EmptyState";

type Props = {
  title?: string;
  batches: AssignedBatch[];
  selectedBatch: AssignedBatch | null;
  onSelect: (batch: AssignedBatch) => void;
  emptyMessage?: string;
};

export default function BatchSelector({
  title = "Your Batches",
  batches,
  selectedBatch,
  onSelect,
  emptyMessage = "No batches assigned yet.",
}: Props) {
  return (
    <DashboardSection title={title}>
      {batches.length === 0 ? (
        <EmptyState message={emptyMessage} />
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: SPACING.xs }}
        >
          {batches.map((batch) => (
            <BatchCard
              key={`${batch.classLevel}-${batch.batch}`}
              batch={batch}
              selected={
                selectedBatch
                  ? batchesEqual(batch, selectedBatch)
                  : false
              }
              onPress={() => onSelect(batch)}
            />
          ))}
          <View style={{ width: SPACING.sm }} />
        </ScrollView>
      )}
    </DashboardSection>
  );
}
