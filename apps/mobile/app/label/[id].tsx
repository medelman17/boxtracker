import { useEffect } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { useLocalSearchParams, router } from "expo-router";

/**
 * Label screen redirect
 * Label URLs are handled by redirecting to the box detail page
 * where the QR code is displayed.
 */
export default function LabelScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  useEffect(() => {
    if (!id) return;

    // Redirect to box detail page which shows the QR code
    router.replace(`/box/${id}`);
  }, [id]);

  return (
    <View className="flex-1 items-center justify-center bg-gray-50">
      <ActivityIndicator size="large" color="#3B82F6" />
      <Text className="mt-4 text-gray-600">Loading label...</Text>
    </View>
  );
}
