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
      auth_audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          hash: string | null
          id: string
          payload: Json | null
          resource_id: string | null
          resource_type: string | null
          tenant_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          hash?: string | null
          id?: string
          payload?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          tenant_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          hash?: string | null
          id?: string
          payload?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          tenant_id?: string | null
        }
        Relationships: []
      }
      benefits: {
        Row: {
          category: Database["public"]["Enums"]["benefit_category"]
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          is_taxable: boolean | null
          legal_basis: string | null
          name: string
          provider: string | null
          tax_percentage: number | null
          updated_at: string
        }
        Insert: {
          category: Database["public"]["Enums"]["benefit_category"]
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_taxable?: boolean | null
          legal_basis?: string | null
          name: string
          provider?: string | null
          tax_percentage?: number | null
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["benefit_category"]
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_taxable?: boolean | null
          legal_basis?: string | null
          name?: string
          provider?: string | null
          tax_percentage?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          address: string | null
          city: string | null
          cnpj: string
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          logo_url: string | null
          metadata: Json | null
          monthly_budget: number | null
          monthly_spent: number | null
          name: string
          phone: string | null
          segment: string | null
          slug: string | null
          state: string | null
          status: Database["public"]["Enums"]["company_status"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          cnpj: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          metadata?: Json | null
          monthly_budget?: number | null
          monthly_spent?: number | null
          name: string
          phone?: string | null
          segment?: string | null
          slug?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["company_status"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          cnpj?: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          metadata?: Json | null
          monthly_budget?: number | null
          monthly_spent?: number | null
          name?: string
          phone?: string | null
          segment?: string | null
          slug?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["company_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "companies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      company_benefit_policies: {
        Row: {
          benefit_id: string
          company_id: string
          contract_types: Database["public"]["Enums"]["contract_type"][] | null
          created_at: string
          created_by: string | null
          eligibility_rules: Json | null
          id: string
          is_enabled: boolean | null
          min_tenure_days: number | null
          monthly_limit: number | null
          updated_at: string
        }
        Insert: {
          benefit_id: string
          company_id: string
          contract_types?: Database["public"]["Enums"]["contract_type"][] | null
          created_at?: string
          created_by?: string | null
          eligibility_rules?: Json | null
          id?: string
          is_enabled?: boolean | null
          min_tenure_days?: number | null
          monthly_limit?: number | null
          updated_at?: string
        }
        Update: {
          benefit_id?: string
          company_id?: string
          contract_types?: Database["public"]["Enums"]["contract_type"][] | null
          created_at?: string
          created_by?: string | null
          eligibility_rules?: Json | null
          id?: string
          is_enabled?: boolean | null
          min_tenure_days?: number | null
          monthly_limit?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_benefit_policies_benefit_id_fkey"
            columns: ["benefit_id"]
            isOneToOne: false
            referencedRelation: "benefits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_benefit_policies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_centers: {
        Row: {
          budget: number | null
          code: string | null
          company_id: string
          created_at: string
          id: string
          manager_name: string | null
          name: string
          spent: number | null
          updated_at: string
        }
        Insert: {
          budget?: number | null
          code?: string | null
          company_id: string
          created_at?: string
          id?: string
          manager_name?: string | null
          name: string
          spent?: number | null
          updated_at?: string
        }
        Update: {
          budget?: number | null
          code?: string | null
          company_id?: string
          created_at?: string
          id?: string
          manager_name?: string | null
          name?: string
          spent?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cost_centers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_dependents: {
        Row: {
          birth_date: string | null
          cpf: string | null
          created_at: string
          employee_id: string
          id: string
          is_active: boolean | null
          name: string
          relationship: string
          updated_at: string
        }
        Insert: {
          birth_date?: string | null
          cpf?: string | null
          created_at?: string
          employee_id: string
          id?: string
          is_active?: boolean | null
          name: string
          relationship: string
          updated_at?: string
        }
        Update: {
          birth_date?: string | null
          cpf?: string | null
          created_at?: string
          employee_id?: string
          id?: string
          is_active?: boolean | null
          name?: string
          relationship?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_dependents_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_wallets: {
        Row: {
          available_balance: number | null
          created_at: string
          employee_id: string
          id: string
          last_credit_date: string | null
          reserved_balance: number | null
          total_balance: number | null
          updated_at: string
        }
        Insert: {
          available_balance?: number | null
          created_at?: string
          employee_id: string
          id?: string
          last_credit_date?: string | null
          reserved_balance?: number | null
          total_balance?: number | null
          updated_at?: string
        }
        Update: {
          available_balance?: number | null
          created_at?: string
          employee_id?: string
          id?: string
          last_credit_date?: string | null
          reserved_balance?: number | null
          total_balance?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_wallets_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          avatar_url: string | null
          company_id: string
          contract_type: Database["public"]["Enums"]["contract_type"]
          cost_center_id: string | null
          cpf: string | null
          created_at: string
          department: string | null
          email: string
          first_name: string
          hire_date: string | null
          id: string
          last_name: string
          phone: string | null
          position: string | null
          salary: number | null
          status: Database["public"]["Enums"]["employee_status"]
          updated_at: string
          user_id: string | null
          work_hours: number | null
        }
        Insert: {
          avatar_url?: string | null
          company_id: string
          contract_type?: Database["public"]["Enums"]["contract_type"]
          cost_center_id?: string | null
          cpf?: string | null
          created_at?: string
          department?: string | null
          email: string
          first_name: string
          hire_date?: string | null
          id?: string
          last_name: string
          phone?: string | null
          position?: string | null
          salary?: number | null
          status?: Database["public"]["Enums"]["employee_status"]
          updated_at?: string
          user_id?: string | null
          work_hours?: number | null
        }
        Update: {
          avatar_url?: string | null
          company_id?: string
          contract_type?: Database["public"]["Enums"]["contract_type"]
          cost_center_id?: string | null
          cpf?: string | null
          created_at?: string
          department?: string | null
          email?: string
          first_name?: string
          hire_date?: string | null
          id?: string
          last_name?: string
          phone?: string | null
          position?: string | null
          salary?: number | null
          status?: Database["public"]["Enums"]["employee_status"]
          updated_at?: string
          user_id?: string | null
          work_hours?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
        ]
      }
      mfa_settings: {
        Row: {
          backup_codes: Json | null
          created_at: string
          id: string
          is_enabled: boolean | null
          totp_secret: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          backup_codes?: Json | null
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          totp_secret?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          backup_codes?: Json | null
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          totp_secret?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mfa_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          count: number
          created_at: string
          id: string
          key: string
          window_start: string
        }
        Insert: {
          count?: number
          created_at?: string
          id?: string
          key: string
          window_start?: string
        }
        Update: {
          count?: number
          created_at?: string
          id?: string
          key?: string
          window_start?: string
        }
        Relationships: []
      }
      role_assignments: {
        Row: {
          created_at: string
          id: string
          role_id: string
          scope: Json | null
          subject_id: string
          subject_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          role_id: string
          scope?: Json | null
          subject_id: string
          subject_type: string
        }
        Update: {
          created_at?: string
          id?: string
          role_id?: string
          scope?: Json | null
          subject_id?: string
          subject_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_assignments_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          id: string
          name: string
          permissions: Json | null
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          permissions?: Json | null
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          permissions?: Json | null
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "roles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      sso_providers: {
        Row: {
          created_at: string
          enabled: boolean | null
          id: string
          metadata: Json | null
          provider_type: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean | null
          id?: string
          metadata?: Json | null
          provider_type: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean | null
          id?: string
          metadata?: Json | null
          provider_type?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sso_providers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          is_active: boolean | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wallet_allocations: {
        Row: {
          allocated_amount: number | null
          benefit_id: string
          created_at: string
          id: string
          percentage: number | null
          updated_at: string
          used_amount: number | null
          wallet_id: string
        }
        Insert: {
          allocated_amount?: number | null
          benefit_id: string
          created_at?: string
          id?: string
          percentage?: number | null
          updated_at?: string
          used_amount?: number | null
          wallet_id: string
        }
        Update: {
          allocated_amount?: number | null
          benefit_id?: string
          created_at?: string
          id?: string
          percentage?: number | null
          updated_at?: string
          used_amount?: number | null
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_allocations_benefit_id_fkey"
            columns: ["benefit_id"]
            isOneToOne: false
            referencedRelation: "benefits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_allocations_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "employee_wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_transactions: {
        Row: {
          amount: number
          benefit_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          reference_id: string | null
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          wallet_id: string
        }
        Insert: {
          amount: number
          benefit_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          reference_id?: string | null
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          wallet_id: string
        }
        Update: {
          amount?: number
          benefit_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          reference_id?: string | null
          transaction_type?: Database["public"]["Enums"]["transaction_type"]
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_benefit_id_fkey"
            columns: ["benefit_id"]
            isOneToOne: false
            referencedRelation: "benefits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "employee_wallets"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_employee_company_id: {
        Args: { check_employee_id: string }
        Returns: string
      }
      get_user_company_id: { Args: never; Returns: string }
      get_wallet_employee_id: {
        Args: { check_wallet_id: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_company_admin: { Args: { check_company_id: string }; Returns: boolean }
      is_employee_owner: {
        Args: { check_employee_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "super_admin" | "company_admin" | "hr_manager" | "employee"
      benefit_category:
        | "alimentacao"
        | "saude"
        | "transporte"
        | "bemestar"
        | "financeiro"
        | "outros"
      company_status: "active" | "inactive" | "pending"
      contract_type: "clt" | "pj" | "intern" | "temp"
      employee_status: "active" | "inactive" | "on_leave" | "terminated"
      transaction_type: "credit" | "debit" | "transfer" | "adjustment"
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
      app_role: ["super_admin", "company_admin", "hr_manager", "employee"],
      benefit_category: [
        "alimentacao",
        "saude",
        "transporte",
        "bemestar",
        "financeiro",
        "outros",
      ],
      company_status: ["active", "inactive", "pending"],
      contract_type: ["clt", "pj", "intern", "temp"],
      employee_status: ["active", "inactive", "on_leave", "terminated"],
      transaction_type: ["credit", "debit", "transfer", "adjustment"],
    },
  },
} as const
