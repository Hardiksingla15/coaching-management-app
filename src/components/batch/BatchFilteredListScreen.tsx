import { ActivityIndicator, FlatList, Text, View } from "react-native";
import { useEffect, useMemo, useState, type ReactElement } from "react";

import { useBatchContext } from "../../context/BatchContext";
import {
  filterByActiveBatch,
  type BatchFilterable,
} from "../../services/batchFiltering";
import ContextHeader from "./ContextHeader";
import EmptyState from "./EmptyState";
import ScreenContainer from "../ScreenContainer";

type Props<T extends BatchFilterable & { id?: string }> = {
  title: string;
  emptyMessage: string;
  fetchItems: () => Promise<T[]>;
  renderItem: (item: T) => ReactElement;
  keyExtractor?: (item: T, index: number) => string;
};

export default function BatchFilteredListScreen<
  T extends BatchFilterable & { id?: string },
>({
  title,
  emptyMessage,
  fetchItems,
  renderItem,
  keyExtractor,
}: Props<T>) {
  const { activeBatch } = useBatchContext();
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItems()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [fetchItems]);

  const filteredItems = useMemo(
    () => filterByActiveBatch(items, activeBatch) as T[],
    [items, activeBatch]
  );

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScreenContainer>
      <Text
        style={{
          fontSize: 28,
          fontWeight: "bold",
          marginBottom: 12,
        }}
      >
        {title}
      </Text>

      <ContextHeader activeBatch={activeBatch} />

      {!activeBatch ? (
        <EmptyState message="Select a subject slot on the dashboard first." />
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item, index) =>
            keyExtractor?.(item, index) ?? item.id ?? String(index)
          }
          ListEmptyComponent={<EmptyState message={emptyMessage} />}
          renderItem={({ item }) => renderItem(item)}
        />
      )}
    </ScreenContainer>
  );
}
