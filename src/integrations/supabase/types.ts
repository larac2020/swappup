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
  public: {
    Tables: {
      cart_items: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          quantity: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          quantity?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          quantity?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      data_consent: {
        Row: {
          consent_analytics: boolean
          consent_marketing: boolean
          consent_personalisation: boolean
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          consent_analytics?: boolean
          consent_marketing?: boolean
          consent_personalisation?: boolean
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          consent_analytics?: boolean
          consent_marketing?: boolean
          consent_personalisation?: boolean
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_views: {
        Row: {
          id: string
          listing_id: string
          viewed_at: string
          viewer_id: string
        }
        Insert: {
          id?: string
          listing_id: string
          viewed_at?: string
          viewer_id: string
        }
        Update: {
          id?: string
          listing_id?: string
          viewed_at?: string
          viewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_views_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_views_viewer_id_fkey"
            columns: ["viewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          additional_notes: string | null
          airline: string
          bumped_until: string | null
          carry_on_included: boolean | null
          created_at: string
          departure_date: string
          destination_city: string
          destination_country: string
          destination_image_url: string | null
          flight_number: string | null
          id: string
          is_active: boolean | null
          luggage_included: boolean | null
          meal_included: boolean | null
          name_change_fee: number | null
          origin_city: string
          origin_country: string
          original_price: number | null
          per_ticket_inclusions: Json | null
          price: number
          return_date: string | null
          seller_id: string
          speedy_boarding: boolean | null
          stopovers: number | null
          tags: Database["public"]["Enums"]["listing_tag"][] | null
          ticket_count: number
          title: string
          updated_at: string
        }
        Insert: {
          additional_notes?: string | null
          airline: string
          bumped_until?: string | null
          carry_on_included?: boolean | null
          created_at?: string
          departure_date: string
          destination_city: string
          destination_country: string
          destination_image_url?: string | null
          flight_number?: string | null
          id?: string
          is_active?: boolean | null
          luggage_included?: boolean | null
          meal_included?: boolean | null
          name_change_fee?: number | null
          origin_city: string
          origin_country: string
          original_price?: number | null
          per_ticket_inclusions?: Json | null
          price: number
          return_date?: string | null
          seller_id: string
          speedy_boarding?: boolean | null
          stopovers?: number | null
          tags?: Database["public"]["Enums"]["listing_tag"][] | null
          ticket_count?: number
          title: string
          updated_at?: string
        }
        Update: {
          additional_notes?: string | null
          airline?: string
          bumped_until?: string | null
          carry_on_included?: boolean | null
          created_at?: string
          departure_date?: string
          destination_city?: string
          destination_country?: string
          destination_image_url?: string | null
          flight_number?: string | null
          id?: string
          is_active?: boolean | null
          luggage_included?: boolean | null
          meal_included?: boolean | null
          name_change_fee?: number | null
          origin_city?: string
          origin_country?: string
          original_price?: number | null
          per_ticket_inclusions?: Json | null
          price?: number
          return_date?: string | null
          seller_id?: string
          speedy_boarding?: boolean | null
          stopovers?: number | null
          tags?: Database["public"]["Enums"]["listing_tag"][] | null
          ticket_count?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "listings_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          listing_id: string | null
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id?: string | null
          message: string
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string | null
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          avatar_url: string | null
          city: string | null
          country: string | null
          created_at: string
          default_pax: number | null
          email: string
          favorite_categories: string[] | null
          favorite_departure_city: string | null
          favorite_departure_country: string | null
          full_name: string | null
          id: string
          id_document_url: string | null
          phone: string | null
          postal_code: string | null
          transactions_bought: number | null
          transactions_sold: number | null
          updated_at: string
          user_id: string
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          default_pax?: number | null
          email: string
          favorite_categories?: string[] | null
          favorite_departure_city?: string | null
          favorite_departure_country?: string | null
          full_name?: string | null
          id?: string
          id_document_url?: string | null
          phone?: string | null
          postal_code?: string | null
          transactions_bought?: number | null
          transactions_sold?: number | null
          updated_at?: string
          user_id: string
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          default_pax?: number | null
          email?: string
          favorite_categories?: string[] | null
          favorite_departure_city?: string | null
          favorite_departure_country?: string | null
          full_name?: string | null
          id?: string
          id_document_url?: string | null
          phone?: string | null
          postal_code?: string | null
          transactions_bought?: number | null
          transactions_sold?: number | null
          updated_at?: string
          user_id?: string
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Relationships: []
      }
      purchases: {
        Row: {
          buyer_id: string | null
          created_at: string
          id: string
          listing_id: string | null
          quantity: number
          seller_id: string | null
          status: string
          stripe_payment_id: string | null
          total_price: number
        }
        Insert: {
          buyer_id?: string | null
          created_at?: string
          id?: string
          listing_id?: string | null
          quantity: number
          seller_id?: string | null
          status?: string
          stripe_payment_id?: string | null
          total_price: number
        }
        Update: {
          buyer_id?: string | null
          created_at?: string
          id?: string
          listing_id?: string | null
          quantity?: number
          seller_id?: string | null
          status?: string
          stripe_payment_id?: string | null
          total_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchases_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      search_history: {
        Row: {
          destination_city: string | null
          destination_country: string | null
          id: string
          searched_at: string
          user_id: string
        }
        Insert: {
          destination_city?: string | null
          destination_country?: string | null
          id?: string
          searched_at?: string
          user_id: string
        }
        Update: {
          destination_city?: string | null
          destination_country?: string | null
          id?: string
          searched_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "search_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      listing_tag:
        | "city_trip"
        | "beach"
        | "winter_holiday"
        | "ski_trip"
        | "adventure"
        | "romantic"
        | "family"
        | "business"
      verification_status: "pending" | "verified" | "rejected"
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
  public: {
    Enums: {
      listing_tag: [
        "city_trip",
        "beach",
        "winter_holiday",
        "ski_trip",
        "adventure",
        "romantic",
        "family",
        "business",
      ],
      verification_status: ["pending", "verified", "rejected"],
    },
  },
} as const
