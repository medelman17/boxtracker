import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth-context";

export type LocationCapacity = {
  location_id: string;
  household_id: string;
  location_name: string;
  location_code: string | null;
  facility_name: string | null;
  color: string | null;
  is_active: boolean;
  is_default: boolean;
  total_pallets: number;
  active_pallets: number;
  total_positions: number;
  occupied_positions: number;
  available_positions: number;
  box_count: number;
  utilization_percent: number;
};

export type UseLocationsResult = {
  data: LocationCapacity[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
};

/**
 * Hook to fetch all locations with capacity stats for the active household
 */
export function useLocations(): UseLocationsResult {
  const { activeHousehold } = useAuth();
  const [data, setData] = useState<LocationCapacity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchLocations = useCallback(async () => {
    if (!activeHousehold?.id) {
      setData([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data: locations, error: fetchError } = await supabase
        .from("v_location_capacity")
        .select("*")
        .eq("household_id", activeHousehold.id)
        .order("display_order", { ascending: true });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      setData(locations || []);
    } catch (e) {
      setError(e as Error);
    } finally {
      setIsLoading(false);
    }
  }, [activeHousehold?.id]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  return { data, isLoading, error, refetch: fetchLocations };
}

export type LocationWithPallets = {
  id: string;
  household_id: string;
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
  icon: string | null;
  is_active: boolean;
  is_default: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  pallets: PalletCapacity[];
};

export type PalletCapacity = {
  id: string;
  code: string;
  name: string | null;
  is_active: boolean;
  total_positions: number;
  occupied_positions: number;
  available_positions: number;
  utilization_percent: number;
};

export type UseLocationResult = {
  data: LocationWithPallets | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
};

/**
 * Hook to fetch a single location with its pallets
 */
export function useLocation(id: string): UseLocationResult {
  const [data, setData] = useState<LocationWithPallets | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchLocation = useCallback(async () => {
    if (!id) {
      setData(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch location
      const { data: location, error: locationError } = await supabase
        .from("locations")
        .select("*")
        .eq("id", id)
        .is("deleted_at", null)
        .single();

      if (locationError) {
        throw new Error(locationError.message);
      }

      // Fetch pallets with capacity
      const { data: pallets, error: palletsError } = await supabase
        .from("v_pallet_capacity")
        .select("*")
        .eq("location_id", id)
        .order("code", { ascending: true });

      if (palletsError) {
        throw new Error(palletsError.message);
      }

      setData({
        ...location,
        pallets: pallets || [],
      });
    } catch (e) {
      setError(e as Error);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  return { data, isLoading, error, refetch: fetchLocation };
}
