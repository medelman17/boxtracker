"use client";

import { useState, useCallback } from "react";
import { Button, ButtonText } from "@/components/ui/button";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Heading,
} from "@/components/ui/modal";
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
  Input,
  FormControlHelper,
  FormControlHelperText,
} from "@/components/ui/input";
import { GRID, calculatePageCount } from "@/lib/labels";

/**
 * Box data for label printing
 */
type LabelBox = {
  id: string;
  label: string;
};

/**
 * Calibration offset for printer alignment
 */
type Calibration = {
  x: number;
  y: number;
};

/**
 * Props for LabelPrintDialog
 */
type LabelPrintDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  boxes: LabelBox[];
};

/**
 * Dialog component for printing Avery 5168 labels
 *
 * Features:
 * - Displays selected boxes for label printing
 * - Calibration controls for printer alignment
 * - Generates and downloads PDF via API
 * - Shows print instructions
 */
export function LabelPrintDialog({
  isOpen,
  onClose,
  boxes,
}: LabelPrintDialogProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calibration, setCalibration] = useState<Calibration>({ x: 0, y: 0 });
  const [showInstructions, setShowInstructions] = useState(false);

  const pageCount = calculatePageCount(boxes.length);

  const handleCalibrationChange = useCallback(
    (axis: "x" | "y", value: string) => {
      const numValue = parseInt(value, 10);
      if (!isNaN(numValue) && numValue >= -36 && numValue <= 36) {
        setCalibration((prev) => ({ ...prev, [axis]: numValue }));
      }
    },
    []
  );

  const handleDownload = useCallback(async () => {
    if (boxes.length === 0) return;

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/labels", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          boxes: boxes.map((box) => ({ id: box.id, name: box.label })),
          calibration:
            calibration.x !== 0 || calibration.y !== 0 ? calibration : undefined,
          fetchDetails: false,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Failed to generate labels");
      }

      // Download the PDF
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download =
        response.headers.get("Content-Disposition")?.split("filename=")[1]?.replace(/"/g, "") ||
        `boxtracker-labels-${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      onClose();
    } catch (err) {
      console.error("Error generating labels:", err);
      setError(err instanceof Error ? err.message : "Failed to generate labels");
    } finally {
      setIsGenerating(false);
    }
  }, [boxes, calibration, onClose]);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent size="lg">
        <ModalHeader>
          <Heading size="lg">Print Labels (Avery 5168)</Heading>
          <ModalCloseButton />
        </ModalHeader>

        <ModalBody className="space-y-6">
          {/* Box count summary */}
          <div className="bg-background-50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-typography-900 font-medium">
                  {boxes.length} label{boxes.length !== 1 ? "s" : ""} selected
                </p>
                <p className="text-typography-500 text-sm">
                  {pageCount} page{pageCount !== 1 ? "s" : ""} ({GRID.labelsPerSheet}{" "}
                  labels per page)
                </p>
              </div>
              <div className="text-right">
                <p className="text-typography-500 text-sm">Format</p>
                <p className="text-typography-900 font-medium">
                  3.5&quot; &times; 5.0&quot;
                </p>
              </div>
            </div>
          </div>

          {/* Selected boxes list */}
          <div>
            <h3 className="text-typography-700 font-medium mb-2">Selected Boxes</h3>
            <div className="max-h-40 overflow-y-auto border border-background-200 rounded-lg">
              <ul className="divide-y divide-background-100">
                {boxes.map((box) => (
                  <li
                    key={box.id}
                    className="px-4 py-2 text-typography-700 text-sm"
                  >
                    {box.label}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Calibration controls */}
          <div>
            <h3 className="text-typography-700 font-medium mb-2">
              Printer Calibration (optional)
            </h3>
            <p className="text-typography-500 text-sm mb-4">
              Adjust if labels don&apos;t align with the die-cut lines. Values are in
              points (1 inch = 72 points).
            </p>
            <div className="grid grid-cols-2 gap-4">
              <FormControl>
                <FormControlLabel>
                  <FormControlLabelText>Horizontal Offset (X)</FormControlLabelText>
                </FormControlLabel>
                <Input
                  type="number"
                  value={calibration.x}
                  onChange={(e) => handleCalibrationChange("x", e.target.value)}
                  min={-36}
                  max={36}
                />
                <FormControlHelper>
                  <FormControlHelperText>
                    + shifts right, - shifts left
                  </FormControlHelperText>
                </FormControlHelper>
              </FormControl>
              <FormControl>
                <FormControlLabel>
                  <FormControlLabelText>Vertical Offset (Y)</FormControlLabelText>
                </FormControlLabel>
                <Input
                  type="number"
                  value={calibration.y}
                  onChange={(e) => handleCalibrationChange("y", e.target.value)}
                  min={-36}
                  max={36}
                />
                <FormControlHelper>
                  <FormControlHelperText>
                    + shifts down, - shifts up
                  </FormControlHelperText>
                </FormControlHelper>
              </FormControl>
            </div>
          </div>

          {/* Print instructions toggle */}
          <div>
            <button
              type="button"
              onClick={() => setShowInstructions(!showInstructions)}
              className="text-primary-500 text-sm font-medium hover:underline"
            >
              {showInstructions ? "Hide" : "Show"} print instructions
            </button>

            {showInstructions && (
              <div className="mt-3 bg-background-50 rounded-lg p-4 text-sm text-typography-700">
                <h4 className="font-medium mb-2">Critical Print Settings</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Scale: 100% / Actual Size</li>
                  <li>Page Sizing: Do NOT fit to page</li>
                  <li>Paper Type: Labels / Heavyweight</li>
                  <li>Orientation: Portrait</li>
                  <li>Color Mode: Grayscale or Black & White</li>
                </ul>

                <h4 className="font-medium mt-4 mb-2">Calibration Procedure</h4>
                <ol className="space-y-1 list-decimal list-inside">
                  <li>Print a test page on plain paper</li>
                  <li>Hold over label sheet against light</li>
                  <li>Measure offset in points (1 inch = 72pt)</li>
                  <li>Apply offset above and reprint</li>
                </ol>
              </div>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-error-50 text-error-600 rounded-lg p-4 text-sm">
              {error}
            </div>
          )}
        </ModalBody>

        <ModalFooter>
          <Button variant="outline" action="default" onClick={onClose}>
            <ButtonText>Cancel</ButtonText>
          </Button>
          <Button
            action="primary"
            onClick={handleDownload}
            disabled={isGenerating || boxes.length === 0}
            isLoading={isGenerating}
          >
            <ButtonText>
              {isGenerating ? "Generating..." : "Download PDF"}
            </ButtonText>
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/**
 * Button to trigger label print dialog for a single box
 */
type PrintSingleLabelButtonProps = {
  box: LabelBox;
};

export function PrintSingleLabelButton({ box }: PrintSingleLabelButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
        <ButtonText>Print Label</ButtonText>
      </Button>
      <LabelPrintDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        boxes={[box]}
      />
    </>
  );
}
