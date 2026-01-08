import { View, Text, ScrollView, ActivityIndicator, Image } from "react-native";
import { useLocalSearchParams, Stack, router } from "expo-router";
import { QRCode } from "@boxtrack/ui";
import { generateQRCodeContent } from "@boxtrack/shared";
import { useBox } from "../../hooks/use-box";
import { StatusBadge } from "@boxtrack/ui";

export default function BoxDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: box, isLoading, error, refetch } = useBox(id);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-4 text-gray-600">Loading box details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 px-4">
        <Text className="text-red-600 text-lg font-semibold mb-2">
          Error loading box
        </Text>
        <Text className="text-gray-600 text-center mb-4">{error.message}</Text>
        <Text
          className="text-blue-600 font-medium"
          onPress={() => refetch()}
        >
          Tap to retry
        </Text>
      </View>
    );
  }

  if (!box) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 px-4">
        <Text className="text-gray-900 text-lg font-semibold mb-2">
          Box not found
        </Text>
        <Text className="text-gray-600 text-center mb-4">
          The box you're looking for doesn't exist or you don't have access to
          it.
        </Text>
        <Text
          className="text-blue-600 font-medium"
          onPress={() => router.back()}
        >
          Go back
        </Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: box.label,
          headerBackTitle: "Boxes",
        }}
      />

      <ScrollView className="flex-1 bg-gray-50">
        {/* Header with Status */}
        <View className="bg-white px-4 py-6 border-b border-gray-200">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-2xl font-bold text-gray-900">
              {box.label}
            </Text>
            <StatusBadge status={box.status} />
          </View>
          <Text className="text-sm text-gray-500">ID: {box.id}</Text>
        </View>

        {/* QR Code Section */}
        <View className="bg-white mt-2 px-4 py-6">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            QR Code
          </Text>
          <View className="items-center">
            <View className="bg-white border-2 border-gray-200 rounded-lg p-4">
              <QRCode
                value={box.qr_code || generateQRCodeContent(box.id)}
                size={200}
                level="M"
                testID="box-qr-code"
              />
            </View>
            <Text className="mt-3 text-sm text-gray-600 text-center">
              Scan this code to quickly access box details
            </Text>
          </View>
        </View>

        {/* Box Information */}
        <View className="bg-white mt-2 px-4 py-6">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Information
          </Text>

          <View className="space-y-4">
            <View>
              <Text className="text-sm font-medium text-gray-500 mb-1">
                Status
              </Text>
              <Text className="text-base text-gray-900 capitalize">
                {box.status}
              </Text>
            </View>

            {box.category && (
              <View>
                <Text className="text-sm font-medium text-gray-500 mb-1">
                  Category
                </Text>
                <Text className="text-base text-gray-900">
                  {box.category.name}
                </Text>
              </View>
            )}

            {box.box_type && (
              <View>
                <Text className="text-sm font-medium text-gray-500 mb-1">
                  Box Type
                </Text>
                <Text className="text-base text-gray-900">
                  {box.box_type.name}
                </Text>
              </View>
            )}

            {box.description && (
              <View>
                <Text className="text-sm font-medium text-gray-500 mb-1">
                  Description
                </Text>
                <Text className="text-base text-gray-900">
                  {box.description}
                </Text>
              </View>
            )}

            <View>
              <Text className="text-sm font-medium text-gray-500 mb-1">
                Photo Count
              </Text>
              <Text className="text-base text-gray-900">
                {box.photo_count || 0}
              </Text>
            </View>
          </View>
        </View>

        {/* Photos Section */}
        {box.photos && box.photos.length > 0 && (
          <View className="bg-white mt-2 px-4 py-6">
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              Photos ({box.photos.length})
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {box.photos.map((photo) => (
                <View
                  key={photo.id}
                  className="w-[48%] aspect-square bg-gray-100 rounded-lg overflow-hidden"
                >
                  <Image
                    source={{ uri: photo.url }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Metadata */}
        <View className="bg-white mt-2 px-4 py-6 mb-4">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Metadata
          </Text>
          <View className="space-y-3">
            <View>
              <Text className="text-sm font-medium text-gray-500 mb-1">
                Created
              </Text>
              <Text className="text-sm text-gray-900">
                {new Date(box.created_at).toLocaleString()}
              </Text>
            </View>
            <View>
              <Text className="text-sm font-medium text-gray-500 mb-1">
                Last Updated
              </Text>
              <Text className="text-sm text-gray-900">
                {new Date(box.updated_at).toLocaleString()}
              </Text>
            </View>
            {box.closed_at && (
              <View>
                <Text className="text-sm font-medium text-gray-500 mb-1">
                  Closed At
                </Text>
                <Text className="text-sm text-gray-900">
                  {new Date(box.closed_at).toLocaleString()}
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </>
  );
}
