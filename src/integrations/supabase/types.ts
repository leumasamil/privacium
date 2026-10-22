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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          detail: string
          hash: string
          op: string
          prev_hash: string
          role: Database["public"]["Enums"]["app_role"]
          seq: number
          target: string
          ts: string
          user_email: string | null
          user_id: string
        }
        Insert: {
          detail: string
          hash: string
          op: string
          prev_hash: string
          role: Database["public"]["Enums"]["app_role"]
          seq?: number
          target: string
          ts?: string
          user_email?: string | null
          user_id: string
        }
        Update: {
          detail?: string
          hash?: string
          op?: string
          prev_hash?: string
          role?: Database["public"]["Enums"]["app_role"]
          seq?: number
          target?: string
          ts?: string
          user_email?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
        }
        Relationships: []
      }
      question_bank: {
        Row: {
          department: string
          id: number
          principle: string
          text: string
          weight: number
        }
        Insert: {
          department: string
          id: number
          principle: string
          text: string
          weight: number
        }
        Update: {
          department?: string
          id?: number
          principle?: string
          text?: string
          weight?: number
        }
        Relationships: []
      }
      trilha_auditoria_sistema: {
        Row: {
          cnpj: string | null
          detail: string
          hash: string
          op: string
          prev_hash: string
          role: Database["public"]["Enums"]["app_role"]
          seq: number
          target: string
          ts: string
          user_email: string | null
          user_id: string
        }
        Insert: {
          cnpj?: string | null
          detail: string
          hash: string
          op: string
          prev_hash: string
          role: Database["public"]["Enums"]["app_role"]
          seq?: number
          target: string
          ts?: string
          user_email?: string | null
          user_id: string
        }
        Update: {
          cnpj?: string | null
          detail?: string
          hash?: string
          op?: string
          prev_hash?: string
          role?: Database["public"]["Enums"]["app_role"]
          seq?: number
          target?: string
          ts?: string
          user_email?: string | null
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
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      workspace_empresa: {
        Row: {
          cnpj: string
          created_at: string
          data: Json
          razao_social: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          cnpj: string
          created_at?: string
          data?: Json
          razao_social?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          cnpj?: string
          created_at?: string
          data?: Json
          razao_social?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      workspace_state: {
        Row: {
          data: Json
          id: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          data?: Json
          id?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          data?: Json
          id?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      append_audit: {
        Args: {
          _detail: string
          _op: string
          _role: Database["public"]["Enums"]["app_role"]
          _target: string
        }
        Returns: {
          detail: string
          hash: string
          op: string
          prev_hash: string
          role: Database["public"]["Enums"]["app_role"]
          seq: number
          target: string
          ts: string
          user_email: string | null
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "audit_log"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      has_any_role: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      list_members: {
        Args: never
        Returns: {
          display_name: string
          email: string
          id: string
          roles: Database["public"]["Enums"]["app_role"][]
        }[]
      }
      registrar_trilha: {
        Args: {
          _cnpj: string
          _detail: string
          _op: string
          _role: Database["public"]["Enums"]["app_role"]
          _target: string
        }
        Returns: {
          cnpj: string | null
          detail: string
          hash: string
          op: string
          prev_hash: string
          role: Database["public"]["Enums"]["app_role"]
          seq: number
          target: string
          ts: string
          user_email: string | null
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "trilha_auditoria_sistema"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      verificar_trilha: {
        Args: never
        Returns: {
          broken_at: number
          ok: boolean
          total: number
        }[]
      }
      verify_audit_chain: {
        Args: never
        Returns: {
          broken_at: number
          ok: boolean
          total: number
        }[]
      }
    }
    Enums: {
      app_role: "ADMIN_SISTEMA" | "DPO_OPERACIONAL" | "C_SUITE"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["ADMIN_SISTEMA", "DPO_OPERACIONAL", "C_SUITE"],
    },
  },
} as const
