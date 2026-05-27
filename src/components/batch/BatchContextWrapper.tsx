import { ActivityIndicator, View } from "react-native";

import { BatchContextProvider } from "../../context/BatchContext";
import { useUserBatches } from "../../hooks/useUserBatches";

type Props = {
  children: React.ReactNode;
};

export default function BatchContextWrapper({ children }: Props) {
  const { batches, loading } = useUserBatches();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <BatchContextProvider batches={batches}>{children}</BatchContextProvider>
  );
}
