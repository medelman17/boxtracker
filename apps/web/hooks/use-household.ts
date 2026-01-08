"use client";

import { useAuth } from "@/lib/auth-context";

/**
 * Hook for accessing active household context and role-based permissions
 */
export function useHousehold() {
  const { activeHousehold, households, switchHousehold } = useAuth();

  return {
    // Current household
    activeHousehold,
    households,
    switchHousehold,

    // Convenience accessors
    householdId: activeHousehold?.id || null,
    householdName: activeHousehold?.name || null,
    role: activeHousehold?.role || null,

    // Role-based permission checks
    isOwner: activeHousehold?.role === "owner",
    isAdmin: activeHousehold?.role === "admin",
    isMember: activeHousehold?.role === "member",
    isViewer: activeHousehold?.role === "viewer",

    // Permission helpers (cumulative)
    canManage: ["owner", "admin"].includes(activeHousehold?.role || ""),
    canEdit: ["owner", "admin", "member"].includes(activeHousehold?.role || ""),
    canView: !!activeHousehold,
  };
}
