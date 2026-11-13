// Hand-authored stub for the pisi-notes tables. Run `npm run db:types` after
// applying the migration to the shared Supabase project to regenerate this
// from the live schema (it will then include Baby-food's tables too).

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  pisi: {
    Tables: {
      notes: {
        Row: {
          archived_at: string | null;
          content_md: string;
          created_at: string;
          id: string;
          pinned_at: string | null;
          share_token: string | null;
          shared_at: string | null;
          tags: string[];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          archived_at?: string | null;
          content_md: string;
          created_at?: string;
          id?: string;
          pinned_at?: string | null;
          share_token?: string | null;
          shared_at?: string | null;
          tags?: string[];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          archived_at?: string | null;
          content_md?: string;
          created_at?: string;
          id?: string;
          pinned_at?: string | null;
          share_token?: string | null;
          shared_at?: string | null;
          tags?: string[];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      tasks: {
        Row: {
          completed_at: string | null;
          completion_note_id: string | null;
          created_at: string;
          done: boolean;
          due_at: string | null;
          id: string;
          note_id: string;
          position: number;
          remind_at: string | null;
          reminded_at: string | null;
          text: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          completed_at?: string | null;
          completion_note_id?: string | null;
          created_at?: string;
          done?: boolean;
          due_at?: string | null;
          id?: string;
          note_id: string;
          position?: number;
          remind_at?: string | null;
          reminded_at?: string | null;
          text: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          completed_at?: string | null;
          completion_note_id?: string | null;
          created_at?: string;
          done?: boolean;
          due_at?: string | null;
          id?: string;
          note_id?: string;
          position?: number;
          remind_at?: string | null;
          reminded_at?: string | null;
          text?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      reminders: {
        Row: {
          completed_at: string | null;
          created_at: string;
          done: boolean;
          id: string;
          note_id: string;
          position: number;
          remind_at: string | null;
          reminded_at: string | null;
          text: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string;
          done?: boolean;
          id?: string;
          note_id: string;
          position?: number;
          remind_at?: string | null;
          reminded_at?: string | null;
          text: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string;
          done?: boolean;
          id?: string;
          note_id?: string;
          position?: number;
          remind_at?: string | null;
          reminded_at?: string | null;
          text?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      push_subscriptions: {
        Row: {
          auth: string;
          created_at: string;
          endpoint: string;
          id: string;
          p256dh: string;
          updated_at: string;
          user_agent: string | null;
          user_id: string;
        };
        Insert: {
          auth: string;
          created_at?: string;
          endpoint: string;
          id?: string;
          p256dh: string;
          updated_at?: string;
          user_agent?: string | null;
          user_id: string;
        };
        Update: {
          auth?: string;
          created_at?: string;
          endpoint?: string;
          id?: string;
          p256dh?: string;
          updated_at?: string;
          user_agent?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      user_prefs: {
        Row: {
          user_id: string;
          show_reminders_in_sidebar: boolean;
          hidden_tags: { tag: string; hidden_at: string }[];
          hidden_reminder_dates: { date: string; hidden_at: string }[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          show_reminders_in_sidebar?: boolean;
          hidden_tags?: { tag: string; hidden_at: string }[];
          hidden_reminder_dates?: { date: string; hidden_at: string }[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          show_reminders_in_sidebar?: boolean;
          hidden_tags?: { tag: string; hidden_at: string }[];
          hidden_reminder_dates?: { date: string; hidden_at: string }[];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          user_id: string;
          plan: string;
          status: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          current_period_end: string | null;
          cancel_at_period_end: boolean;
          ai_credits_used: number;
          last_digest_at: string | null;
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
          ai_credits_used?: number;
          last_digest_at?: string | null;
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
          ai_credits_used?: number;
          last_digest_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      toggle_task: {
        Args: {
          p_id: string;
          p_done: boolean;
        };
        Returns: {
          completed_at: string | null;
          completion_note_id: string | null;
          created_at: string;
          done: boolean;
          due_at: string | null;
          id: string;
          note_id: string;
          position: number;
          remind_at: string | null;
          reminded_at: string | null;
          text: string;
          updated_at: string;
          user_id: string;
        };
      };
      toggle_reminder: {
        Args: {
          p_id: string;
          p_done: boolean;
        };
        Returns: {
          completed_at: string | null;
          created_at: string;
          done: boolean;
          id: string;
          note_id: string;
          position: number;
          remind_at: string | null;
          reminded_at: string | null;
          text: string;
          updated_at: string;
          user_id: string;
        };
      };
      consume_ai_credit: {
        Args: Record<string, never>;
        Returns: number;
      };
      get_shared_note: {
        Args: { p_token: string };
        Returns: {
          id: string;
          content_md: string;
          tags: string[];
          created_at: string;
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
