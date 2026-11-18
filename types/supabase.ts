// Hand-authored types for the `minmi` schema (supabase/migrations/0001).
// Run `npm run db:types` after applying the migration to regenerate this
// from the live schema.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type RotationMode = "sequential" | "random";

export type Database = {
  minmi: {
    Tables: {
      subscriptions: {
        Row: {
          user_id: string;
          plan: string;
          status: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          current_period_end: string | null;
          cancel_at_period_end: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          plan?: string;
          status?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          plan?: string;
          status?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      rotators: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          slug: string;
          mode: RotationMode;
          active: boolean;
          open_count: number;
          last_opened_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          slug: string;
          mode?: RotationMode;
          active?: boolean;
          open_count?: number;
          last_opened_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          slug?: string;
          mode?: RotationMode;
          active?: boolean;
          open_count?: number;
          last_opened_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      rotator_images: {
        Row: {
          id: string;
          rotator_id: string;
          user_id: string;
          storage_path: string | null;
          external_url: string | null;
          content_type: string | null;
          label: string | null;
          position: number;
          serve_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          rotator_id: string;
          user_id: string;
          storage_path?: string | null;
          external_url?: string | null;
          content_type?: string | null;
          label?: string | null;
          position?: number;
          serve_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          rotator_id?: string;
          user_id?: string;
          storage_path?: string | null;
          external_url?: string | null;
          content_type?: string | null;
          label?: string | null;
          position?: number;
          serve_count?: number;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      next_rotator_image: {
        Args: { p_slug: string };
        Returns: {
          storage_path: string | null;
          external_url: string | null;
          content_type: string | null;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
