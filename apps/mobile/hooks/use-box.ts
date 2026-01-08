import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import type { Database } from "@boxtrack/shared/database.types";

// Type alias for box with all related data
type BoxRow = Database["public"]["Tables"]["boxes"]["Row"];
type PhotoRow = Database["public"]["Tables"]["photos"]["Row"];
type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];
type BoxTypeRow = Database["public"]["Tables"]["box_types"]["Row"];

export type BoxWithDetails = BoxRow & {
  photos: PhotoRow[];
  category: CategoryRow | null;
  box_type: BoxTypeRow | null;
};

export type UseBoxResult = {
  data: BoxWithDetails | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
};

/**
 * Hook to fetch box details with related data (photos, category, box_type)
 *
 * @param id - Box ID to fetch
 * @returns Box data with loading and error states, plus refetch function
 *
 * @example
 * ```tsx
 * function BoxDetailScreen() {
 *   const { id } = useLocalSearchParams<{ id: string }>();
 *   const { data: box, isLoading, error, refetch } = useBox(id);
 *
 *   if (isLoading) return <LoadingView />;
 *   if (error) return <ErrorView error={error} onRetry={refetch} />;
 *   if (!box) return <NotFoundView />;
 *
 *   return <BoxDetails box={box} />;
 * }
 * ```
 */
export function useBox(id: string): UseBoxResult {
  const [data, setData] = useState<BoxWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchBox = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: box, error: fetchError } = await supabase
        .from("boxes")
        .select(
          `
          *,
          box_types (*),
          categories (*),
          photos (*)
        `
        )
        .eq("id", id)
        .single();

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      setData(box);
    } catch (e) {
      setError(e as Error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchBox();
    }
  }, [id]);

  return { data, isLoading, error, refetch: fetchBox };
}
