import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-ssr";
import Link from "next/link";
import { Button, ButtonText } from "@/components/ui/button";

type LocationDetailPageProps = {
  params: Promise<{ id: string }>;
};

type LocationRow = {
  id: string;
  household_id: string;
  name: string;
  code: string | null;
  facility_name: string | null;
  facility_address: string | null;
  width_feet: number | null;
  depth_feet: number | null;
  height_feet: number | null;
  square_feet: number | null;
  access_code: string | null;
  access_hours: string | null;
  notes: string | null;
  color: string | null;
  icon: string | null;
  is_active: boolean;
  is_default: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type PalletWithCapacity = {
  id: string;
  code: string;
  name: string | null;
  is_active: boolean;
  total_positions: number;
  occupied_positions: number;
  available_positions: number;
  utilization_percent: number;
};

function CapacityBar({ percent }: { percent: number }) {
  const getBarColor = (p: number) => {
    if (p >= 90) return "bg-error-500";
    if (p >= 70) return "bg-warning-500";
    return "bg-success-500";
  };

  return (
    <div className="w-full bg-background-200 rounded-full h-2">
      <div
        className={`h-2 rounded-full transition-all ${getBarColor(percent)}`}
        style={{ width: `${Math.min(percent, 100)}%` }}
      />
    </div>
  );
}

export default async function LocationDetailPage({
  params,
}: LocationDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Verify authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch location
  const { data: locationData, error } = await supabase
    .from("locations")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  const location = locationData as LocationRow | null;

  if (error) {
    console.error("Error fetching location:", error);
    notFound();
  }

  if (!location) {
    notFound();
  }

  // Fetch pallets in this location with capacity
  const { data: palletsData } = await supabase
    .from("v_pallet_capacity")
    .select("*")
    .eq("location_id", id)
    .order("code", { ascending: true });

  const pallets = (palletsData || []) as PalletWithCapacity[];

  // Calculate totals
  const totals = pallets.reduce(
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/dashboard/locations"
            className="text-sm text-primary-500 hover:text-primary-700 mb-2 inline-block"
          >
            ← Back to Locations
          </Link>
          <div className="flex items-center gap-3">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: borderColor }}
            />
            <h1 className="text-3xl font-bold text-typography-900">
              {location.name}
            </h1>
            {location.code && (
              <span className="px-2 py-1 text-sm font-medium bg-background-100 text-typography-600 rounded">
                {location.code}
              </span>
            )}
            {location.is_default && (
              <span className="px-2 py-1 text-sm font-medium bg-primary-100 text-primary-700 rounded">
                Default
              </span>
            )}
            {!location.is_active && (
              <span className="px-2 py-1 text-sm font-medium bg-background-200 text-typography-500 rounded">
                Inactive
              </span>
            )}
          </div>
          {location.facility_name && (
            <p className="mt-1 text-sm text-typography-600">
              {location.facility_name}
            </p>
          )}
        </div>
        <Link href={`/dashboard/locations/${id}/edit`}>
          <Button variant="outline">
            <ButtonText>Edit Location</ButtonText>
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Location Info Card */}
        <div className="lg:col-span-2 bg-background-0 rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold text-typography-900">
            Location Details
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            {location.facility_address && (
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-typography-500">
                  Address
                </label>
                <p className="text-base text-typography-900">
                  {location.facility_address}
                </p>
              </div>
            )}

            {location.access_hours && (
              <div>
                <label className="text-sm font-medium text-typography-500">
                  Access Hours
                </label>
                <p className="text-base text-typography-900">
                  {location.access_hours}
                </p>
              </div>
            )}

            {location.access_code && (
              <div>
                <label className="text-sm font-medium text-typography-500">
                  Access Code
                </label>
                <p className="text-base text-typography-900 font-mono">
                  {location.access_code}
                </p>
              </div>
            )}

            {(location.width_feet || location.depth_feet || location.height_feet) && (
              <div>
                <label className="text-sm font-medium text-typography-500">
                  Dimensions
                </label>
                <p className="text-base text-typography-900">
                  {[
                    location.width_feet && `${location.width_feet}ft W`,
                    location.depth_feet && `${location.depth_feet}ft D`,
                    location.height_feet && `${location.height_feet}ft H`,
                  ]
                    .filter(Boolean)
                    .join(" × ")}
                </p>
              </div>
            )}

            {location.square_feet && (
              <div>
                <label className="text-sm font-medium text-typography-500">
                  Square Footage
                </label>
                <p className="text-base text-typography-900">
                  {location.square_feet} sq ft
                </p>
              </div>
            )}

            {location.notes && (
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-typography-500">
                  Notes
                </label>
                <p className="text-base text-typography-900 whitespace-pre-wrap">
                  {location.notes}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Capacity Card */}
        <div className="bg-background-0 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-typography-900 mb-4">
            Capacity
          </h2>

          <div className="space-y-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-typography-900">
                {utilizationPercent}%
              </div>
              <div className="text-sm text-typography-500">Utilization</div>
            </div>

            <CapacityBar percent={utilizationPercent} />

            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-xl font-semibold text-typography-900">
                  {pallets.length}
                </div>
                <div className="text-xs text-typography-500">Pallets</div>
              </div>
              <div>
                <div className="text-xl font-semibold text-typography-900">
                  {totals.occupiedPositions}
                </div>
                <div className="text-xs text-typography-500">Used</div>
              </div>
              <div>
                <div className="text-xl font-semibold text-success-600">
                  {totals.availablePositions}
                </div>
                <div className="text-xs text-typography-500">Available</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pallets Section */}
      <div className="bg-background-0 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-typography-900">
            Pallets ({pallets.length})
          </h2>
          <Button size="sm">
            <ButtonText>Add Pallet</ButtonText>
          </Button>
        </div>

        {pallets.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-typography-500 mb-4">
              No pallets in this location yet.
            </p>
            <Button>
              <ButtonText>Add First Pallet</ButtonText>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-background-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-typography-500">
                    Code
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-typography-500">
                    Name
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-typography-500">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-typography-500">
                    Capacity
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-typography-500">
                    Utilization
                  </th>
                </tr>
              </thead>
              <tbody>
                {pallets.map((pallet) => (
                  <tr
                    key={pallet.id}
                    className="border-b border-background-100 hover:bg-background-50"
                  >
                    <td className="py-3 px-4">
                      <span className="font-mono font-medium text-typography-900">
                        {pallet.code}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-typography-700">
                      {pallet.name || "-"}
                    </td>
                    <td className="py-3 px-4">
                      {pallet.is_active ? (
                        <span className="text-success-600 text-sm">Active</span>
                      ) : (
                        <span className="text-typography-400 text-sm">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-typography-700">
                      {pallet.occupied_positions} / {pallet.total_positions}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-20">
                          <CapacityBar percent={pallet.utilization_percent} />
                        </div>
                        <span className="text-sm text-typography-600 w-10 text-right">
                          {pallet.utilization_percent}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="bg-background-0 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-typography-900 mb-4">
          Metadata
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-typography-500">
              Created
            </label>
            <p className="text-sm text-typography-900">
              {new Date(location.created_at).toLocaleString()}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-typography-500">
              Last Updated
            </label>
            <p className="text-sm text-typography-900">
              {new Date(location.updated_at).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
