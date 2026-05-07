// Hand-authored stub for the pisi-notes tables. Run `npm run db:types` after
// applying the migration to the shared Supabase project to regenerate this
// from the live schema (it will then include Baby-food's tables too).

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      notes: {
        Row: {
          content_md: string;
          created_at: string;
          id: string;
          tags: string[];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          content_md: string;
          created_at?: string;
          id?: string;
          tags?: string[];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          content_md?: string;
          created_at?: string;
          id?: string;
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
          id: string;
          note_id: string;
          position: number;
          text: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          completed_at?: string | null;
          completion_note_id?: string | null;
          created_at?: string;
          done?: boolean;
          id?: string;
          note_id: string;
          position?: number;
          text: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          completed_at?: string | null;
          completion_note_id?: string | null;
          created_at?: string;
          done?: boolean;
          id?: string;
          note_id?: string;
          position?: number;
          text?: string;
          updated_at?: string;
          user_id?: string;
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
          id: string;
          note_id: string;
          position: number;
          text: string;
          updated_at: string;
          user_id: string;
        };
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
