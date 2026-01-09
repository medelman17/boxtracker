import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-ssr";
import { HouseholdSelector } from "@/components/household-selector";
import { LogoutButton } from "@/components/logout-button";
import Link from "next/link";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const supabase = await createClient();
  // Use getUser() instead of getSession() to validate the JWT server-side
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect to login if not authenticated (backup for middleware)
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background-50">
      <nav className="bg-background-0 shadow-sm border-b border-background-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link href="/dashboard" className="flex items-center space-x-2">
                <span className="text-xl font-bold text-typography-900">
                  BoxTrack
                </span>
              </Link>
              <nav className="flex space-x-4">
                <Link
                  href="/dashboard/boxes"
                  className="text-sm font-medium text-typography-700 hover:text-typography-900"
                >
                  Boxes
                </Link>
                <Link
                  href="/dashboard/locations"
                  className="text-sm font-medium text-typography-700 hover:text-typography-900"
                >
                  Locations
                </Link>
                <Link
                  href="/dashboard/labels"
                  className="text-sm font-medium text-typography-700 hover:text-typography-900"
                >
                  Labels
                </Link>
              </nav>
              <HouseholdSelector />
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-typography-600">{user.email}</span>
              <LogoutButton />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
