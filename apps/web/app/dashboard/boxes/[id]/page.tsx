import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-ssr";
import { QRCode } from "@boxtrack/ui";
import { StatusBadge } from "@boxtrack/ui";
import { generateQRCodeContent } from "@boxtrack/shared";
import { PrintLabelButton } from "@/components/print-label-button";
import Link from "next/link";

type BoxDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function BoxDetailPage({ params }: BoxDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Verify authentication
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  // Fetch box with all related data
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

  // Type assertion for the complex query result
  const box = boxData as any;

  if (error) {
    console.error("Error fetching box:", error);
    notFound();
  }

  if (!box) {
    notFound();
  }

  // Format location string
  const location = box.row_positions
    ? `${box.row_positions.pallet_rows?.pallets?.name || "Unknown"} - Row ${
        box.row_positions.pallet_rows?.row_number || "?"
      }, Position ${box.row_positions.position_number || "?"}`
    : "No location assigned";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/dashboard/boxes"
            className="text-sm text-blue-600 hover:text-blue-800 mb-2 inline-block"
          >
            ← Back to Boxes
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{box.label}</h1>
          <p className="mt-1 text-sm text-gray-500">Box ID: {box.id}</p>
        </div>
        <StatusBadge status={box.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Box Information Card */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Box Information
          </h2>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-500">
                Label
              </label>
              <p className="text-base text-gray-900">{box.label}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">
                Status
              </label>
              <p className="text-base text-gray-900 capitalize">{box.status}</p>
            </div>

            {box.categories && (
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Category
                </label>
                <p className="text-base text-gray-900">
                  {box.categories.name}
                </p>
              </div>
            )}

            {box.box_types && (
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Box Type
                </label>
                <p className="text-base text-gray-900">{box.box_types.name}</p>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-gray-500">
                Location
              </label>
              <p className="text-base text-gray-900">{location}</p>
            </div>

            {box.description && (
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Description
                </label>
                <p className="text-base text-gray-900">{box.description}</p>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-gray-500">
                Photo Count
              </label>
              <p className="text-base text-gray-900">{box.photo_count || 0}</p>
            </div>
          </div>
        </div>

        {/* QR Code Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            QR Code
          </h2>

          <div className="flex flex-col items-center space-y-4">
            <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
              <QRCode
                value={box.qr_code || generateQRCodeContent(box.id)}
                size={200}
                level="M"
                testID="box-qr-code"
              />
            </div>

            <p className="text-sm text-gray-600 text-center">
              Scan this code to quickly access box details
            </p>

            <div className="text-xs text-gray-500 font-mono bg-gray-50 px-3 py-2 rounded">
              {box.qr_code || generateQRCodeContent(box.id)}
            </div>

            <PrintLabelButton box={box} />
          </div>
        </div>
      </div>

      {/* Photos Section */}
      {box.photos && box.photos.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Photos ({box.photos.length})
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {box.photos.map((photo: any) => (
              <div
                key={photo.id}
                className="aspect-square bg-gray-100 rounded-lg overflow-hidden"
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
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Metadata</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-gray-500">Created</label>
            <p className="text-sm text-gray-900">
              {new Date(box.created_at).toLocaleString()}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">
              Last Updated
            </label>
            <p className="text-sm text-gray-900">
              {new Date(box.updated_at).toLocaleString()}
            </p>
          </div>
          {box.closed_at && (
            <div>
              <label className="text-sm font-medium text-gray-500">
                Closed At
              </label>
              <p className="text-sm text-gray-900">
                {new Date(box.closed_at).toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
