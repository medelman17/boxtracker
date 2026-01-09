import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-ssr";
import Link from "next/link";
import type {
  UserHouseholdWithHouseholdName,
  BoxListItem,
} from "@boxtrack/shared";
import { LabelsDashboardClient } from "./labels-dashboard-client";

export default async function LabelsPage() {
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

  // Fetch boxes for label generation
  const { data: boxes, error } = await supabase
    .from("boxes")
    .select(
      `
      id,
      label,
      status,
      description,
      categories (name)
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
          <h1 className="text-3xl font-bold text-typography-900">Print Labels</h1>
          <p className="mt-1 text-sm text-typography-600">
            Generate Avery 5168 labels for your boxes
          </p>
        </div>
        <Link
          href="/dashboard/boxes"
          className="text-primary-500 hover:underline text-sm"
        >
          Back to Boxes
        </Link>
      </div>

      {/* Label format info */}
      <div className="bg-background-0 rounded-lg shadow p-6">
        <div className="flex items-start gap-6">
          <div className="bg-background-50 rounded-lg p-4 flex-shrink-0">
            <div className="grid grid-cols-2 gap-1 w-16 h-20">
              <div className="bg-primary-100 border border-primary-300 rounded-sm"></div>
              <div className="bg-primary-100 border border-primary-300 rounded-sm"></div>
              <div className="bg-primary-100 border border-primary-300 rounded-sm"></div>
              <div className="bg-primary-100 border border-primary-300 rounded-sm"></div>
            </div>
          </div>
          <div className="flex-grow">
            <h2 className="text-lg font-semibold text-typography-900">
              Avery 5168 Format
            </h2>
            <p className="mt-1 text-typography-600 text-sm">
              Large shipping labels optimized for QR code scanning at distances up
              to 30 inches.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-typography-500">Label Size:</span>
                <span className="ml-2 text-typography-900 font-medium">
                  3.5&quot; &times; 5.0&quot;
                </span>
              </div>
              <div>
                <span className="text-typography-500">Labels per sheet:</span>
                <span className="ml-2 text-typography-900 font-medium">4</span>
              </div>
              <div>
                <span className="text-typography-500">Layout:</span>
                <span className="ml-2 text-typography-900 font-medium">
                  2 &times; 2 grid
                </span>
              </div>
              <div>
                <span className="text-typography-500">QR Error Correction:</span>
                <span className="ml-2 text-typography-900 font-medium">
                  Level M (15%)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Box selection and print */}
      {boxList.length === 0 ? (
        <div className="bg-background-0 rounded-lg shadow p-12 text-center">
          <h3 className="text-lg font-medium text-typography-900 mb-2">
            No boxes yet
          </h3>
          <p className="text-typography-600 mb-6">
            Create boxes first to generate labels.
          </p>
          <Link
            href="/dashboard/boxes/new"
            className="inline-flex items-center justify-center px-5 py-2.5 bg-primary-500 text-white rounded font-medium hover:bg-primary-600"
          >
            Create Box
          </Link>
        </div>
      ) : (
        <LabelsDashboardClient boxes={boxList} />
      )}
    </div>
  );
}
