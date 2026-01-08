"use client";

import { useAuth } from "@/lib/auth-context";
import type { HouseholdWithRole } from "@boxtrack/shared";

export function HouseholdSelector() {
  const { activeHousehold, households, switchHousehold } = useAuth();

  // Don't show selector if user only has one household
  if (households.length <= 1) {
    return (
      <span className="text-sm text-gray-700 font-medium">
        {activeHousehold?.name || "My Household"}
      </span>
    );
  }

  return (
    <select
      value={activeHousehold?.id || ""}
      onChange={(e) => switchHousehold(e.target.value)}
      className="text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white py-1.5 px-3"
      aria-label="Select household"
    >
      {households.map((household: HouseholdWithRole) => (
        <option key={household.id} value={household.id}>
          {household.name}
        </option>
      ))}
    </select>
  );
}
