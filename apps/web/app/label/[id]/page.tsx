import { Metadata } from "next";
import { createClient } from "@/lib/supabase-ssr";
import { notFound } from "next/navigation";
import { QRCode, StatusBadge } from "@boxtrack/ui";
import { generateQRCodeContent, type BoxDetailQueryResult } from "@boxtrack/shared";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();

  const { data: box } = await supabase
    .from("boxes")
    .select("label")
    .eq("id", id)
    .maybeSingle();

  return {
    title: `Label: ${box?.label ?? "Box Not Found"}`,
    description: "Printable label for BoxTrack box",
  };
}

export default async function LabelPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: boxData, error } = await supabase
    .from("boxes")
    .select(
      `
      *,
      categories (*),
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

  // Format location for label (compact format)
  const locationCompact = box.row_positions
    ? `P${box.row_positions.pallet_rows?.pallets?.code || "?"} / R${
        box.row_positions.pallet_rows?.row_number || "?"
      } / #${box.row_positions.position_number || "?"}`
    : "No location";

  return (
    <div className="min-h-screen bg-gray-100 p-8 print:p-0 print:bg-white">
      <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow print:shadow-none print:max-w-none print:mx-0">
        {/* Header */}
        <div className="text-center border-b border-gray-200 pb-4 mb-4 print:border-black">
          <h1 className="text-2xl font-bold text-gray-900">BoxTrack</h1>
        </div>

        {/* QR Code */}
        <div className="flex justify-center mb-4">
          <div className="border-2 border-gray-200 p-2 print:border-black">
            <QRCode
              value={box.qr_code || generateQRCodeContent(box.id)}
              size={200}
              level="M"
              testID="label-qr-code"
            />
          </div>
        </div>

        {/* Box Info */}
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold text-gray-900">{box.label}</h2>

          {box.categories && (
            <p className="text-lg text-gray-700">{box.categories.name}</p>
          )}

          <p className="text-lg font-medium text-gray-800">{locationCompact}</p>

          <div className="flex justify-center">
            <StatusBadge status={box.status} />
          </div>

          <p className="text-sm text-gray-500 font-mono pt-2">
            ID: {id.slice(0, 8).toUpperCase()}
          </p>
        </div>

        {/* Print Button (hidden in print) */}
        <div className="mt-6 text-center print:hidden space-x-4">
          <button
            onClick={() => window.print()}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Print Label
          </button>
          <a
            href={`/box/${id}`}
            className="inline-block text-primary-600 px-6 py-2 hover:underline"
          >
            View Box Details
          </a>
        </div>
      </div>

      {/* Print Styles */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              body {
                margin: 0;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              @page {
                size: 4in 3.33in;
                margin: 0.25in;
              }
            }
          `,
        }}
      />
    </div>
  );
}
