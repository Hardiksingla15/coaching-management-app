import { useState, useCallback } from "react";
import { ScrollView, RefreshControl } from "react-native";

import AppHeader from "../../components/AppHeader";
import ScreenContainer from "../../components/ScreenContainer";
import BatchSelector from "../../components/batch/BatchSelector";
import ContextHeader from "../../components/batch/ContextHeader";
import StudentModuleCards from "../../components/dashboard/StudentModuleCards";
import { useBatchContext } from "../../context/BatchContext";
import { useCurrentUser } from "../../hooks/useCurrentUser";

export default function StudentDashboard() {
  const { batches, activeBatch, setActiveBatch } = useBatchContext();
  const { refreshProfile } = useCurrentUser();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshProfile();
    setRefreshing(false);
  }, [refreshProfile]);

  return (
    <ScreenContainer>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <AppHeader title="Student Dashboard 🎓" />


        <BatchSelector
          title="Your Subject Slots"
          batches={batches}
          selectedBatch={activeBatch}
          onSelect={setActiveBatch}
          emptyMessage="No subject slots assigned. Contact your institute."
        />

        <ContextHeader
          activeBatch={activeBatch}
          subtitle="Modules below use this selected subject-slot context"
        />

        <StudentModuleCards />
      </ScrollView>
    </ScreenContainer>
  );
}
