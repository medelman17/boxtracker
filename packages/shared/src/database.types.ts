export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      box_types: {
        Row: {
          code: string | null
          color: string | null
          created_at: string
          description: string | null
          display_order: number
          height: number | null
          household_id: string | null
          icon: string | null
          id: string
          is_active: boolean
          is_default: boolean
          length: number | null
          name: string
          updated_at: string
          volume_cubic_ft: number | null
          weight_limit_lbs: number | null
          width: number | null
        }
        Insert: {
          code?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          height?: number | null
          household_id?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          length?: number | null
          name: string
          updated_at?: string
          volume_cubic_ft?: number | null
          weight_limit_lbs?: number | null
          width?: number | null
        }
        Update: {
          code?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          height?: number | null
          household_id?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          length?: number | null
          name?: string
          updated_at?: string
          volume_cubic_ft?: number | null
          weight_limit_lbs?: number | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "box_types_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "box_types_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "v_available_positions"
            referencedColumns: ["household_id"]
          },
        ]
      }
      boxes: {
        Row: {
          actual_weight_lbs: number | null
          assigned_to: string | null
          box_type_id: string | null
          category_id: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          household_id: string
          id: string
          label: string
          packed_at: string | null
          photo_count: number
          position_id: string | null
          qr_code: string | null
          retrieved_at: string | null
          status: Database["public"]["Enums"]["box_status"]
          stored_at: string | null
          updated_at: string
        }
        Insert: {
          actual_weight_lbs?: number | null
          assigned_to?: string | null
          box_type_id?: string | null
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          household_id: string
          id?: string
          label: string
          packed_at?: string | null
          photo_count?: number
          position_id?: string | null
          qr_code?: string | null
          retrieved_at?: string | null
          status?: Database["public"]["Enums"]["box_status"]
          stored_at?: string | null
          updated_at?: string
        }
        Update: {
          actual_weight_lbs?: number | null
          assigned_to?: string | null
          box_type_id?: string | null
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          household_id?: string
          id?: string
          label?: string
          packed_at?: string | null
          photo_count?: number
          position_id?: string | null
          qr_code?: string | null
          retrieved_at?: string | null
          status?: Database["public"]["Enums"]["box_status"]
          stored_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "boxes_box_type_id_fkey"
            columns: ["box_type_id"]
            isOneToOne: false
            referencedRelation: "box_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boxes_box_type_id_fkey"
            columns: ["box_type_id"]
            isOneToOne: false
            referencedRelation: "v_available_positions"
            referencedColumns: ["max_box_type_id"]
          },
          {
            foreignKeyName: "boxes_box_type_id_fkey"
            columns: ["box_type_id"]
            isOneToOne: false
            referencedRelation: "v_boxes_with_location"
            referencedColumns: ["box_type_id"]
          },
          {
            foreignKeyName: "boxes_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boxes_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "v_boxes_with_location"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "boxes_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boxes_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "v_available_positions"
            referencedColumns: ["household_id"]
          },
          {
            foreignKeyName: "boxes_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "row_positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boxes_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "v_available_positions"
            referencedColumns: ["position_id"]
          },
          {
            foreignKeyName: "boxes_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "v_boxes_with_location"
            referencedColumns: ["position_id_full"]
          },
        ]
      }
      categories: {
        Row: {
          color: string
          created_at: string
          display_order: number
          household_id: string | null
          icon: string | null
          id: string
          is_default: boolean
          name: string
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          display_order?: number
          household_id?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          display_order?: number
          household_id?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "v_available_positions"
            referencedColumns: ["household_id"]
          },
        ]
      }
      households: {
        Row: {
          created_at: string
          default_box_type_id: string | null
          id: string
          name: string
          slug: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_box_type_id?: string | null
          id?: string
          name: string
          slug?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_box_type_id?: string | null
          id?: string
          name?: string
          slug?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "households_default_box_type_fk"
            columns: ["default_box_type_id"]
            isOneToOne: false
            referencedRelation: "box_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "households_default_box_type_fk"
            columns: ["default_box_type_id"]
            isOneToOne: false
            referencedRelation: "v_available_positions"
            referencedColumns: ["max_box_type_id"]
          },
          {
            foreignKeyName: "households_default_box_type_fk"
            columns: ["default_box_type_id"]
            isOneToOne: false
            referencedRelation: "v_boxes_with_location"
            referencedColumns: ["box_type_id"]
          },
        ]
      }
      pallet_rows: {
        Row: {
          created_at: string
          height_from_ground_inches: number | null
          id: string
          is_active: boolean
          label: string | null
          max_positions: number
          notes: string | null
          pallet_id: string
          row_number: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          height_from_ground_inches?: number | null
          id?: string
          is_active?: boolean
          label?: string | null
          max_positions?: number
          notes?: string | null
          pallet_id: string
          row_number: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          height_from_ground_inches?: number | null
          id?: string
          is_active?: boolean
          label?: string | null
          max_positions?: number
          notes?: string | null
          pallet_id?: string
          row_number?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pallet_rows_pallet_id_fkey"
            columns: ["pallet_id"]
            isOneToOne: false
            referencedRelation: "pallets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pallet_rows_pallet_id_fkey"
            columns: ["pallet_id"]
            isOneToOne: false
            referencedRelation: "v_available_positions"
            referencedColumns: ["pallet_id"]
          },
          {
            foreignKeyName: "pallet_rows_pallet_id_fkey"
            columns: ["pallet_id"]
            isOneToOne: false
            referencedRelation: "v_boxes_with_location"
            referencedColumns: ["pallet_id"]
          },
          {
            foreignKeyName: "pallet_rows_pallet_id_fkey"
            columns: ["pallet_id"]
            isOneToOne: false
            referencedRelation: "v_pallet_capacity"
            referencedColumns: ["pallet_id"]
          },
        ]
      }
      pallets: {
        Row: {
          code: string
          color: string | null
          created_at: string
          default_positions_per_row: number
          deleted_at: string | null
          description: string | null
          display_order: number
          household_id: string
          id: string
          is_active: boolean
          location_description: string | null
          max_rows: number
          name: string | null
          updated_at: string
          warehouse_zone: string | null
        }
        Insert: {
          code: string
          color?: string | null
          created_at?: string
          default_positions_per_row?: number
          deleted_at?: string | null
          description?: string | null
          display_order?: number
          household_id: string
          id?: string
          is_active?: boolean
          location_description?: string | null
          max_rows?: number
          name?: string | null
          updated_at?: string
          warehouse_zone?: string | null
        }
        Update: {
          code?: string
          color?: string | null
          created_at?: string
          default_positions_per_row?: number
          deleted_at?: string | null
          description?: string | null
          display_order?: number
          household_id?: string
          id?: string
          is_active?: boolean
          location_description?: string | null
          max_rows?: number
          name?: string | null
          updated_at?: string
          warehouse_zone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pallets_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pallets_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "v_available_positions"
            referencedColumns: ["household_id"]
          },
        ]
      }
      photos: {
        Row: {
          box_id: string
          caption: string | null
          created_at: string
          deleted_at: string | null
          display_order: number
          file_size: number | null
          height: number | null
          id: string
          mime_type: string | null
          storage_path: string
          thumbnail_url: string | null
          uploaded_by: string | null
          url: string | null
          width: number | null
        }
        Insert: {
          box_id: string
          caption?: string | null
          created_at?: string
          deleted_at?: string | null
          display_order?: number
          file_size?: number | null
          height?: number | null
          id?: string
          mime_type?: string | null
          storage_path: string
          thumbnail_url?: string | null
          uploaded_by?: string | null
          url?: string | null
          width?: number | null
        }
        Update: {
          box_id?: string
          caption?: string | null
          created_at?: string
          deleted_at?: string | null
          display_order?: number
          file_size?: number | null
          height?: number | null
          id?: string
          mime_type?: string | null
          storage_path?: string
          thumbnail_url?: string | null
          uploaded_by?: string | null
          url?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "photos_box_id_fkey"
            columns: ["box_id"]
            isOneToOne: false
            referencedRelation: "boxes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photos_box_id_fkey"
            columns: ["box_id"]
            isOneToOne: false
            referencedRelation: "v_boxes_with_location"
            referencedColumns: ["id"]
          },
        ]
      }
      row_positions: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          is_occupied: boolean
          is_reserved: boolean
          label: string | null
          max_box_type_id: string | null
          notes: string | null
          position_number: number
          reserved_for: string | null
          row_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_occupied?: boolean
          is_reserved?: boolean
          label?: string | null
          max_box_type_id?: string | null
          notes?: string | null
          position_number: number
          reserved_for?: string | null
          row_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_occupied?: boolean
          is_reserved?: boolean
          label?: string | null
          max_box_type_id?: string | null
          notes?: string | null
          position_number?: number
          reserved_for?: string | null
          row_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "row_positions_max_box_type_id_fkey"
            columns: ["max_box_type_id"]
            isOneToOne: false
            referencedRelation: "box_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "row_positions_max_box_type_id_fkey"
            columns: ["max_box_type_id"]
            isOneToOne: false
            referencedRelation: "v_available_positions"
            referencedColumns: ["max_box_type_id"]
          },
          {
            foreignKeyName: "row_positions_max_box_type_id_fkey"
            columns: ["max_box_type_id"]
            isOneToOne: false
            referencedRelation: "v_boxes_with_location"
            referencedColumns: ["box_type_id"]
          },
          {
            foreignKeyName: "row_positions_row_id_fkey"
            columns: ["row_id"]
            isOneToOne: false
            referencedRelation: "pallet_rows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "row_positions_row_id_fkey"
            columns: ["row_id"]
            isOneToOne: false
            referencedRelation: "v_available_positions"
            referencedColumns: ["row_id"]
          },
          {
            foreignKeyName: "row_positions_row_id_fkey"
            columns: ["row_id"]
            isOneToOne: false
            referencedRelation: "v_boxes_with_location"
            referencedColumns: ["row_id"]
          },
        ]
      }
      user_households: {
        Row: {
          created_at: string
          household_id: string
          id: string
          invited_at: string | null
          invited_by: string | null
          joined_at: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          household_id: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          household_id?: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_households_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_households_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "v_available_positions"
            referencedColumns: ["household_id"]
          },
        ]
      }
    }
    Views: {
      v_available_positions: {
        Row: {
          full_location: string | null
          household_id: string | null
          household_name: string | null
          is_reserved: boolean | null
          max_box_type: string | null
          max_box_type_id: string | null
          notes: string | null
          pallet_code: string | null
          pallet_id: string | null
          pallet_name: string | null
          position_id: string | null
          position_number: number | null
          reserved_for: string | null
          row_id: string | null
          row_number: number | null
          warehouse_zone: string | null
        }
        Relationships: []
      }
      v_boxes_with_location: {
        Row: {
          actual_weight_lbs: number | null
          assigned_to: string | null
          box_type_code: string | null
          box_type_id: string | null
          box_type_name: string | null
          category_color: string | null
          category_icon: string | null
          category_id: string | null
          category_name: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          height: number | null
          household_id: string | null
          id: string | null
          label: string | null
          length: number | null
          location: string | null
          packed_at: string | null
          pallet_code: string | null
          pallet_id: string | null
          pallet_name: string | null
          photo_count: number | null
          position_id: string | null
          position_id_full: string | null
          position_number: number | null
          qr_code: string | null
          retrieved_at: string | null
          row_id: string | null
          row_number: number | null
          status: Database["public"]["Enums"]["box_status"] | null
          stored_at: string | null
          updated_at: string | null
          warehouse_zone: string | null
          weight_limit_lbs: number | null
          width: number | null
        }
        Relationships: [
          {
            foreignKeyName: "boxes_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boxes_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "v_available_positions"
            referencedColumns: ["household_id"]
          },
          {
            foreignKeyName: "boxes_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "row_positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boxes_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "v_available_positions"
            referencedColumns: ["position_id"]
          },
          {
            foreignKeyName: "boxes_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "v_boxes_with_location"
            referencedColumns: ["position_id_full"]
          },
        ]
      }
      v_pallet_capacity: {
        Row: {
          available_positions: number | null
          code: string | null
          household_id: string | null
          name: string | null
          occupied_positions: number | null
          pallet_id: string | null
          reserved_positions: number | null
          total_positions: number | null
          total_rows: number | null
          utilization_percent: number | null
          warehouse_zone: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pallets_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pallets_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "v_available_positions"
            referencedColumns: ["household_id"]
          },
        ]
      }
    }
    Functions: {
      generate_box_label: {
        Args: { p_household_id: string; p_prefix?: string }
        Returns: string
      }
    }
    Enums: {
      box_status: "empty" | "packing" | "packed" | "stored" | "retrieved"
      user_role: "owner" | "admin" | "member" | "viewer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      box_status: ["empty", "packing", "packed", "stored", "retrieved"],
      user_role: ["owner", "admin", "member", "viewer"],
    },
  },
} as const
