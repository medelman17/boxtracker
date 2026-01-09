import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-ssr";
import { BoxForm } from "@/components/box-form";
import type { UserHouseholdWithHouseholdName } from "@boxtrack/shared";

export default async function NewBoxPage() {
  const supabase = await createClient();

  // Verify authentication - use getUser() to validate the JWT server-side
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

  // Fetch categories for the household
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .or(`household_id.eq.${householdId},household_id.is.null`)
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  // Fetch box types for the household
  const { data: boxTypes } = await supabase
    .from("box_types")
    .select("id, name, description")
    .or(`household_id.eq.${householdId},household_id.is.null`)
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-typography-900">Create New Box</h1>
        <p className="mt-1 text-sm text-typography-600">
          Add a new box to your inventory
        </p>
      </div>

      <BoxForm
        householdId={householdId}
        categories={categories || []}
        boxTypes={boxTypes || []}
      />
    </div>
  );
}
