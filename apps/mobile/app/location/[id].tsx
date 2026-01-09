import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useLocalSearchParams, Stack, router } from "expo-router";
import { useState } from "react";
import { useLocation, type PalletCapacity } from "../../hooks/use-locations";

function CapacityBar({ percent }: { percent: number }) {
  const getBarColor = (p: number) => {
    if (p >= 90) return "bg-red-500";
    if (p >= 70) return "bg-amber-500";
    return "bg-green-500";
  };

  return (
    <View className="w-full bg-gray-200 rounded-full h-2">
      <View
        className={`h-2 rounded-full ${getBarColor(percent)}`}
        style={{ width: `${Math.min(percent, 100)}%` }}
      />
    </View>
  );
}

function PalletRow({ pallet }: { pallet: PalletCapacity }) {
  return (
    <View className="flex-row items-center py-3 border-b border-gray-100">
      <View className="flex-1">
        <Text className="font-mono font-semibold text-gray-900">
          {pallet.code}
        </Text>
        {pallet.name && (
          <Text className="text-sm text-gray-500">{pallet.name}</Text>
        )}
      </View>
      <View className="items-end mr-4">
        <Text className="text-sm text-gray-700">
          {pallet.occupied_positions}/{pallet.total_positions}
        </Text>
        <Text className="text-xs text-gray-500">positions</Text>
      </View>
      <View className="w-20 items-end">
        <View className="w-16 mb-1">
          <CapacityBar percent={pallet.utilization_percent} />
        </View>
        <Text className="text-xs text-gray-500">
          {pallet.utilization_percent}%
        </Text>
      </View>
    </View>
  );
}

export default function LocationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: location, isLoading, error, refetch } = useLocation(id);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (isLoading && !refreshing) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-4 text-gray-600">Loading location...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 px-4">
        <Text className="text-red-600 text-lg font-semibold mb-2">
          Error loading location
        </Text>
        <Text className="text-gray-600 text-center mb-4">{error.message}</Text>
        <Text className="text-blue-600 font-medium" onPress={refetch}>
          Tap to retry
        </Text>
      </View>
    );
  }

  if (!location) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 px-4">
        <Text className="text-gray-900 text-lg font-semibold mb-2">
          Location not found
        </Text>
        <Text className="text-gray-600 text-center mb-4">
          The location you're looking for doesn't exist or you don't have access.
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

  // Calculate totals
  const totals = location.pallets.reduce(
    (acc, p) => ({
      totalPositions: acc.totalPositions + (p.total_positions || 0),
      occupiedPositions: acc.occupiedPositions + (p.occupied_positions || 0),
      availablePositions: acc.availablePositions + (p.available_positions || 0),
    }),
    { totalPositions: 0, occupiedPositions: 0, availablePositions: 0 }
  );

  const utilizationPercent =
    totals.totalPositions > 0
      ? Math.round((totals.occupiedPositions / totals.totalPositions) * 100)
      : 0;

  const borderColor = location.color || "#6B7280";

  return (
    <>
      <Stack.Screen
        options={{
          title: location.name,
          headerBackTitle: "Locations",
        }}
      />

      <ScrollView
        className="flex-1 bg-gray-50"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View
          className="bg-white px-4 py-6 border-b border-gray-200"
          style={{ borderLeftWidth: 4, borderLeftColor: borderColor }}
        >
          <View className="flex-row items-center flex-wrap gap-2 mb-2">
            <Text className="text-2xl font-bold text-gray-900">
              {location.name}
            </Text>
            {location.code && (
              <View className="bg-gray-100 px-2 py-1 rounded">
                <Text className="text-sm font-medium text-gray-600">
                  {location.code}
                </Text>
              </View>
            )}
            {location.is_default && (
              <View className="bg-blue-100 px-2 py-1 rounded">
                <Text className="text-sm font-medium text-blue-700">
                  Default
                </Text>
              </View>
            )}
          </View>
          {location.facility_name && (
            <Text className="text-sm text-gray-600">{location.facility_name}</Text>
          )}
        </View>

        {/* Capacity Overview */}
        <View className="bg-white mt-2 px-4 py-6">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Capacity
          </Text>
          <View className="items-center mb-4">
            <Text className="text-4xl font-bold text-gray-900">
              {utilizationPercent}%
            </Text>
            <Text className="text-sm text-gray-500">Utilization</Text>
          </View>
          <CapacityBar percent={utilizationPercent} />
          <View className="flex-row justify-between mt-4">
            <View className="items-center">
              <Text className="text-xl font-semibold text-gray-900">
                {location.pallets.length}
              </Text>
              <Text className="text-xs text-gray-500">Pallets</Text>
            </View>
            <View className="items-center">
              <Text className="text-xl font-semibold text-gray-900">
                {totals.occupiedPositions}
              </Text>
              <Text className="text-xs text-gray-500">Used</Text>
            </View>
            <View className="items-center">
              <Text className="text-xl font-semibold text-green-600">
                {totals.availablePositions}
              </Text>
              <Text className="text-xs text-gray-500">Available</Text>
            </View>
          </View>
        </View>

        {/* Location Details */}
        <View className="bg-white mt-2 px-4 py-6">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Details
          </Text>
          <View className="space-y-3">
            {location.facility_address && (
              <View>
                <Text className="text-sm font-medium text-gray-500 mb-1">
                  Address
                </Text>
                <Text className="text-base text-gray-900">
                  {location.facility_address}
                </Text>
              </View>
            )}
            {location.access_hours && (
              <View>
                <Text className="text-sm font-medium text-gray-500 mb-1">
                  Access Hours
                </Text>
                <Text className="text-base text-gray-900">
                  {location.access_hours}
                </Text>
              </View>
            )}
            {location.access_code && (
              <View>
                <Text className="text-sm font-medium text-gray-500 mb-1">
                  Access Code
                </Text>
                <Text className="text-base text-gray-900 font-mono">
                  {location.access_code}
                </Text>
              </View>
            )}
            {(location.width_feet ||
              location.depth_feet ||
              location.height_feet) && (
              <View>
                <Text className="text-sm font-medium text-gray-500 mb-1">
                  Dimensions
                </Text>
                <Text className="text-base text-gray-900">
                  {[
                    location.width_feet && `${location.width_feet}ft W`,
                    location.depth_feet && `${location.depth_feet}ft D`,
                    location.height_feet && `${location.height_feet}ft H`,
                  ]
                    .filter(Boolean)
                    .join(" × ")}
                </Text>
              </View>
            )}
            {location.square_feet && (
              <View>
                <Text className="text-sm font-medium text-gray-500 mb-1">
                  Square Footage
                </Text>
                <Text className="text-base text-gray-900">
                  {location.square_feet} sq ft
                </Text>
              </View>
            )}
            {location.notes && (
              <View>
                <Text className="text-sm font-medium text-gray-500 mb-1">
                  Notes
                </Text>
                <Text className="text-base text-gray-900">{location.notes}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Pallets List */}
        <View className="bg-white mt-2 px-4 py-6 mb-4">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Pallets ({location.pallets.length})
          </Text>
          {location.pallets.length === 0 ? (
            <View className="py-8 items-center">
              <Text className="text-gray-500 text-center">
                No pallets in this location yet.
              </Text>
            </View>
          ) : (
            <View>
              {location.pallets.map((pallet) => (
                <PalletRow key={pallet.id} pallet={pallet} />
              ))}
            </View>
          )}
        </View>

        {/* Metadata */}
        <View className="bg-white px-4 py-6 mb-4">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Metadata
          </Text>
          <View className="space-y-3">
            <View>
              <Text className="text-sm font-medium text-gray-500 mb-1">
                Created
              </Text>
              <Text className="text-sm text-gray-900">
                {new Date(location.created_at).toLocaleString()}
              </Text>
            </View>
            <View>
              <Text className="text-sm font-medium text-gray-500 mb-1">
                Last Updated
              </Text>
              <Text className="text-sm text-gray-900">
                {new Date(location.updated_at).toLocaleString()}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </>
  );
}
