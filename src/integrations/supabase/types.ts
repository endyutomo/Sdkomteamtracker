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
      activities: {
        Row: {
          activity_type: Database["public"]["Enums"]["activity_type"]
          category: Database["public"]["Enums"]["activity_category"]
          collaboration: Json | null
          created_at: string
          customer_name: string
          date: string
          id: string
          latitude: number | null
          location_name: string | null
          longitude: number | null
          notes: string | null
          opportunity: string | null
          person_id: string | null
          person_name: string
          photos: string[] | null
          project: string | null
          reminder_at: string | null
          user_id: string
        }
        Insert: {
          activity_type: Database["public"]["Enums"]["activity_type"]
          category: Database["public"]["Enums"]["activity_category"]
          collaboration?: Json | null
          created_at?: string
          customer_name: string
          date?: string
          id?: string
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          notes?: string | null
          opportunity?: string | null
          person_id?: string | null
          person_name: string
          photos?: string[] | null
          project?: string | null
          reminder_at?: string | null
          user_id: string
        }
        Update: {
          activity_type?: Database["public"]["Enums"]["activity_type"]
          category?: Database["public"]["Enums"]["activity_category"]
          collaboration?: Json | null
          created_at?: string
          customer_name?: string
          date?: string
          id?: string
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          notes?: string | null
          opportunity?: string | null
          person_id?: string | null
          person_name?: string
          photos?: string[] | null
          project?: string | null
          reminder_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      company_settings: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          division: string | null
          id: string
          name: string | null
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          division?: string | null
          id?: string
          name?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          division?: string | null
          id?: string
          name?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      message_reads: {
        Row: {
          id: string
          message_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          id?: string
          message_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          id?: string
          message_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reads_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          image_url: string | null
          sender_id: string
          updated_at: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          image_url?: string | null
          sender_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          image_url?: string | null
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          activity_id: string | null
          created_at: string
          id: string
          is_read: boolean
          message: string
          title: string
          user_id: string
        }
        Insert: {
          activity_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          title: string
          user_id: string
        }
        Update: {
          activity_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_manager_requests: {
        Row: {
          created_at: string
          email: string
          id: string
          jabatan: string | null
          name: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          jabatan?: string | null
          name: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          jabatan?: string | null
          name?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      persons: {
        Row: {
          created_at: string
          id: string
          name: string
          role: Database["public"]["Enums"]["person_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          role?: Database["public"]["Enums"]["person_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          role?: Database["public"]["Enums"]["person_role"]
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          division: Database["public"]["Enums"]["division_type"]
          id: string
          jabatan: string | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          division: Database["public"]["Enums"]["division_type"]
          id?: string
          jabatan?: string | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          division?: Database["public"]["Enums"]["division_type"]
          id?: string
          jabatan?: string | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sales_records: {
        Row: {
          closing_date: string
          cost_price: number | null
          created_at: string
          customer_name: string
          id: string
          margin_amount: number | null
          margin_percentage: number | null
          notes: string | null
          other_expense: number | null
          product_name: string
          quantity: number
          total_amount: number
          unit_price: number
          updated_at: string
          user_id: string
        }
        Insert: {
          closing_date?: string
          cost_price?: number | null
          created_at?: string
          customer_name: string
          id?: string
          margin_amount?: number | null
          margin_percentage?: number | null
          notes?: string | null
          other_expense?: number | null
          product_name: string
          quantity?: number
          total_amount: number
          unit_price: number
          updated_at?: string
          user_id: string
        }
        Update: {
          closing_date?: string
          cost_price?: number | null
          created_at?: string
          customer_name?: string
          id?: string
          margin_amount?: number | null
          margin_percentage?: number | null
          notes?: string | null
          other_expense?: number | null
          product_name?: string
          quantity?: number
          total_amount?: number
          unit_price?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sales_targets: {
        Row: {
          created_at: string
          id: string
          period_month: number | null
          period_quarter: number | null
          period_type: string
          period_year: number
          target_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          period_month?: number | null
          period_quarter?: number | null
          period_type: string
          period_year: number
          target_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          period_month?: number | null
          period_quarter?: number | null
          period_type?: string
          period_year?: number
          target_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_backoffice: { Args: { _user_id: string }; Returns: boolean }
      is_logistic: { Args: { _user_id: string }; Returns: boolean }
      is_manager: { Args: { _user_id: string }; Returns: boolean }
      is_presales: { Args: { _user_id: string }; Returns: boolean }
      is_sales: { Args: { _user_id: string }; Returns: boolean }
      is_superadmin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      activity_category: "sales" | "presales"
      activity_type:
        | "visit"
        | "call"
        | "email"
        | "meeting"
        | "other"
        | "sick"
        | "permission"
        | "time_off"
        | "wfh"
      app_role: "admin" | "user" | "superadmin"
      division_type:
        | "sales"
        | "presales"
        | "manager"
        | "backoffice"
        | "logistic"
      person_role: "sales" | "presales" | "other"
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
      activity_category: ["sales", "presales"],
      activity_type: [
        "visit",
        "call",
        "email",
        "meeting",
        "other",
        "sick",
        "permission",
        "time_off",
        "wfh",
      ],
      app_role: ["admin", "user", "superadmin"],
      division_type: ["sales", "presales", "manager", "backoffice", "logistic"],
      person_role: ["sales", "presales", "other"],
    },
  },
} as const
