"use client";

import Link from "next/link";

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

type LocationsGridProps = {
  locations: LocationCapacityRow[];
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

function LocationCard({ location }: { location: LocationCapacityRow }) {
  const borderColor = location.color || "#6B7280";

  return (
    <Link href={`/dashboard/locations/${location.location_id}`}>
      <div
        className="bg-background-0 rounded-lg shadow hover:shadow-md transition-shadow p-6 border-l-4 cursor-pointer"
        style={{ borderLeftColor: borderColor }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-typography-900">
                {location.location_name}
              </h3>
              {location.location_code && (
                <span className="px-2 py-0.5 text-xs font-medium bg-background-100 text-typography-600 rounded">
                  {location.location_code}
                </span>
              )}
              {location.is_default && (
                <span className="px-2 py-0.5 text-xs font-medium bg-primary-100 text-primary-700 rounded">
                  Default
                </span>
              )}
            </div>
            {location.facility_name && (
              <p className="text-sm text-typography-500 mt-1">
                {location.facility_name}
              </p>
            )}
          </div>
          {!location.is_active && (
            <span className="px-2 py-1 text-xs font-medium bg-background-200 text-typography-500 rounded">
              Inactive
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <div className="text-2xl font-bold text-typography-900">
              {location.total_pallets}
            </div>
            <div className="text-xs text-typography-500">Pallets</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-typography-900">
              {location.box_count}
            </div>
            <div className="text-xs text-typography-500">Boxes</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-typography-900">
              {location.available_positions}
            </div>
            <div className="text-xs text-typography-500">Available</div>
          </div>
        </div>

        {/* Capacity Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-typography-500">
            <span>Capacity</span>
            <span>{location.utilization_percent}%</span>
          </div>
          <CapacityBar percent={location.utilization_percent} />
          <div className="text-xs text-typography-400">
            {location.occupied_positions} / {location.total_positions} positions used
          </div>
        </div>
      </div>
    </Link>
  );
}

export function LocationsGrid({ locations }: LocationsGridProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {locations.map((location) => (
        <LocationCard key={location.location_id} location={location} />
      ))}
    </div>
  );
}
