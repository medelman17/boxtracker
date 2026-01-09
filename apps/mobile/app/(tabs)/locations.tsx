import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { useState } from "react";
import { useLocations, type LocationCapacity } from "../../hooks/use-locations";

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

function LocationCard({ location }: { location: LocationCapacity }) {
  const borderColor = location.color || "#6B7280";

  return (
    <TouchableOpacity
      className="bg-white rounded-lg shadow-sm mb-3 overflow-hidden"
      style={{ borderLeftWidth: 4, borderLeftColor: borderColor }}
      onPress={() => router.push(`/location/${location.location_id}`)}
      activeOpacity={0.7}
    >
      <View className="p-4">
        {/* Header */}
        <View className="flex-row items-start justify-between mb-3">
          <View className="flex-1">
            <View className="flex-row items-center flex-wrap gap-2">
              <Text className="text-lg font-semibold text-gray-900">
                {location.location_name}
              </Text>
              {location.location_code && (
                <View className="bg-gray-100 px-2 py-0.5 rounded">
                  <Text className="text-xs font-medium text-gray-600">
                    {location.location_code}
                  </Text>
                </View>
              )}
              {location.is_default && (
                <View className="bg-blue-100 px-2 py-0.5 rounded">
                  <Text className="text-xs font-medium text-blue-700">
                    Default
                  </Text>
                </View>
              )}
            </View>
            {location.facility_name && (
              <Text className="text-sm text-gray-500 mt-1">
                {location.facility_name}
              </Text>
            )}
          </View>
          {!location.is_active && (
            <View className="bg-gray-200 px-2 py-1 rounded">
              <Text className="text-xs font-medium text-gray-500">Inactive</Text>
            </View>
          )}
        </View>

        {/* Stats Row */}
        <View className="flex-row justify-between mb-3">
          <View className="items-center">
            <Text className="text-xl font-bold text-gray-900">
              {location.total_pallets}
            </Text>
            <Text className="text-xs text-gray-500">Pallets</Text>
          </View>
          <View className="items-center">
            <Text className="text-xl font-bold text-gray-900">
              {location.box_count}
            </Text>
            <Text className="text-xs text-gray-500">Boxes</Text>
          </View>
          <View className="items-center">
            <Text className="text-xl font-bold text-green-600">
              {location.available_positions}
            </Text>
            <Text className="text-xs text-gray-500">Available</Text>
          </View>
        </View>

        {/* Capacity Bar */}
        <View>
          <View className="flex-row justify-between mb-1">
            <Text className="text-xs text-gray-500">Capacity</Text>
            <Text className="text-xs text-gray-500">
              {location.utilization_percent}%
            </Text>
          </View>
          <CapacityBar percent={location.utilization_percent} />
          <Text className="text-xs text-gray-400 mt-1">
            {location.occupied_positions} / {location.total_positions} positions
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function EmptyState() {
  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <View className="w-16 h-16 rounded-full bg-blue-100 items-center justify-center mb-4">
        <Text className="text-2xl">📍</Text>
      </View>
      <Text className="text-lg font-semibold text-gray-900 mb-2 text-center">
        No locations yet
      </Text>
      <Text className="text-gray-500 text-center mb-6">
        Add your first storage location to organize your pallets.
      </Text>
      <TouchableOpacity
        className="bg-blue-600 px-6 py-3 rounded-lg"
        onPress={() => {
          // TODO: Navigate to add location screen when implemented
        }}
      >
        <Text className="text-white font-semibold">Add Location</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function LocationsScreen() {
  const { data: locations, isLoading, error, refetch } = useLocations();
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
        <Text className="mt-4 text-gray-600">Loading locations...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 px-4">
        <Text className="text-red-600 text-lg font-semibold mb-2">
          Error loading locations
        </Text>
        <Text className="text-gray-600 text-center mb-4">{error.message}</Text>
        <TouchableOpacity onPress={refetch}>
          <Text className="text-blue-600 font-medium">Tap to retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Calculate totals
  const totals = locations.reduce(
    (acc, loc) => ({
      totalPallets: acc.totalPallets + (loc.total_pallets || 0),
      totalPositions: acc.totalPositions + (loc.total_positions || 0),
      occupiedPositions: acc.occupiedPositions + (loc.occupied_positions || 0),
      totalBoxes: acc.totalBoxes + (loc.box_count || 0),
    }),
    { totalPallets: 0, totalPositions: 0, occupiedPositions: 0, totalBoxes: 0 }
  );

  const overallUtilization =
    totals.totalPositions > 0
      ? Math.round((totals.occupiedPositions / totals.totalPositions) * 100)
      : 0;

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {locations.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* Summary Stats */}
          <View className="bg-white px-4 py-4 mb-2">
            <View className="flex-row justify-between">
              <View className="items-center flex-1">
                <Text className="text-2xl font-bold text-gray-900">
                  {locations.length}
                </Text>
                <Text className="text-xs text-gray-500">Locations</Text>
              </View>
              <View className="items-center flex-1">
                <Text className="text-2xl font-bold text-gray-900">
                  {totals.totalPallets}
                </Text>
                <Text className="text-xs text-gray-500">Pallets</Text>
              </View>
              <View className="items-center flex-1">
                <Text className="text-2xl font-bold text-gray-900">
                  {totals.totalBoxes}
                </Text>
                <Text className="text-xs text-gray-500">Boxes</Text>
              </View>
              <View className="items-center flex-1">
                <Text className="text-2xl font-bold text-gray-900">
                  {overallUtilization}%
                </Text>
                <Text className="text-xs text-gray-500">Used</Text>
              </View>
            </View>
          </View>

          {/* Location Cards */}
          <View className="px-4 py-2">
            {locations.map((location) => (
              <LocationCard key={location.location_id} location={location} />
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}
