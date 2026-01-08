import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-ssr";
import Link from "next/link";
import { BoxesTable } from "@/components/boxes-table";
import type {
  UserHouseholdWithHouseholdName,
  BoxListItem,
} from "@boxtrack/shared";

export default async function BoxesPage() {
  const supabase = await createClient();

  // Verify authentication
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  // Fetch user's active household
  const { data: userHouseholdsData } = await supabase
    .from("user_households")
    .select("household_id, households(id, name)")
    .eq("user_id", session.user.id)
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

  // Fetch boxes for the household
  const { data: boxes, error } = await supabase
    .from("boxes")
    .select(
      `
      id,
      label,
      status,
      description,
      photo_count,
      created_at,
      categories (name),
      box_types (name)
    `
    )
    .eq("household_id", householdId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching boxes:", error);
  }

  const boxList = (boxes || []) as unknown as BoxListItem[];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Boxes</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your storage boxes
          </p>
        </div>
        <Link
          href="/dashboard/boxes/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add Box
        </Link>
      </div>

      {/* Boxes List */}
      {boxList.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No boxes yet
          </h3>
          <p className="text-gray-600 mb-6">
            Get started by creating your first box.
          </p>
          <Link
            href="/dashboard/boxes/new"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Box
          </Link>
        </div>
      ) : (
        <BoxesTable boxes={boxList} />
      )}

      {/* Stats */}
      {boxList.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Total Boxes</div>
            <div className="mt-1 text-3xl font-bold text-gray-900">
              {boxList.length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">
              Stored Boxes
            </div>
            <div className="mt-1 text-3xl font-bold text-gray-900">
              {boxList.filter((b) => b.status === "stored").length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">
              Total Photos
            </div>
            <div className="mt-1 text-3xl font-bold text-gray-900">
              {boxList.reduce((sum, b) => sum + (b.photo_count || 0), 0)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
