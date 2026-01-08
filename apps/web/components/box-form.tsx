"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
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
  const [status, setStatus] = useState<"stored" | "in_transit" | "delivered" | "archived">("stored");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const supabase = createClient();

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("You must be logged in to create a box");
      }

      // Create box
      const { data: box, error: insertError } = await supabase
        .from("boxes")
        .insert({
          household_id: householdId,
          label: label.trim(),
          description: description.trim() || null,
          category_id: categoryId || null,
          box_type_id: boxTypeId || null,
          status,
          created_by: user.id,
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(insertError.message);
      }

      if (!box) {
        throw new Error("No box data returned from insert");
      }

      // Redirect to the new box's detail page
      router.push(`/dashboard/boxes/${box.id}`);
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
            <option value="stored">Stored</option>
            <option value="in_transit">In Transit</option>
            <option value="delivered">Delivered</option>
            <option value="archived">Archived</option>
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
