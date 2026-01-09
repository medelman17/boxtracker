"use client";

import { useState, useCallback } from "react";
import { Button, ButtonText } from "@/components/ui/button";
import { LabelPrintDialog } from "@/components/label-print-dialog";
import { calculatePageCount } from "@/lib/labels";
import type { BoxListItem } from "@boxtrack/shared";

type LabelsDashboardClientProps = {
  boxes: BoxListItem[];
};

export function LabelsDashboardClient({ boxes }: LabelsDashboardClientProps) {
  const [selectedBoxIds, setSelectedBoxIds] = useState<Set<string>>(new Set());
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Filter boxes
  const filteredBoxes = boxes.filter((box) => {
    const matchesStatus = filterStatus === "all" || box.status === filterStatus;
    const matchesSearch =
      !searchQuery ||
      box.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      box.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Selection handlers
  const toggleBox = useCallback((boxId: string) => {
    setSelectedBoxIds((prev) => {
      const next = new Set(prev);
      if (next.has(boxId)) {
        next.delete(boxId);
      } else {
        next.add(boxId);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedBoxIds(new Set(filteredBoxes.map((box) => box.id)));
  }, [filteredBoxes]);

  const clearSelection = useCallback(() => {
    setSelectedBoxIds(new Set());
  }, []);

  // Get selected boxes
  const selectedBoxes = boxes.filter((box) => selectedBoxIds.has(box.id));

  return (
    <div className="space-y-6">
      {/* Filters and actions */}
      <div className="bg-background-0 rounded-lg shadow p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex-grow min-w-[200px]">
            <input
              type="text"
              placeholder="Search boxes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-background-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-background-200 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Status</option>
            <option value="empty">Empty</option>
            <option value="packing">Packing</option>
            <option value="packed">Packed</option>
            <option value="stored">Stored</option>
            <option value="retrieved">Retrieved</option>
          </select>

          {/* Selection actions */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={selectAll}>
              <ButtonText>Select All</ButtonText>
            </Button>
            {selectedBoxIds.size > 0 && (
              <Button variant="outline" size="sm" onClick={clearSelection}>
                <ButtonText>Clear ({selectedBoxIds.size})</ButtonText>
              </Button>
            )}
          </div>

          {/* Print button */}
          <Button
            action="primary"
            disabled={selectedBoxIds.size === 0}
            onClick={() => setIsPrintDialogOpen(true)}
          >
            <ButtonText>
              Print Labels ({selectedBoxIds.size})
            </ButtonText>
          </Button>
        </div>
      </div>

      {/* Selection summary */}
      {selectedBoxIds.size > 0 && (
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 flex items-center justify-between">
          <p className="text-primary-800">
            <span className="font-medium">{selectedBoxIds.size}</span> box
            {selectedBoxIds.size !== 1 ? "es" : ""} selected ={" "}
            <span className="font-medium">
              {calculatePageCount(selectedBoxIds.size)}
            </span>{" "}
            page{calculatePageCount(selectedBoxIds.size) !== 1 ? "s" : ""} of labels
          </p>
          <Button size="sm" onClick={() => setIsPrintDialogOpen(true)}>
            <ButtonText>Generate PDF</ButtonText>
          </Button>
        </div>
      )}

      {/* Box grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredBoxes.map((box) => {
          const isSelected = selectedBoxIds.has(box.id);
          const categoryName =
            (box as unknown as { categories?: { name: string } }).categories?.name;

          return (
            <div
              key={box.id}
              onClick={() => toggleBox(box.id)}
              className={`
                bg-background-0 rounded-lg shadow p-4 cursor-pointer transition-all
                ${
                  isSelected
                    ? "ring-2 ring-primary-500 bg-primary-50"
                    : "hover:shadow-md hover:bg-background-50"
                }
              `}
            >
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <div
                  className={`
                    w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center
                    ${
                      isSelected
                        ? "bg-primary-500 border-primary-500"
                        : "border-background-300"
                    }
                  `}
                >
                  {isSelected && (
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>

                {/* Box info */}
                <div className="flex-grow min-w-0">
                  <h3 className="font-medium text-typography-900 truncate">
                    {box.label}
                  </h3>
                  {categoryName && (
                    <p className="text-sm text-typography-500 truncate">
                      {categoryName}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className={`
                        inline-block px-2 py-0.5 text-xs rounded-full font-medium
                        ${box.status === "stored" ? "bg-success-100 text-success-700" : ""}
                        ${box.status === "packed" ? "bg-primary-100 text-primary-700" : ""}
                        ${box.status === "packing" ? "bg-warning-100 text-warning-700" : ""}
                        ${box.status === "empty" ? "bg-background-100 text-typography-600" : ""}
                        ${box.status === "retrieved" ? "bg-secondary-100 text-secondary-700" : ""}
                      `}
                    >
                      {box.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state for filtered results */}
      {filteredBoxes.length === 0 && (
        <div className="bg-background-0 rounded-lg shadow p-12 text-center">
          <p className="text-typography-600">
            No boxes match your filters. Try adjusting your search or status
            filter.
          </p>
        </div>
      )}

      {/* Print dialog */}
      <LabelPrintDialog
        isOpen={isPrintDialogOpen}
        onClose={() => setIsPrintDialogOpen(false)}
        boxes={selectedBoxes.map((box) => ({
          id: box.id,
          label: box.label,
        }))}
      />
    </div>
  );
}
