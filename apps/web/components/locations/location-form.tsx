"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, ButtonText } from "@/components/ui/button";
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
  Input,
  FormControlHelper,
  FormControlHelperText,
} from "@/components/ui/input";

type LocationFormProps = {
  householdId: string;
  initialData?: {
    id: string;
    name: string;
    code: string | null;
    facility_name: string | null;
    facility_address: string | null;
    width_feet: number | null;
    depth_feet: number | null;
    height_feet: number | null;
    square_feet: number | null;
    access_code: string | null;
    access_hours: string | null;
    notes: string | null;
    color: string | null;
    is_default: boolean;
  };
  mode?: "create" | "edit";
};

const COLOR_OPTIONS = [
  { value: "#6B7280", label: "Gray" },
  { value: "#EF4444", label: "Red" },
  { value: "#F59E0B", label: "Amber" },
  { value: "#10B981", label: "Green" },
  { value: "#3B82F6", label: "Blue" },
  { value: "#8B5CF6", label: "Purple" },
  { value: "#EC4899", label: "Pink" },
  { value: "#06B6D4", label: "Cyan" },
];

export function LocationForm({
  householdId,
  initialData,
  mode = "create",
}: LocationFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState(initialData?.name || "");
  const [code, setCode] = useState(initialData?.code || "");
  const [facilityName, setFacilityName] = useState(initialData?.facility_name || "");
  const [facilityAddress, setFacilityAddress] = useState(
    initialData?.facility_address || ""
  );
  const [widthFeet, setWidthFeet] = useState(
    initialData?.width_feet?.toString() || ""
  );
  const [depthFeet, setDepthFeet] = useState(
    initialData?.depth_feet?.toString() || ""
  );
  const [heightFeet, setHeightFeet] = useState(
    initialData?.height_feet?.toString() || ""
  );
  const [squareFeet, setSquareFeet] = useState(
    initialData?.square_feet?.toString() || ""
  );
  const [accessCode, setAccessCode] = useState(initialData?.access_code || "");
  const [accessHours, setAccessHours] = useState(initialData?.access_hours || "");
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [color, setColor] = useState(initialData?.color || "#6B7280");
  const [isDefault, setIsDefault] = useState(initialData?.is_default || false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const url =
        mode === "create"
          ? "/api/locations"
          : `/api/locations/${initialData?.id}`;

      const method = mode === "create" ? "POST" : "PATCH";

      const body: Record<string, unknown> = {
        name: name.trim(),
        code: code.trim() || null,
        facility_name: facilityName.trim() || null,
        facility_address: facilityAddress.trim() || null,
        width_feet: widthFeet ? parseFloat(widthFeet) : null,
        depth_feet: depthFeet ? parseFloat(depthFeet) : null,
        height_feet: heightFeet ? parseFloat(heightFeet) : null,
        square_feet: squareFeet ? parseFloat(squareFeet) : null,
        access_code: accessCode.trim() || null,
        access_hours: accessHours.trim() || null,
        notes: notes.trim() || null,
        color,
        is_default: isDefault,
      };

      if (mode === "create") {
        body.household_id = householdId;
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Failed to ${mode} location`);
      }

      // Redirect to the location's detail page
      router.push(`/dashboard/locations/${result.data.id}`);
      router.refresh();
    } catch (err) {
      console.error(`Error ${mode}ing location:`, err);
      setError(err instanceof Error ? err.message : `Failed to ${mode} location`);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-background-0 rounded-lg shadow p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info Section */}
        <div>
          <h3 className="text-lg font-medium text-typography-900 mb-4">
            Basic Information
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Name */}
            <FormControl isRequired className="sm:col-span-2">
              <FormControlLabel>
                <FormControlLabelText>Location Name</FormControlLabelText>
              </FormControlLabel>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Unit 142, Garage"
                maxLength={100}
              />
              <FormControlHelper>
                <FormControlHelperText>
                  A descriptive name for this storage location
                </FormControlHelperText>
              </FormControlHelper>
            </FormControl>

            {/* Code */}
            <FormControl>
              <FormControlLabel>
                <FormControlLabelText>Code</FormControlLabelText>
              </FormControlLabel>
              <Input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g., U142"
                maxLength={20}
              />
              <FormControlHelper>
                <FormControlHelperText>
                  Short code for labels
                </FormControlHelperText>
              </FormControlHelper>
            </FormControl>

            {/* Color */}
            <FormControl>
              <FormControlLabel>
                <FormControlLabelText>Color</FormControlLabelText>
              </FormControlLabel>
              <div className="flex gap-2">
                {COLOR_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setColor(option.value)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      color === option.value
                        ? "border-typography-900 scale-110"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: option.value }}
                    title={option.label}
                  />
                ))}
              </div>
            </FormControl>
          </div>
        </div>

        {/* Facility Info Section */}
        <div>
          <h3 className="text-lg font-medium text-typography-900 mb-4">
            Facility Information
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Facility Name */}
            <FormControl className="sm:col-span-2">
              <FormControlLabel>
                <FormControlLabelText>Facility Name</FormControlLabelText>
              </FormControlLabel>
              <Input
                type="text"
                value={facilityName}
                onChange={(e) => setFacilityName(e.target.value)}
                placeholder="e.g., Public Storage - Main St"
                maxLength={200}
              />
            </FormControl>

            {/* Facility Address */}
            <FormControl className="sm:col-span-2">
              <FormControlLabel>
                <FormControlLabelText>Address</FormControlLabelText>
              </FormControlLabel>
              <textarea
                value={facilityAddress}
                onChange={(e) => setFacilityAddress(e.target.value)}
                rows={2}
                className="w-full rounded border border-background-300 bg-background-0 px-3 py-2 text-typography-900 placeholder:text-typography-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                placeholder="Full address of the storage facility"
                maxLength={500}
              />
            </FormControl>

            {/* Access Hours */}
            <FormControl>
              <FormControlLabel>
                <FormControlLabelText>Access Hours</FormControlLabelText>
              </FormControlLabel>
              <Input
                type="text"
                value={accessHours}
                onChange={(e) => setAccessHours(e.target.value)}
                placeholder="e.g., 6am - 10pm daily"
                maxLength={200}
              />
            </FormControl>

            {/* Access Code */}
            <FormControl>
              <FormControlLabel>
                <FormControlLabelText>Access Code</FormControlLabelText>
              </FormControlLabel>
              <Input
                type="text"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder="Gate or unit code"
                maxLength={100}
              />
            </FormControl>
          </div>
        </div>

        {/* Dimensions Section */}
        <div>
          <h3 className="text-lg font-medium text-typography-900 mb-4">
            Dimensions (Optional)
          </h3>
          <div className="grid gap-4 sm:grid-cols-4">
            <FormControl>
              <FormControlLabel>
                <FormControlLabelText>Width (ft)</FormControlLabelText>
              </FormControlLabel>
              <Input
                type="number"
                value={widthFeet}
                onChange={(e) => setWidthFeet(e.target.value)}
                placeholder="10"
                min="0"
                step="0.5"
              />
            </FormControl>

            <FormControl>
              <FormControlLabel>
                <FormControlLabelText>Depth (ft)</FormControlLabelText>
              </FormControlLabel>
              <Input
                type="number"
                value={depthFeet}
                onChange={(e) => setDepthFeet(e.target.value)}
                placeholder="20"
                min="0"
                step="0.5"
              />
            </FormControl>

            <FormControl>
              <FormControlLabel>
                <FormControlLabelText>Height (ft)</FormControlLabelText>
              </FormControlLabel>
              <Input
                type="number"
                value={heightFeet}
                onChange={(e) => setHeightFeet(e.target.value)}
                placeholder="10"
                min="0"
                step="0.5"
              />
            </FormControl>

            <FormControl>
              <FormControlLabel>
                <FormControlLabelText>Sq Ft</FormControlLabelText>
              </FormControlLabel>
              <Input
                type="number"
                value={squareFeet}
                onChange={(e) => setSquareFeet(e.target.value)}
                placeholder="200"
                min="0"
                step="1"
              />
            </FormControl>
          </div>
        </div>

        {/* Notes Section */}
        <div>
          <FormControl>
            <FormControlLabel>
              <FormControlLabelText>Notes</FormControlLabelText>
            </FormControlLabel>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded border border-background-300 bg-background-0 px-3 py-2 text-typography-900 placeholder:text-typography-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              placeholder="Additional notes about this location..."
              maxLength={2000}
            />
          </FormControl>
        </div>

        {/* Default Checkbox */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_default"
            checked={isDefault}
            onChange={(e) => setIsDefault(e.target.checked)}
            className="h-4 w-4 rounded border-background-300 text-primary-600 focus:ring-primary-500"
          />
          <label htmlFor="is_default" className="text-sm text-typography-700">
            Set as default location for new pallets
          </label>
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-md bg-error-50 p-4">
            <p className="text-sm text-error-600">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link href="/dashboard/locations">
            <Button action="secondary" variant="outline">
              <ButtonText>Cancel</ButtonText>
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={isSubmitting || !name.trim()}
            isLoading={isSubmitting}
          >
            <ButtonText>
              {isSubmitting
                ? mode === "create"
                  ? "Creating..."
                  : "Saving..."
                : mode === "create"
                  ? "Create Location"
                  : "Save Changes"}
            </ButtonText>
          </Button>
        </div>
      </form>
    </div>
  );
}
