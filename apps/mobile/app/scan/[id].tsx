import { useEffect } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { useLocalSearchParams, router } from "expo-router";

/**
 * Scan result screen
 * This screen handles scan URLs and redirects to the box detail page.
 * In the future, this could resolve short codes to box IDs.
 */
export default function ScanResultScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  useEffect(() => {
    if (!id) return;

    // For now, treat scan ID as a direct box ID
    // In the future, implement short code resolution here
    router.replace(`/box/${id}`);
  }, [id]);

  return (
    <View className="flex-1 items-center justify-center bg-gray-50">
      <ActivityIndicator size="large" color="#3B82F6" />
      <Text className="mt-4 text-gray-600">Loading box...</Text>
    </View>
  );
}
