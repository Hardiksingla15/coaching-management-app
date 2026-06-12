import { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { useRouter } from "expo-router";

import AppHeader from "../../components/AppHeader";
import ScreenContainer from "../../components/ScreenContainer";
import DashboardCard from "../../components/DashboardCard";
import StatCard from "../../components/dashboard/StatCard";
import BatchSelector from "../../components/batch/BatchSelector";
import ContextHeader from "../../components/batch/ContextHeader";
import DashboardSection from "../../components/batch/DashboardSection";
import BatchAwareQuickActions from "../../components/dashboard/BatchAwareQuickActions";
import { SPACING } from "../../constants/spacing";
import { useBatchContext } from "../../context/BatchContext";
import {
  getInstituteStats,
  type InstituteStats,
} from "../../firebase/firestore";
import { getFeesSummary, type FeesSummaryStats } from "../../firebase/fees";

export default function OwnerDashboard() {
  const router = useRouter();
  const { batches, activeBatch, setActiveBatch } = useBatchContext();
  const [stats, setStats] = useState<InstituteStats>({
    totalStudents: 0,
    totalTeachers: 0,
  });
  const [feeSummary, setFeeSummary] = useState<FeesSummaryStats>({
    totalAssigned: 0,
    totalCollected: 0,
    totalPending: 0,
    studentsPendingCount: 0,
  });

  useEffect(() => {
    Promise.all([
      getInstituteStats(),
      getFeesSummary()
    ]).then(([statsData, feeSummaryData]) => {
      setStats(statsData);
      setFeeSummary(feeSummaryData);
    }).catch(() => {});
  }, []);

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        <AppHeader title="Owner Dashboard" />

        <DashboardSection title="Institute Overview">
          <View
            style={{
              flexDirection: "row",
              gap: SPACING.sm,
              marginBottom: SPACING.sm,
            }}
          >
            <StatCard label="Students" value={stats.totalStudents} />
            <StatCard label="Teachers" value={stats.totalTeachers} />
          </View>
        </DashboardSection>

        <DashboardSection title="Fees Summary">
          <View
            style={{
              flexDirection: "row",
              gap: SPACING.sm,
              marginBottom: SPACING.sm,
            }}
          >
            <StatCard label="Total Assigned" value={`₹${feeSummary.totalAssigned}`} />
            <StatCard label="Total Collected" value={`₹${feeSummary.totalCollected}`} />
          </View>
          <View
            style={{
              flexDirection: "row",
              gap: SPACING.sm,
            }}
          >
            <StatCard label="Total Pending" value={`₹${feeSummary.totalPending}`} />
            <StatCard label="Students Pending" value={feeSummary.studentsPendingCount} />
          </View>
        </DashboardSection>

        <DashboardSection title="Institute Management">
          <DashboardCard
            title="Manage Subject Slots"
            icon="school"
            onPress={() => router.push("/(owner)/manage-batches" as never)}
          />
          <DashboardCard
            title="Manage Students"
            icon="school"
            onPress={() => router.push("/(owner)/students" as never)}
          />
          <DashboardCard
            title="Manage Teachers"
            icon="people"
            onPress={() => router.push("/(owner)/teachers" as never)}
          />
          <DashboardCard
            title="Manage Fees"
            icon="cash"
            onPress={() => router.push("/(owner)/fees" as never)}
          />
        </DashboardSection>

        <BatchSelector
          title="My Teaching Slots"
          batches={batches}
          selectedBatch={activeBatch}
          onSelect={setActiveBatch}
          emptyMessage="No personal teaching slots assigned."
        />

        <ContextHeader
          activeBatch={activeBatch}
          subtitle="Teaching tools use the selected batch (same as teacher workflow)"
        />

        <DashboardSection title="Teaching Quick Actions">
          <BatchAwareQuickActions />
        </DashboardSection>
      </ScrollView>
    </ScreenContainer>
  );
}

