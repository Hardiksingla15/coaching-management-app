import { ScrollView, View } from "react-native";

import { SPACING } from "../../constants/spacing";
import { batchesEqual } from "../../services/batchUtils";
import type { AssignedSubject } from "../../types/user";
import BatchCard from "./BatchCard";
import DashboardSection from "./DashboardSection";
import EmptyState from "./EmptyState";

type Props = {
  title?: string;
  batches: AssignedSubject[];
  selectedBatch: AssignedSubject | null;
  onSelect: (batch: AssignedSubject) => void;
  emptyMessage?: string;
};

export default function BatchSelector({
  title = "Your Subject Slots",
  batches,
  selectedBatch,
  onSelect,
  emptyMessage = "No subject slots assigned yet.",
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
              key={`${batch.classLevel}-${batch.batch}-${batch.subject}`}
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
