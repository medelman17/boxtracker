"use client";

import { useHousehold } from "@/hooks/use-household";
import { useAuth } from "@/lib/auth-context";

export default function DashboardPage() {
  const { user, initialized } = useAuth();
  const { activeHousehold, role, canEdit, canManage } = useHousehold();

  if (!initialized) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Welcome back, {user?.fullName || user?.email}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Household Info Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900">
            Household
          </h2>
          <div className="mt-4 space-y-2">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Name:</span> {activeHousehold?.name}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Your role:</span>{" "}
              <span className="capitalize">{role}</span>
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Permissions:</span>{" "}
              {canManage ? "Full access" : canEdit ? "Can edit" : "View only"}
            </p>
          </div>
        </div>

        {/* Quick Stats Card (placeholder) */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900">
            Quick Stats
          </h2>
          <div className="mt-4 space-y-2">
            <p className="text-sm text-gray-600">
              Boxes feature coming soon...
            </p>
          </div>
        </div>

        {/* Quick Actions Card (placeholder) */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900">
            Quick Actions
          </h2>
          <div className="mt-4 space-y-2">
            <p className="text-sm text-gray-600">
              Actions coming soon...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
