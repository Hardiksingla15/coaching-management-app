import { ScrollView } from "react-native";

import AppHeader from "../../components/AppHeader";
import ScreenContainer from "../../components/ScreenContainer";
import BatchSelector from "../../components/batch/BatchSelector";
import ContextHeader from "../../components/batch/ContextHeader";
import StudentModuleCards from "../../components/dashboard/StudentModuleCards";
import { useBatchContext } from "../../context/BatchContext";

export default function StudentDashboard() {
  const { batches, activeBatch, setActiveBatch } = useBatchContext();

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        <AppHeader title="Student Dashboard 🎓" />

        <BatchSelector
          title="Your Batches"
          batches={batches}
          selectedBatch={activeBatch}
          onSelect={setActiveBatch}
          emptyMessage="No batches assigned. Contact your institute."
        />

        <ContextHeader
          activeBatch={activeBatch}
          subtitle="Modules below use this batch context"
        />

        <StudentModuleCards />
      </ScrollView>
    </ScreenContainer>
  );
}
