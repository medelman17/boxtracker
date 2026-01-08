"use client";

import { useState } from "react";
import Link from "next/link";
import { StatusBadge } from "@boxtrack/ui";
import { pdf } from "@react-pdf/renderer";
import { BoxLabelsDocument } from "./pdf/box-label";
import { generateQRCodeDataUrls } from "@/lib/qr-utils";
import { downloadBlob } from "@/lib/qr-utils";

type BoxesTableProps = {
  boxes: any[]; // Accept any[] from parent to avoid complex type assertions
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

      // Get selected boxes (cast to any for PDF component compatibility)
      const selectedBoxes = boxes.filter((box) => selectedIds.has(box.id)) as any[];

      // Generate QR code data URLs in parallel
      const qrContents = selectedBoxes.map(
        (box: any) => box.qr_code || `boxtrack://box/${box.id}`
      );
      const qrCodes = await generateQRCodeDataUrls(qrContents, 144); // 2" at 72 DPI

      // Create PDF
      const blob = await pdf(
        <BoxLabelsDocument boxes={selectedBoxes} qrCodes={qrCodes} />
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
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-blue-900">
              {selectedIds.size} box{selectedIds.size !== 1 ? "es" : ""}{" "}
              selected
            </span>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear selection
            </button>
          </div>
          <button
            onClick={handleGenerateLabels}
            disabled={isGenerating}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating
              ? "Generating PDF..."
              : `Generate ${selectedIds.size} Label${selectedIds.size !== 1 ? "s" : ""}`}
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
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
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                  aria-label="Select all boxes"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Label
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Photos
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {boxes.map((box: any) => (
              <tr
                key={box.id}
                className={`hover:bg-gray-50 ${
                  selectedIds.has(box.id) ? "bg-blue-50" : ""
                }`}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(box.id)}
                    onChange={() => toggleSelect(box.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                    aria-label={`Select ${box.label}`}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {box.label}
                      </div>
                      {box.description && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {box.description}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge status={box.status as "stored" | "in_transit" | "delivered" | "archived"} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {box.categories?.name || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {box.box_types?.name || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {box.photo_count || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(box.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Link
                    href={`/dashboard/boxes/${box.id}`}
                    className="text-blue-600 hover:text-blue-900"
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
