"use client";

import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { Button } from "@boxtrack/ui";
import { SingleBoxLabelDocument } from "./pdf/box-label";
import { generateQRCodeDataUrl, downloadBlob } from "@/lib/qr-utils";
import type { Database } from "@boxtrack/shared";

type Box = Database["public"]["Tables"]["boxes"]["Row"] & {
  category?: { name: string } | null;
  box_type?: { name: string } | null;
};

type PrintLabelButtonProps = {
  box: Box;
};

/**
 * Client component for printing a single box label
 * Generates QR code, creates PDF, and triggers download
 */
export function PrintLabelButton({ box }: PrintLabelButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePrint = async () => {
    try {
      setIsGenerating(true);
      setError(null);

      // Generate QR code as data URL
      const qrCodeDataUrl = await generateQRCodeDataUrl(
        box.qr_code || `boxtrack://box/${box.id}`,
        144 // 2 inches at 72 DPI = 144 pixels
      );

      // Create PDF blob
      const blob = await pdf(
        <SingleBoxLabelDocument box={box} qrCode={qrCodeDataUrl} />
      ).toBlob();

      // Download PDF
      downloadBlob(blob, `box-${box.label}-label.pdf`);
    } catch (err) {
      console.error("Error generating label:", err);
      setError(
        err instanceof Error ? err.message : "Failed to generate label"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button onClick={handlePrint} disabled={isGenerating}>
        {isGenerating ? "Generating PDF..." : "Print Label"}
      </Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
