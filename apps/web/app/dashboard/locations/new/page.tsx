import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-ssr";
import { LocationForm } from "@/components/locations/location-form";
import type { UserHouseholdWithHouseholdName } from "@boxtrack/shared";
import Link from "next/link";

export default async function NewLocationPage() {
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
        <p className="text-typography-600">No household found. Please create one.</p>
      </div>
    );
  }

  const householdId = userHouseholds.household_id;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link
          href="/dashboard/locations"
          className="text-sm text-primary-500 hover:text-primary-700 mb-2 inline-block"
        >
          ← Back to Locations
        </Link>
        <h1 className="text-3xl font-bold text-typography-900">
          Add New Location
        </h1>
        <p className="mt-1 text-sm text-typography-600">
          Create a new storage location to organize your pallets
        </p>
      </div>

      <LocationForm householdId={householdId} mode="create" />
    </div>
  );
}
