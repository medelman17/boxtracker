"use client";

import { useState } from "react";
import Link from "next/link";
import { StatusBadge } from "@boxtrack/ui";
import type { BoxListItem } from "@boxtrack/shared";
import { pdf } from "@react-pdf/renderer";
import { BoxLabelsDocument } from "./pdf/box-label";
import { generateQRCodeDataUrls } from "@/lib/qr-utils";
import { downloadBlob } from "@/lib/qr-utils";
import { Button, ButtonText } from "@/components/ui/button";

type BoxesTableProps = {
  boxes: BoxListItem[];
};

export function BoxesTable({ boxes }: BoxesTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleSelectAll = () => {
    if (selectedIds.size === boxes.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(boxes.map((b) => b.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleGenerateLabels = async () => {
    try {
      setIsGenerating(true);
      setError(null);

      // Get selected boxes
      const selectedBoxes = boxes.filter((box) => selectedIds.has(box.id));

      // Generate QR code data URLs in parallel
      const qrContents = selectedBoxes.map(
        (box) => `boxtrack://box/${box.id}`
      );
      const qrCodes = await generateQRCodeDataUrls(qrContents, 144); // 2" at 72 DPI

      // Create PDF
      // BoxListItem is compatible with LabelBox used by the PDF component
      const blob = await pdf(
        <BoxLabelsDocument boxes={selectedBoxes as unknown as Parameters<typeof BoxLabelsDocument>[0]['boxes']} qrCodes={qrCodes} />
      ).toBlob();

      // Download
      const timestamp = new Date().toISOString().split("T")[0];
      downloadBlob(blob, `boxtrack-labels-${timestamp}.pdf`);

      // Clear selection after successful generation
      setSelectedIds(new Set());
    } catch (err) {
      console.error("Error generating labels:", err);
      setError(
        err instanceof Error ? err.message : "Failed to generate labels"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const allSelected = boxes.length > 0 && selectedIds.size === boxes.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      {selectedIds.size > 0 && (
        <div className="bg-primary-0 border border-primary-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-primary-900">
              {selectedIds.size} box{selectedIds.size !== 1 ? "es" : ""}{" "}
              selected
            </span>
            <Button
              action="secondary"
              variant="link"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
            >
              <ButtonText>Clear selection</ButtonText>
            </Button>
          </div>
          <Button
            onClick={handleGenerateLabels}
            disabled={isGenerating}
            isLoading={isGenerating}
          >
            <ButtonText>
              {isGenerating
                ? "Generating PDF..."
                : `Generate ${selectedIds.size} Label${selectedIds.size !== 1 ? "s" : ""}`}
            </ButtonText>
          </Button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-error-0 border border-error-200 rounded-lg p-4">
          <p className="text-sm text-error-700">{error}</p>
        </div>
      )}

      {/* Table */}
      <div className="bg-background-0 rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-background-200">
          <thead className="bg-background-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(input) => {
                    if (input) {
                      input.indeterminate = someSelected;
                    }
                  }}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 text-primary-500 focus:ring-primary-500 border-background-300 rounded cursor-pointer"
                  aria-label="Select all boxes"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-typography-500 uppercase tracking-wider">
                Label
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-typography-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-typography-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-typography-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-typography-500 uppercase tracking-wider">
                Photos
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-typography-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-typography-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-background-0 divide-y divide-background-200">
            {boxes.map((box) => (
              <tr
                key={box.id}
                className={`hover:bg-background-50 ${
                  selectedIds.has(box.id) ? "bg-primary-0" : ""
                }`}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(box.id)}
                    onChange={() => toggleSelect(box.id)}
                    className="h-4 w-4 text-primary-500 focus:ring-primary-500 border-background-300 rounded cursor-pointer"
                    aria-label={`Select ${box.label}`}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div>
                      <div className="text-sm font-medium text-typography-900">
                        {box.label}
                      </div>
                      {box.description && (
                        <div className="text-sm text-typography-500 truncate max-w-xs">
                          {box.description}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge status={box.status} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-typography-900">
                  {box.categories?.name || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-typography-900">
                  {box.box_types?.name || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-typography-900">
                  {box.photo_count || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-typography-500">
                  {new Date(box.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Link
                    href={`/dashboard/boxes/${box.id}`}
                    className="text-primary-500 hover:text-primary-700"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
