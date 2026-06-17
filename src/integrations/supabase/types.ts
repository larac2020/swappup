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
      airline_change_fee_history: {
        Row: {
          accepted: boolean
          airline_code: string
          confidence: string | null
          id: string
          new_currency: string | null
          new_fee: number | null
          new_is_transferable: boolean | null
          notes: string | null
          previous_currency: string | null
          previous_fee: number | null
          previous_is_transferable: boolean | null
          rejection_reason: string | null
          route_type: string
          run_at: string
          source_url: string | null
        }
        Insert: {
          accepted?: boolean
          airline_code: string
          confidence?: string | null
          id?: string
          new_currency?: string | null
          new_fee?: number | null
          new_is_transferable?: boolean | null
          notes?: string | null
          previous_currency?: string | null
          previous_fee?: number | null
          previous_is_transferable?: boolean | null
          rejection_reason?: string | null
          route_type?: string
          run_at?: string
          source_url?: string | null
        }
        Update: {
          accepted?: boolean
          airline_code?: string
          confidence?: string | null
          id?: string
          new_currency?: string | null
          new_fee?: number | null
          new_is_transferable?: boolean | null
          notes?: string | null
          previous_currency?: string | null
          previous_fee?: number | null
          previous_is_transferable?: boolean | null
          rejection_reason?: string | null
          route_type?: string
          run_at?: string
          source_url?: string | null
        }
        Relationships: []
      }
      airline_change_fees: {
        Row: {
          airline_code: string
          airline_name: string
          confidence: string
          created_at: string
          currency: string
          fee_amount: number
          fee_max: number | null
          id: string
          is_transferable: boolean
          last_verified_at: string
          notes: string | null
          route_type: string
          source_url: string | null
          updated_at: string
        }
        Insert: {
          airline_code: string
          airline_name: string
          confidence?: string
          created_at?: string
          currency?: string
          fee_amount?: number
          fee_max?: number | null
          id?: string
          is_transferable?: boolean
          last_verified_at?: string
          notes?: string | null
          route_type?: string
          source_url?: string | null
          updated_at?: string
        }
        Update: {
          airline_code?: string
          airline_name?: string
          confidence?: string
          created_at?: string
          currency?: string
          fee_amount?: number
          fee_max?: number | null
          id?: string
          is_transferable?: boolean
          last_verified_at?: string
          notes?: string | null
          route_type?: string
          source_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      airline_fee_review_queue: {
        Row: {
          airline_code: string
          airline_name: string | null
          confidence: string | null
          created_at: string
          current_currency: string | null
          current_fee: number | null
          current_is_transferable: boolean | null
          id: string
          notes: string | null
          proposed_currency: string | null
          proposed_fee: number
          proposed_is_transferable: boolean | null
          reason: string
          reviewed_at: string | null
          reviewer_notes: string | null
          route_type: string
          source_url: string | null
          status: string
        }
        Insert: {
          airline_code: string
          airline_name?: string | null
          confidence?: string | null
          created_at?: string
          current_currency?: string | null
          current_fee?: number | null
          current_is_transferable?: boolean | null
          id?: string
          notes?: string | null
          proposed_currency?: string | null
          proposed_fee: number
          proposed_is_transferable?: boolean | null
          reason: string
          reviewed_at?: string | null
          reviewer_notes?: string | null
          route_type?: string
          source_url?: string | null
          status?: string
        }
        Update: {
          airline_code?: string
          airline_name?: string | null
          confidence?: string | null
          created_at?: string
          current_currency?: string | null
          current_fee?: number | null
          current_is_transferable?: boolean | null
          id?: string
          notes?: string | null
          proposed_currency?: string | null
          proposed_fee?: number
          proposed_is_transferable?: boolean | null
          reason?: string
          reviewed_at?: string | null
          reviewer_notes?: string | null
          route_type?: string
          source_url?: string | null
          status?: string
        }
        Relationships: []
      }
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
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      flight_verifications: {
        Row: {
          airline_iata: string
          created_at: string
          departure_date: string
          flight_number: string
          id: string
          provider: string
          raw_response: Json | null
          status: string
          updated_at: string
          verified_airline: string | null
          verified_destination_city: string | null
          verified_destination_iata: string | null
          verified_origin_city: string | null
          verified_origin_iata: string | null
        }
        Insert: {
          airline_iata: string
          created_at?: string
          departure_date: string
          flight_number: string
          id?: string
          provider?: string
          raw_response?: Json | null
          status: string
          updated_at?: string
          verified_airline?: string | null
          verified_destination_city?: string | null
          verified_destination_iata?: string | null
          verified_origin_city?: string | null
          verified_origin_iata?: string | null
        }
        Update: {
          airline_iata?: string
          created_at?: string
          departure_date?: string
          flight_number?: string
          id?: string
          provider?: string
          raw_response?: Json | null
          status?: string
          updated_at?: string
          verified_airline?: string | null
          verified_destination_city?: string | null
          verified_destination_iata?: string | null
          verified_origin_city?: string | null
          verified_origin_iata?: string | null
        }
        Relationships: []
      }
      fraud_cases: {
        Row: {
          created_at: string
          evidence: Json
          id: string
          opened_at: string
          reason: string
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          seller_id: string
          status: Database["public"]["Enums"]["fraud_status_t"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          evidence?: Json
          id?: string
          opened_at?: string
          reason: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          seller_id: string
          status?: Database["public"]["Enums"]["fraud_status_t"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          evidence?: Json
          id?: string
          opened_at?: string
          reason?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          seller_id?: string
          status?: Database["public"]["Enums"]["fraud_status_t"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fraud_cases_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fraud_events: {
        Row: {
          actor_user_id: string | null
          booking_fingerprint: string | null
          booking_reference: string | null
          case_id: string | null
          created_at: string
          event_type: string
          evidence: Json
          id: string
          listing_id: string | null
          purchase_id: string | null
          seller_id: string
        }
        Insert: {
          actor_user_id?: string | null
          booking_fingerprint?: string | null
          booking_reference?: string | null
          case_id?: string | null
          created_at?: string
          event_type: string
          evidence?: Json
          id?: string
          listing_id?: string | null
          purchase_id?: string | null
          seller_id: string
        }
        Update: {
          actor_user_id?: string | null
          booking_fingerprint?: string | null
          booking_reference?: string | null
          case_id?: string | null
          created_at?: string
          event_type?: string
          evidence?: Json
          id?: string
          listing_id?: string | null
          purchase_id?: string | null
          seller_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fraud_events_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "fraud_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fraud_events_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fraud_scores: {
        Row: {
          flags: Json
          id: string
          is_flagged: boolean
          listing_limit: number
          score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          flags?: Json
          id?: string
          is_flagged?: boolean
          listing_limit?: number
          score?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          flags?: Json
          id?: string
          is_flagged?: boolean
          listing_limit?: number
          score?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
          airline: string | null
          arrival_time: string | null
          booking_fingerprint: string | null
          booking_reference: string | null
          bumped_until: string | null
          carry_on_included: boolean | null
          created_at: string
          credit_currency: string | null
          credit_expiry_date: string | null
          credit_type: string | null
          credit_value: number | null
          currency: string
          departure_date: string
          departure_time: string | null
          destination_airport: string | null
          destination_city: string
          destination_country: string
          destination_image_url: string | null
          destination_station: string | null
          flight_number: string | null
          id: string
          is_active: boolean | null
          is_sold: boolean
          listing_type: Database["public"]["Enums"]["listing_type"]
          luggage_included: boolean | null
          meal_included: boolean | null
          name_change_fee: number | null
          name_change_risk_acknowledged_at: string | null
          operator: string | null
          origin_airport: string | null
          origin_city: string
          origin_country: string
          origin_station: string | null
          original_price: number | null
          per_ticket_inclusions: Json | null
          price: number
          return_arrival_time: string | null
          return_carry_on_included: boolean | null
          return_date: string | null
          return_departure_time: string | null
          return_flight_number: string | null
          return_luggage_included: boolean | null
          return_meal_included: boolean | null
          return_per_ticket_inclusions: Json | null
          return_speedy_boarding: boolean | null
          return_stopovers: number | null
          return_travel_class: string | null
          seller_id: string
          sold_at: string | null
          speedy_boarding: boolean | null
          stopovers: number | null
          tags: Database["public"]["Enums"]["listing_tag"][] | null
          ticket_count: number
          title: string
          train_class: string | null
          train_inclusions: Json | null
          train_number: string | null
          train_type: string | null
          travel_class: string | null
          updated_at: string
          voucher_confidence_score: number | null
          voucher_reference_code: string | null
          voucher_restrictions: string | null
          voucher_verification_flags: Json | null
          voucher_verified: boolean | null
        }
        Insert: {
          additional_notes?: string | null
          airline?: string | null
          arrival_time?: string | null
          booking_fingerprint?: string | null
          booking_reference?: string | null
          bumped_until?: string | null
          carry_on_included?: boolean | null
          created_at?: string
          credit_currency?: string | null
          credit_expiry_date?: string | null
          credit_type?: string | null
          credit_value?: number | null
          currency?: string
          departure_date: string
          departure_time?: string | null
          destination_airport?: string | null
          destination_city: string
          destination_country: string
          destination_image_url?: string | null
          destination_station?: string | null
          flight_number?: string | null
          id?: string
          is_active?: boolean | null
          is_sold?: boolean
          listing_type?: Database["public"]["Enums"]["listing_type"]
          luggage_included?: boolean | null
          meal_included?: boolean | null
          name_change_fee?: number | null
          name_change_risk_acknowledged_at?: string | null
          operator?: string | null
          origin_airport?: string | null
          origin_city: string
          origin_country: string
          origin_station?: string | null
          original_price?: number | null
          per_ticket_inclusions?: Json | null
          price: number
          return_arrival_time?: string | null
          return_carry_on_included?: boolean | null
          return_date?: string | null
          return_departure_time?: string | null
          return_flight_number?: string | null
          return_luggage_included?: boolean | null
          return_meal_included?: boolean | null
          return_per_ticket_inclusions?: Json | null
          return_speedy_boarding?: boolean | null
          return_stopovers?: number | null
          return_travel_class?: string | null
          seller_id: string
          sold_at?: string | null
          speedy_boarding?: boolean | null
          stopovers?: number | null
          tags?: Database["public"]["Enums"]["listing_tag"][] | null
          ticket_count?: number
          title: string
          train_class?: string | null
          train_inclusions?: Json | null
          train_number?: string | null
          train_type?: string | null
          travel_class?: string | null
          updated_at?: string
          voucher_confidence_score?: number | null
          voucher_reference_code?: string | null
          voucher_restrictions?: string | null
          voucher_verification_flags?: Json | null
          voucher_verified?: boolean | null
        }
        Update: {
          additional_notes?: string | null
          airline?: string | null
          arrival_time?: string | null
          booking_fingerprint?: string | null
          booking_reference?: string | null
          bumped_until?: string | null
          carry_on_included?: boolean | null
          created_at?: string
          credit_currency?: string | null
          credit_expiry_date?: string | null
          credit_type?: string | null
          credit_value?: number | null
          currency?: string
          departure_date?: string
          departure_time?: string | null
          destination_airport?: string | null
          destination_city?: string
          destination_country?: string
          destination_image_url?: string | null
          destination_station?: string | null
          flight_number?: string | null
          id?: string
          is_active?: boolean | null
          is_sold?: boolean
          listing_type?: Database["public"]["Enums"]["listing_type"]
          luggage_included?: boolean | null
          meal_included?: boolean | null
          name_change_fee?: number | null
          name_change_risk_acknowledged_at?: string | null
          operator?: string | null
          origin_airport?: string | null
          origin_city?: string
          origin_country?: string
          origin_station?: string | null
          original_price?: number | null
          per_ticket_inclusions?: Json | null
          price?: number
          return_arrival_time?: string | null
          return_carry_on_included?: boolean | null
          return_date?: string | null
          return_departure_time?: string | null
          return_flight_number?: string | null
          return_luggage_included?: boolean | null
          return_meal_included?: boolean | null
          return_per_ticket_inclusions?: Json | null
          return_speedy_boarding?: boolean | null
          return_stopovers?: number | null
          return_travel_class?: string | null
          seller_id?: string
          sold_at?: string | null
          speedy_boarding?: boolean | null
          stopovers?: number | null
          tags?: Database["public"]["Enums"]["listing_tag"][] | null
          ticket_count?: number
          title?: string
          train_class?: string | null
          train_inclusions?: Json | null
          train_number?: string | null
          train_type?: string | null
          travel_class?: string | null
          updated_at?: string
          voucher_confidence_score?: number | null
          voucher_reference_code?: string | null
          voucher_restrictions?: string | null
          voucher_verification_flags?: Json | null
          voucher_verified?: boolean | null
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
      name_change_fee_disputes: {
        Row: {
          airline_code: string
          airline_name: string | null
          created_at: string
          currency: string
          evidence_url: string | null
          id: string
          listing_id: string | null
          note: string | null
          platform_fee: number | null
          proposed_fee: number
          resolved_at: string | null
          route_type: string
          seller_id: string
          status: string
        }
        Insert: {
          airline_code: string
          airline_name?: string | null
          created_at?: string
          currency?: string
          evidence_url?: string | null
          id?: string
          listing_id?: string | null
          note?: string | null
          platform_fee?: number | null
          proposed_fee: number
          resolved_at?: string | null
          route_type?: string
          seller_id: string
          status?: string
        }
        Update: {
          airline_code?: string
          airline_name?: string | null
          created_at?: string
          currency?: string
          evidence_url?: string | null
          id?: string
          listing_id?: string | null
          note?: string | null
          platform_fee?: number | null
          proposed_fee?: number
          resolved_at?: string | null
          route_type?: string
          seller_id?: string
          status?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          created_at: string
          marketing_emails: boolean
          push_enabled: boolean
          reminder_emails: boolean
          updated_at: string
          user_id: string
          watchlist_emails: boolean
        }
        Insert: {
          created_at?: string
          marketing_emails?: boolean
          push_enabled?: boolean
          reminder_emails?: boolean
          updated_at?: string
          user_id: string
          watchlist_emails?: boolean
        }
        Update: {
          created_at?: string
          marketing_emails?: boolean
          push_enabled?: boolean
          reminder_emails?: boolean
          updated_at?: string
          user_id?: string
          watchlist_emails?: boolean
        }
        Relationships: []
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
          account_status: Database["public"]["Enums"]["seller_account_status_t"]
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
          fraud_case_id: string | null
          full_name: string | null
          has_payment_method: boolean
          id: string
          id_document_country: string | null
          id_document_dob: string | null
          id_document_expiry: string | null
          id_document_first_name: string | null
          id_document_last_name: string | null
          id_document_number_last4: string | null
          id_document_type: string | null
          id_document_url: string | null
          payouts_frozen: boolean
          phone: string | null
          postal_code: string | null
          preferred_currency: string
          preferred_language: string
          privacy_accepted_at: string | null
          privacy_accepted_version: string | null
          terms_accepted_at: string | null
          terms_accepted_version: string | null
          tour_completed_at: string | null
          transactions_bought: number | null
          transactions_sold: number | null
          updated_at: string
          user_id: string
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Insert: {
          account_status?: Database["public"]["Enums"]["seller_account_status_t"]
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
          fraud_case_id?: string | null
          full_name?: string | null
          has_payment_method?: boolean
          id?: string
          id_document_country?: string | null
          id_document_dob?: string | null
          id_document_expiry?: string | null
          id_document_first_name?: string | null
          id_document_last_name?: string | null
          id_document_number_last4?: string | null
          id_document_type?: string | null
          id_document_url?: string | null
          payouts_frozen?: boolean
          phone?: string | null
          postal_code?: string | null
          preferred_currency?: string
          preferred_language?: string
          privacy_accepted_at?: string | null
          privacy_accepted_version?: string | null
          terms_accepted_at?: string | null
          terms_accepted_version?: string | null
          tour_completed_at?: string | null
          transactions_bought?: number | null
          transactions_sold?: number | null
          updated_at?: string
          user_id: string
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Update: {
          account_status?: Database["public"]["Enums"]["seller_account_status_t"]
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
          fraud_case_id?: string | null
          full_name?: string | null
          has_payment_method?: boolean
          id?: string
          id_document_country?: string | null
          id_document_dob?: string | null
          id_document_expiry?: string | null
          id_document_first_name?: string | null
          id_document_last_name?: string | null
          id_document_number_last4?: string | null
          id_document_type?: string | null
          id_document_url?: string | null
          payouts_frozen?: boolean
          phone?: string | null
          postal_code?: string | null
          preferred_currency?: string
          preferred_language?: string
          privacy_accepted_at?: string | null
          privacy_accepted_version?: string | null
          terms_accepted_at?: string | null
          terms_accepted_version?: string | null
          tour_completed_at?: string | null
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
          buyer_apology_sent: boolean
          buyer_confirmed: boolean
          buyer_email: string | null
          buyer_full_name: string | null
          buyer_id: string | null
          created_at: string
          escrow_deadline: string | null
          escrow_status: string
          id: string
          listing_id: string | null
          name_change_fee: number | null
          name_change_proof_url: string | null
          original_booking_ref: string | null
          quantity: number
          seller_deadline_warning_sent: boolean
          seller_finality_accepted_at: string | null
          seller_finality_ip: string | null
          seller_id: string | null
          seller_late_warning_sent: boolean
          seller_reminder_sent: boolean
          seller_transferred: boolean
          status: string
          stripe_payment_id: string | null
          total_price: number
          transfer_booking_ref: string | null
          transfer_confirmed_at: string | null
          transfer_deadline: string | null
          transfer_payment_proof_url: string | null
          transfer_surname: string | null
        }
        Insert: {
          buyer_apology_sent?: boolean
          buyer_confirmed?: boolean
          buyer_email?: string | null
          buyer_full_name?: string | null
          buyer_id?: string | null
          created_at?: string
          escrow_deadline?: string | null
          escrow_status?: string
          id?: string
          listing_id?: string | null
          name_change_fee?: number | null
          name_change_proof_url?: string | null
          original_booking_ref?: string | null
          quantity: number
          seller_deadline_warning_sent?: boolean
          seller_finality_accepted_at?: string | null
          seller_finality_ip?: string | null
          seller_id?: string | null
          seller_late_warning_sent?: boolean
          seller_reminder_sent?: boolean
          seller_transferred?: boolean
          status?: string
          stripe_payment_id?: string | null
          total_price: number
          transfer_booking_ref?: string | null
          transfer_confirmed_at?: string | null
          transfer_deadline?: string | null
          transfer_payment_proof_url?: string | null
          transfer_surname?: string | null
        }
        Update: {
          buyer_apology_sent?: boolean
          buyer_confirmed?: boolean
          buyer_email?: string | null
          buyer_full_name?: string | null
          buyer_id?: string | null
          created_at?: string
          escrow_deadline?: string | null
          escrow_status?: string
          id?: string
          listing_id?: string | null
          name_change_fee?: number | null
          name_change_proof_url?: string | null
          original_booking_ref?: string | null
          quantity?: number
          seller_deadline_warning_sent?: boolean
          seller_finality_accepted_at?: string | null
          seller_finality_ip?: string | null
          seller_id?: string | null
          seller_late_warning_sent?: boolean
          seller_reminder_sent?: boolean
          seller_transferred?: boolean
          status?: string
          stripe_payment_id?: string | null
          total_price?: number
          transfer_booking_ref?: string | null
          transfer_confirmed_at?: string | null
          transfer_deadline?: string | null
          transfer_payment_proof_url?: string | null
          transfer_surname?: string | null
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
      seller_declarations: {
        Row: {
          accepted_at: string
          created_at: string
          declaration_locale: string | null
          declaration_text: string
          declaration_version: string
          id: string
          listing_id: string | null
          profile_id: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          accepted_at?: string
          created_at?: string
          declaration_locale?: string | null
          declaration_text: string
          declaration_version: string
          id?: string
          listing_id?: string | null
          profile_id?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          accepted_at?: string
          created_at?: string
          declaration_locale?: string | null
          declaration_text?: string
          declaration_version?: string
          id?: string
          listing_id?: string | null
          profile_id?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_declarations_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_declarations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          listing_id: string | null
          reason: string
          reporter_id: string
          seller_id: string
          status: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          listing_id?: string | null
          reason: string
          reporter_id: string
          seller_id: string
          status?: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          listing_id?: string | null
          reason?: string
          reporter_id?: string
          seller_id?: string
          status?: string
        }
        Relationships: []
      }
      sold_bookings: {
        Row: {
          booking_fingerprint: string | null
          booking_reference_normalized: string | null
          created_at: string
          id: string
          listing_id: string | null
          purchase_id: string
          seller_id: string
          sold_at: string
        }
        Insert: {
          booking_fingerprint?: string | null
          booking_reference_normalized?: string | null
          created_at?: string
          id?: string
          listing_id?: string | null
          purchase_id: string
          seller_id: string
          sold_at?: string
        }
        Update: {
          booking_fingerprint?: string | null
          booking_reference_normalized?: string | null
          created_at?: string
          id?: string
          listing_id?: string | null
          purchase_id?: string
          seller_id?: string
          sold_at?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          country: string | null
          device_hash: string | null
          first_seen_at: string
          hit_count: number
          id: string
          ip_hash: string | null
          last_seen_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          country?: string | null
          device_hash?: string | null
          first_seen_at?: string
          hit_count?: number
          id?: string
          ip_hash?: string | null
          last_seen_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          country?: string | null
          device_hash?: string | null
          first_seen_at?: string
          hit_count?: number
          id?: string
          ip_hash?: string | null
          last_seen_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      watchlist: {
        Row: {
          created_at: string
          id: string
          last_notified_price: number | null
          listing_id: string
          notified_unavailable_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_notified_price?: number | null
          listing_id: string
          notified_unavailable_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_notified_price?: number | null
          listing_id?: string
          notified_unavailable_at?: string | null
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
    }
    Views: {
      purchases_seller_view: {
        Row: {
          buyer_confirmed: boolean | null
          buyer_email: string | null
          buyer_full_name: string | null
          buyer_id: string | null
          created_at: string | null
          escrow_deadline: string | null
          escrow_status: string | null
          id: string | null
          listing_id: string | null
          name_change_fee: number | null
          original_booking_ref: string | null
          quantity: number | null
          seller_id: string | null
          seller_transferred: boolean | null
          status: string | null
          stripe_payment_id: string | null
          total_price: number | null
          transfer_booking_ref: string | null
          transfer_confirmed_at: string | null
          transfer_deadline: string | null
          transfer_surname: string | null
        }
        Insert: {
          buyer_confirmed?: boolean | null
          buyer_email?: never
          buyer_full_name?: never
          buyer_id?: string | null
          created_at?: string | null
          escrow_deadline?: string | null
          escrow_status?: string | null
          id?: string | null
          listing_id?: string | null
          name_change_fee?: number | null
          original_booking_ref?: string | null
          quantity?: number | null
          seller_id?: string | null
          seller_transferred?: boolean | null
          status?: string | null
          stripe_payment_id?: string | null
          total_price?: number | null
          transfer_booking_ref?: string | null
          transfer_confirmed_at?: string | null
          transfer_deadline?: string | null
          transfer_surname?: string | null
        }
        Update: {
          buyer_confirmed?: boolean | null
          buyer_email?: never
          buyer_full_name?: never
          buyer_id?: string | null
          created_at?: string | null
          escrow_deadline?: string | null
          escrow_status?: string | null
          id?: string | null
          listing_id?: string | null
          name_change_fee?: number | null
          original_booking_ref?: string | null
          quantity?: number | null
          seller_id?: string | null
          seller_transferred?: boolean | null
          status?: string | null
          stripe_payment_id?: string | null
          total_price?: number | null
          transfer_booking_ref?: string | null
          transfer_confirmed_at?: string | null
          transfer_deadline?: string | null
          transfer_surname?: string | null
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
    }
    Functions: {
      admin_ban_seller: {
        Args: { _reason: string; _seller_id: string }
        Returns: string
      }
      admin_resolve_fraud_case: {
        Args: {
          _case_id: string
          _notes?: string
          _resolution: Database["public"]["Enums"]["fraud_status_t"]
        }
        Returns: {
          created_at: string
          evidence: Json
          id: string
          opened_at: string
          reason: string
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          seller_id: string
          status: Database["public"]["Enums"]["fraud_status_t"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "fraud_cases"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      compute_booking_fingerprint: {
        Args: {
          _airline: string
          _departure_date: string
          _destination_airport: string
          _destination_city: string
          _flight_number: string
          _origin_airport: string
          _origin_city: string
          _original_price: number
          _return_date: string
          _return_flight_number: string
          _ticket_count: number
        }
        Returns: string
      }
      deactivate_past_listings: { Args: never; Returns: undefined }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_listing_view_counts: {
        Args: { _listing_ids: string[] }
        Returns: {
          listing_id: string
          view_count: number
        }[]
      }
      get_public_profiles: {
        Args: { _profile_ids: string[] }
        Returns: {
          avatar_url: string
          created_at: string
          full_name: string
          id: string
          transactions_bought: number
          transactions_sold: number
          user_id: string
          verification_status: Database["public"]["Enums"]["verification_status"]
        }[]
      }
      get_seller_purchases: {
        Args: { _statuses?: string[] }
        Returns: {
          buyer_confirmed: boolean
          buyer_id: string
          created_at: string
          escrow_deadline: string
          escrow_status: string
          id: string
          listing_id: string
          name_change_fee: number
          quantity: number
          seller_deadline_warning_sent: boolean
          seller_id: string
          seller_late_warning_sent: boolean
          seller_reminder_sent: boolean
          seller_transferred: boolean
          status: string
          total_price: number
          transfer_booking_ref: string
          transfer_confirmed_at: string
          transfer_deadline: string
          transfer_surname: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      normalize_booking_ref: { Args: { _ref: string }; Returns: string }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      fraud_status_t: "under_review" | "confirmed_fraud" | "cleared"
      listing_tag:
        | "city_trip"
        | "beach"
        | "winter_holiday"
        | "ski_trip"
        | "adventure"
        | "romantic"
        | "family"
        | "business"
      listing_type: "flight_ticket" | "travel_credit" | "train_ticket"
      seller_account_status_t: "active" | "suspended" | "banned"
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
      app_role: ["admin", "moderator", "user"],
      fraud_status_t: ["under_review", "confirmed_fraud", "cleared"],
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
      listing_type: ["flight_ticket", "travel_credit", "train_ticket"],
      seller_account_status_t: ["active", "suspended", "banned"],
      verification_status: ["pending", "verified", "rejected"],
    },
  },
} as const
