import { Metadata } from "next";
import { createClient } from "@/lib/supabase-ssr";
import { notFound } from "next/navigation";
import { QRCode, StatusBadge } from "@boxtrack/ui";
import { generateQRCodeContent, type BoxDetailQueryResult } from "@boxtrack/shared";
import { AppDownloadBanner } from "@/components/app-download-banner";
import Link from "next/link";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();

  const { data: box } = await supabase
    .from("boxes")
    .select("label, description")
    .eq("id", id)
    .maybeSingle();

  return {
    title: box?.label ?? "Box Not Found",
    description: box?.description ?? "View box contents in BoxTrack",
    openGraph: {
      title: box?.label ?? "BoxTrack",
      description: box?.description ?? "View box contents",
      type: "website",
    },
  };
}

export default async function PublicBoxPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch box with related data (RLS will handle access control)
  const { data: boxData, error } = await supabase
    .from("boxes")
    .select(
      `
      *,
      box_types (*),
      categories (*),
      photos (*),
      row_positions (
        position_number,
        pallet_rows (
          row_number,
          pallets (
            code,
            name
          )
        )
      )
    `
    )
    .eq("id", id)
    .maybeSingle();

  const box = boxData as BoxDetailQueryResult | null;

  if (error || !box) {
    notFound();
  }

  // Format location string
  const location = box.row_positions
    ? `${box.row_positions.pallet_rows?.pallets?.name || "Unknown"} - Row ${
        box.row_positions.pallet_rows?.row_number || "?"
      }, Position ${box.row_positions.position_number || "?"}`
    : "No location assigned";

  const deepLink = `https://oubx.vercel.app/box/${id}`;

  return (
    <main className="min-h-screen bg-background-50">
      <AppDownloadBanner
        deepLink={deepLink}
        message="Open in the BoxTrack app for the best experience"
      />

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-typography-900">{box.label}</h1>
            <p className="mt-1 text-sm text-typography-500">Box ID: {box.id}</p>
          </div>
          <StatusBadge status={box.status} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Box Information Card */}
          <div className="bg-background-0 rounded-lg shadow p-6 space-y-4">
            <h2 className="text-lg font-semibold text-typography-900">Box Information</h2>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-typography-500">Status</label>
                <p className="text-base text-typography-900 capitalize">{box.status}</p>
              </div>

              {box.categories && (
                <div>
                  <label className="text-sm font-medium text-typography-500">Category</label>
                  <p className="text-base text-typography-900">{box.categories.name}</p>
                </div>
              )}

              {box.box_types && (
                <div>
                  <label className="text-sm font-medium text-typography-500">Box Type</label>
                  <p className="text-base text-typography-900">{box.box_types.name}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-typography-500">Location</label>
                <p className="text-base text-typography-900">{location}</p>
              </div>

              {box.description && (
                <div>
                  <label className="text-sm font-medium text-typography-500">Description</label>
                  <p className="text-base text-typography-900">{box.description}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-typography-500">Photo Count</label>
                <p className="text-base text-typography-900">{box.photo_count || 0}</p>
              </div>
            </div>
          </div>

          {/* QR Code Card */}
          <div className="bg-background-0 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-typography-900 mb-4">QR Code</h2>

            <div className="flex flex-col items-center space-y-4">
              <div className="bg-background-0 border-2 border-background-200 rounded-lg p-4">
                <QRCode
                  value={box.qr_code || generateQRCodeContent(box.id)}
                  size={200}
                  level="M"
                  testID="box-qr-code"
                />
              </div>

              <p className="text-sm text-typography-600 text-center">
                Scan this code to quickly access box details
              </p>

              <div className="text-xs text-typography-500 font-mono bg-background-50 px-3 py-2 rounded break-all text-center">
                {box.qr_code || generateQRCodeContent(box.id)}
              </div>

              <Link
                href={`/label/${id}`}
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Print Label
              </Link>
            </div>
          </div>
        </div>

        {/* Photos Section */}
        {box.photos && box.photos.length > 0 && (
          <div className="bg-background-0 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-typography-900 mb-4">
              Photos ({box.photos.length})
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {box.photos.map((photo) => (
                <div
                  key={photo.id}
                  className="aspect-square bg-background-100 rounded-lg overflow-hidden"
                >
                  <img
                    src={photo.url}
                    alt={photo.description || "Box photo"}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="bg-background-0 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-typography-900 mb-4">Details</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-typography-500">Created</label>
              <p className="text-sm text-typography-900">
                {new Date(box.created_at).toLocaleString()}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-typography-500">Last Updated</label>
              <p className="text-sm text-typography-900">
                {new Date(box.updated_at).toLocaleString()}
              </p>
            </div>
            {box.closed_at && (
              <div>
                <label className="text-sm font-medium text-typography-500">Closed At</label>
                <p className="text-sm text-typography-900">
                  {new Date(box.closed_at).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sign in prompt */}
        <div className="text-center py-6">
          <p className="text-typography-600 mb-4">
            Sign in to manage this box and access all features
          </p>
          <Link
            href="/login"
            className="inline-flex items-center px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    </main>
  );
}
