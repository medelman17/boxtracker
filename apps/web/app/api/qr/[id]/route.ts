import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { generateQRCodeContent } from "@boxtrack/shared";

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/qr/[id]
 * Generate a QR code image for a box
 * Returns a PNG image that can be used for printing labels
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  // Generate the QR code content URL
  const url = generateQRCodeContent(id);

  try {
    // Generate QR code as data URL
    const qrDataUrl = await QRCode.toDataURL(url, {
      width: 300,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
      errorCorrectionLevel: "M",
    });

    // Convert data URL to buffer
    const base64Data = qrDataUrl.split(",")[1];
    const buffer = Buffer.from(base64Data, "base64");

    // Return as PNG image with caching headers
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Failed to generate QR code:", error);
    return NextResponse.json(
      { error: "Failed to generate QR code" },
      { status: 500 }
    );
  }
}
