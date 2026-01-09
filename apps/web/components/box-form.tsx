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

type Category = {
  id: string;
  name: string;
};

type BoxType = {
  id: string;
  name: string;
  description: string | null;
};

type BoxFormProps = {
  householdId: string;
  categories: Category[];
  boxTypes: BoxType[];
};

export function BoxForm({ householdId, categories, boxTypes }: BoxFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [boxTypeId, setBoxTypeId] = useState("");
  const [status, setStatus] = useState<"empty" | "packing" | "packed" | "stored" | "retrieved">("empty");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/boxes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          household_id: householdId,
          label: label.trim(),
          description: description.trim() || null,
          category_id: categoryId || null,
          box_type_id: boxTypeId || null,
          status,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create box");
      }

      // Redirect to the new box's detail page
      router.push(`/dashboard/boxes/${result.data.id}`);
      router.refresh();
    } catch (err) {
      console.error("Error creating box:", err);
      setError(err instanceof Error ? err.message : "Failed to create box");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-background-0 rounded-lg shadow p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Label */}
        <FormControl isRequired>
          <FormControlLabel>
            <FormControlLabelText>Label</FormControlLabelText>
          </FormControlLabel>
          <Input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g., Kitchen Items"
            maxLength={100}
          />
          <FormControlHelper>
            <FormControlHelperText>A short name to identify this box</FormControlHelperText>
          </FormControlHelper>
        </FormControl>

        {/* Description */}
        <FormControl>
          <FormControlLabel>
            <FormControlLabelText>Description</FormControlLabelText>
          </FormControlLabel>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded border border-background-300 bg-background-0 px-3 py-2 text-typography-900 placeholder:text-typography-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            placeholder="e.g., Pots, pans, and cooking utensils"
            maxLength={500}
          />
          <FormControlHelper>
            <FormControlHelperText>Optional details about the box contents</FormControlHelperText>
          </FormControlHelper>
        </FormControl>

        {/* Category */}
        <FormControl>
          <FormControlLabel>
            <FormControlLabelText>Category</FormControlLabelText>
          </FormControlLabel>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full h-10 rounded border border-background-300 bg-background-0 px-3 text-typography-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
          >
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <FormControlHelper>
            <FormControlHelperText>Helps organize boxes by type of contents</FormControlHelperText>
          </FormControlHelper>
        </FormControl>

        {/* Box Type */}
        <FormControl>
          <FormControlLabel>
            <FormControlLabelText>Box Type</FormControlLabelText>
          </FormControlLabel>
          <select
            value={boxTypeId}
            onChange={(e) => setBoxTypeId(e.target.value)}
            className="w-full h-10 rounded border border-background-300 bg-background-0 px-3 text-typography-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
          >
            <option value="">Select a box type</option>
            {boxTypes.map((boxType) => (
              <option key={boxType.id} value={boxType.id}>
                {boxType.name}
                {boxType.description ? ` - ${boxType.description}` : ""}
              </option>
            ))}
          </select>
          <FormControlHelper>
            <FormControlHelperText>Physical dimensions and type of box</FormControlHelperText>
          </FormControlHelper>
        </FormControl>

        {/* Status */}
        <FormControl>
          <FormControlLabel>
            <FormControlLabelText>Status</FormControlLabelText>
          </FormControlLabel>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
            className="w-full h-10 rounded border border-background-300 bg-background-0 px-3 text-typography-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
          >
            <option value="empty">Empty</option>
            <option value="packing">Packing</option>
            <option value="packed">Packed</option>
            <option value="stored">Stored</option>
            <option value="retrieved">Retrieved</option>
          </select>
          <FormControlHelper>
            <FormControlHelperText>Current status of the box</FormControlHelperText>
          </FormControlHelper>
        </FormControl>

        {/* Error Message */}
        {error && (
          <div className="rounded-md bg-error-0 p-4">
            <p className="text-sm text-error-500">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link href="/dashboard/boxes">
            <Button action="secondary" variant="outline">
              <ButtonText>Cancel</ButtonText>
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={isSubmitting || !label.trim()}
            isLoading={isSubmitting}
          >
            <ButtonText>{isSubmitting ? "Creating..." : "Create Box"}</ButtonText>
          </Button>
        </div>
      </form>
    </div>
  );
}
