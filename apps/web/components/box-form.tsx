"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
    <div className="bg-white rounded-lg shadow p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Label */}
        <div>
          <label htmlFor="label" className="block text-sm font-medium text-gray-700">
            Label <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="label"
            required
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="e.g., Kitchen Items"
            maxLength={100}
          />
          <p className="mt-1 text-sm text-gray-500">
            A short name to identify this box
          </p>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="e.g., Pots, pans, and cooking utensils"
            maxLength={500}
          />
          <p className="mt-1 text-sm text-gray-500">
            Optional details about the box contents
          </p>
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">
            Category
          </label>
          <select
            id="category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-sm text-gray-500">
            Helps organize boxes by type of contents
          </p>
        </div>

        {/* Box Type */}
        <div>
          <label htmlFor="boxType" className="block text-sm font-medium text-gray-700">
            Box Type
          </label>
          <select
            id="boxType"
            value={boxTypeId}
            onChange={(e) => setBoxTypeId(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Select a box type</option>
            {boxTypes.map((boxType) => (
              <option key={boxType.id} value={boxType.id}>
                {boxType.name}
                {boxType.description ? ` - ${boxType.description}` : ""}
              </option>
            ))}
          </select>
          <p className="mt-1 text-sm text-gray-500">
            Physical dimensions and type of box
          </p>
        </div>

        {/* Status */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="empty">Empty</option>
            <option value="packing">Packing</option>
            <option value="packed">Packed</option>
            <option value="stored">Stored</option>
            <option value="retrieved">Retrieved</option>
          </select>
          <p className="mt-1 text-sm text-gray-500">
            Current status of the box
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3">
          <Link
            href="/dashboard/boxes"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || !label.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Creating..." : "Create Box"}
          </button>
        </div>
      </form>
    </div>
  );
}
