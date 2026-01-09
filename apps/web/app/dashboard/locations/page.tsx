import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-ssr";
import Link from "next/link";
import { Button, ButtonText } from "@/components/ui/button";
import type { UserHouseholdWithHouseholdName } from "@boxtrack/shared";
import { LocationsGrid } from "@/components/locations/locations-grid";

type LocationCapacityRow = {
  location_id: string;
  household_id: string;
  location_name: string;
  location_code: string | null;
  facility_name: string | null;
  color: string | null;
  is_active: boolean;
  is_default: boolean;
  total_pallets: number;
  active_pallets: number;
  total_positions: number;
  occupied_positions: number;
  available_positions: number;
  box_count: number;
  utilization_percent: number;
};

export default async function LocationsPage() {
  const supabase = await createClient();

  // Verify authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch user's active household
  const { data: userHouseholdsData } = await supabase
    .from("user_households")
    .select("household_id, households(id, name)")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  const userHouseholds = userHouseholdsData as UserHouseholdWithHouseholdName | null;

  if (!userHouseholds?.household_id) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No household found. Please create one.</p>
      </div>
    );
  }

  const householdId = userHouseholds.household_id;

  // Fetch locations with capacity from the view
  const { data: locations, error } = await supabase
    .from("v_location_capacity")
    .select("*")
    .eq("household_id", householdId)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Error fetching locations:", error);
  }

  const locationList = (locations || []) as LocationCapacityRow[];

  // Calculate totals
  const totals = locationList.reduce(
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-typography-900">Locations</h1>
          <p className="mt-1 text-sm text-typography-600">
            Manage your storage locations and facilities
          </p>
        </div>
        <Link href="/dashboard/locations/new">
          <Button>
            <ButtonText>Add Location</ButtonText>
          </Button>
        </Link>
      </div>

      {/* Locations Grid */}
      {locationList.length === 0 ? (
        <div className="bg-background-0 rounded-lg shadow p-12 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center mb-4">
            <svg
              className="w-6 h-6 text-primary-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-typography-900 mb-2">
            No locations yet
          </h3>
          <p className="text-typography-600 mb-6">
            Add your first storage location to organize your pallets.
          </p>
          <Link href="/dashboard/locations/new">
            <Button>
              <ButtonText>Add Location</ButtonText>
            </Button>
          </Link>
        </div>
      ) : (
        <LocationsGrid locations={locationList} />
      )}

      {/* Stats */}
      {locationList.length > 0 && (
        <div className="grid gap-4 md:grid-cols-4">
          <div className="bg-background-0 rounded-lg shadow p-6">
            <div className="text-sm font-medium text-typography-500">
              Total Locations
            </div>
            <div className="mt-1 text-3xl font-bold text-typography-900">
              {locationList.length}
            </div>
          </div>
          <div className="bg-background-0 rounded-lg shadow p-6">
            <div className="text-sm font-medium text-typography-500">
              Total Pallets
            </div>
            <div className="mt-1 text-3xl font-bold text-typography-900">
              {totals.totalPallets}
            </div>
          </div>
          <div className="bg-background-0 rounded-lg shadow p-6">
            <div className="text-sm font-medium text-typography-500">
              Total Boxes
            </div>
            <div className="mt-1 text-3xl font-bold text-typography-900">
              {totals.totalBoxes}
            </div>
          </div>
          <div className="bg-background-0 rounded-lg shadow p-6">
            <div className="text-sm font-medium text-typography-500">
              Overall Utilization
            </div>
            <div className="mt-1 text-3xl font-bold text-typography-900">
              {overallUtilization}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
