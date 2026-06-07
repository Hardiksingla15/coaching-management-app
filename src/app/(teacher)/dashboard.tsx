import { ScrollView } from "react-native";

import AppHeader from "../../components/AppHeader";
import ScreenContainer from "../../components/ScreenContainer";
import BatchSelector from "../../components/batch/BatchSelector";
import ContextHeader from "../../components/batch/ContextHeader";
import DashboardSection from "../../components/batch/DashboardSection";
import BatchAwareQuickActions from "../../components/dashboard/BatchAwareQuickActions";
import { useBatchContext } from "../../context/BatchContext";

export default function TeacherDashboard() {
  const { batches, activeBatch, setActiveBatch } = useBatchContext();

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        <AppHeader title="Teacher Dashboard 👨‍🏫" />

        <BatchSelector
          title="Assigned Teaching Slots"
          batches={batches}
          selectedBatch={activeBatch}
          onSelect={setActiveBatch}
          emptyMessage="No teaching subject slots assigned yet."
        />

        <ContextHeader
          activeBatch={activeBatch}
          subtitle="Quick actions apply to the selected class-batch-subject slot"
        />

        <DashboardSection title="Quick Actions">
          <BatchAwareQuickActions />
        </DashboardSection>
      </ScrollView>
    </ScreenContainer>
  );
}
