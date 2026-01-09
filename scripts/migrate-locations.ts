/**
 * Location Migration Script
 *
 * This script migrates existing data to use the new locations feature:
 * 1. Creates a default "Primary Storage" location for each household
 * 2. Links all existing pallets to their household's default location
 * 3. Optionally creates separate locations from warehouse_zone values
 *
 * Usage:
 *   pnpm tsx scripts/migrate-locations.ts
 *
 * Environment:
 *   SUPABASE_URL - Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY - Service role key for admin access
 *
 * Note: This script requires service role key to bypass RLS.
 *       The SQL migration (008_migrate_existing_pallets_to_locations.sql)
 *       can also be used if running via Supabase migrations.
 */

import { createClient } from "@supabase/supabase-js";

// Load environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required"
  );
  process.exit(1);
}

// Create admin client with service role key to bypass RLS
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

interface Household {
  id: string;
  name: string;
}

interface Location {
  id: string;
  household_id: string;
  name: string;
  is_default: boolean;
}

interface Pallet {
  id: string;
  household_id: string;
  warehouse_zone: string | null;
  location_id: string | null;
}

async function migrateLocations(): Promise<void> {
  console.log("Starting location migration...\n");

  // Step 1: Get all households
  console.log("Step 1: Fetching households...");
  const { data: households, error: householdsError } = await supabase
    .from("households")
    .select("id, name");

  if (householdsError) {
    throw new Error(`Failed to fetch households: ${householdsError.message}`);
  }

  console.log(`  Found ${households?.length || 0} households\n`);

  let createdLocations = 0;
  let updatedPallets = 0;
  let warehouseZoneLocations = 0;

  for (const household of households as Household[]) {
    console.log(`Processing household: ${household.name} (${household.id})`);

    // Step 2: Check if household has a default location
    const { data: existingLocations, error: locationsError } = await supabase
      .from("locations")
      .select("id, name, is_default")
      .eq("household_id", household.id)
      .is("deleted_at", null);

    if (locationsError) {
      console.error(
        `  Warning: Failed to check locations for household ${household.id}: ${locationsError.message}`
      );
      continue;
    }

    let defaultLocation = (existingLocations as Location[])?.find(
      (l) => l.is_default
    );

    // Step 3: Create default location if none exists
    if (!defaultLocation) {
      console.log("  Creating default location...");
      const { data: newLocation, error: createError } = await supabase
        .from("locations")
        .insert({
          household_id: household.id,
          name: "Primary Storage",
          code: "PRIMARY",
          is_default: true,
          is_active: true,
          display_order: 0,
          notes:
            "Auto-created during migration. Edit to customize your storage location.",
        })
        .select()
        .single();

      if (createError) {
        console.error(
          `  Warning: Failed to create location: ${createError.message}`
        );
        continue;
      }

      defaultLocation = newLocation as Location;
      createdLocations++;
      console.log(`  Created location: ${defaultLocation.name}`);
    } else {
      console.log(`  Default location already exists: ${defaultLocation.name}`);
    }

    // Step 4: Get pallets without location
    const { data: pallets, error: palletsError } = await supabase
      .from("pallets")
      .select("id, household_id, warehouse_zone, location_id")
      .eq("household_id", household.id)
      .is("location_id", null)
      .is("deleted_at", null);

    if (palletsError) {
      console.error(
        `  Warning: Failed to fetch pallets: ${palletsError.message}`
      );
      continue;
    }

    console.log(`  Found ${pallets?.length || 0} pallets without location`);

    // Step 5: Group pallets by warehouse_zone for optional migration
    const palletsWithZone = (pallets as Pallet[] | null)?.filter(
      (p) =>
        p.warehouse_zone &&
        p.warehouse_zone.trim() !== "" &&
        p.warehouse_zone !== "PRIMARY"
    );
    const palletsWithoutZone = (pallets as Pallet[] | null)?.filter(
      (p) =>
        !p.warehouse_zone ||
        p.warehouse_zone.trim() === "" ||
        p.warehouse_zone === "PRIMARY"
    );

    // Step 6: Create locations from distinct warehouse_zone values
    const distinctZones = [
      ...new Set(palletsWithZone?.map((p) => p.warehouse_zone)),
    ];

    for (const zone of distinctZones) {
      if (!zone) continue;

      // Check if location with this name already exists
      const existingZoneLocation = (existingLocations as Location[])?.find(
        (l) => l.name.toLowerCase() === zone.toLowerCase()
      );

      if (!existingZoneLocation) {
        console.log(`  Creating location from warehouse_zone: ${zone}`);

        const code = zone
          .replace(/[^a-zA-Z0-9]/g, "")
          .toUpperCase()
          .substring(0, 10);

        const { data: zoneLocation, error: zoneError } = await supabase
          .from("locations")
          .insert({
            household_id: household.id,
            name: zone,
            code: code || "ZONE",
            is_default: false,
            is_active: true,
            display_order: 1,
            notes: "Migrated from warehouse_zone field",
          })
          .select()
          .single();

        if (zoneError) {
          console.error(
            `    Warning: Failed to create zone location: ${zoneError.message}`
          );
        } else {
          warehouseZoneLocations++;

          // Update pallets with this zone to use the new location
          const zonePalletIds =
            palletsWithZone
              ?.filter((p) => p.warehouse_zone === zone)
              .map((p) => p.id) || [];

          if (zonePalletIds.length > 0) {
            const { error: updateZoneError } = await supabase
              .from("pallets")
              .update({ location_id: (zoneLocation as Location).id })
              .in("id", zonePalletIds);

            if (updateZoneError) {
              console.error(
                `    Warning: Failed to update pallets for zone: ${updateZoneError.message}`
              );
            } else {
              updatedPallets += zonePalletIds.length;
              console.log(
                `    Linked ${zonePalletIds.length} pallets to ${zone}`
              );
            }
          }
        }
      }
    }

    // Step 7: Link remaining pallets (without zone) to default location
    if (palletsWithoutZone && palletsWithoutZone.length > 0) {
      const palletIds = palletsWithoutZone.map((p) => p.id);

      const { error: updateError } = await supabase
        .from("pallets")
        .update({ location_id: defaultLocation.id })
        .in("id", palletIds);

      if (updateError) {
        console.error(
          `  Warning: Failed to update pallets: ${updateError.message}`
        );
      } else {
        updatedPallets += palletIds.length;
        console.log(
          `  Linked ${palletIds.length} pallets to ${defaultLocation.name}`
        );
      }
    }

    console.log("");
  }

  // Summary
  console.log("=".repeat(50));
  console.log("Migration Summary");
  console.log("=".repeat(50));
  console.log(`Households processed: ${households?.length || 0}`);
  console.log(`Default locations created: ${createdLocations}`);
  console.log(`Warehouse zone locations created: ${warehouseZoneLocations}`);
  console.log(`Pallets updated: ${updatedPallets}`);
  console.log("\nMigration complete!");
}

// Run the migration
migrateLocations()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("\nMigration failed:", error);
    process.exit(1);
  });
