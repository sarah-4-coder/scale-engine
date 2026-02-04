/* eslint-disable @typescript-eslint/no-explicit-any */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.1";
  };
  public: {
    Tables: {
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          full_name: string | null;
          id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string | null;
          id?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string | null;
          id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
      influencer_profiles: {
        Row: {
          id: string;
          user_id: string;
          instagram_handle: string;
          instagram_profile_url: string;
          niches: string[] | null;
          phone_number: string;
          followers_count: number | null;
          following_count: number | null;
          posts_count: number | null;
          bio: string | null;
          is_private: boolean | null;
          profile_completed: boolean;
          city: string | null;
          state: string | null;
          full_name: string;
          created_at: string;
          updated_at: string;
          is_blocked: boolean;
          blocked_reason: string | null;
          blocked_at: string | null;
          blocked_by_user_id: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          instagram_handle: string;
          instagram_profile_url: string;
          niches?: string[] | null;
          phone_number: string;
          followers_count?: number | null;
          following_count?: number | null;
          posts_count?: number | null;
          bio?: string | null;
          is_private?: boolean | null;
          profile_completed?: boolean;
          city?: string | null;
          state?: string | null;
          full_name?: string;
          created_at?: string;
          updated_at?: string;
          is_blocked?: boolean;
          blocked_reason?: string | null;
          blocked_at?: string | null;
          blocked_by_user_id?: string | null;
        };
        Update: {
          is_blocked?: boolean;
          blocked_reason?: string | null;
          blocked_at?: string | null;
          blocked_by_user_id?: string | null;
          updated_at?: string;
        };
        // Update: never;
        Relationships: [];
      };
      contracts: {
        Row: {
          id: string;
          campaign_id: string;
          influencer_id: string;
          contract_text: string;
          status: "pending_signature" | "signed" | "cancelled";
          signed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          influencer_id: string;
          contract_text: string;
          status?: "pending_signature" | "signed" | "cancelled";
          signed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          campaign_id?: string;
          influencer_id?: string;
          contract_text?: string;
          status?: "pending_signature" | "signed" | "cancelled";
          signed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "contracts_campaign_id_fkey";
            columns: ["campaign_id"];
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contracts_influencer_id_fkey";
            columns: ["influencer_id"];
            referencedRelation: "influencer_profiles";
            referencedColumns: ["id"];
          },
        ];
      };

      // NEW: Brand/Agency profiles table
      brand_profiles: {
        Row: {
          id: string;
          user_id: string;
          company_name: string;
          work_email: string;
          phone_number: string;
          company_website: string | null;
          industry: string | null;
          company_size: string | null;
          description: string | null;
          is_verified: boolean;
          profile_completed: boolean;
          city: string | null;
          state: string | null;
          contact_person_name: string;
          contact_person_designation: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          company_name: string;
          work_email: string;
          phone_number: string;
          company_website?: string | null;
          industry?: string | null;
          company_size?: string | null;
          description?: string | null;
          is_verified?: boolean;
          profile_completed?: boolean;
          city?: string | null;
          state?: string | null;
          contact_person_name: string;
          contact_person_designation?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          company_name?: string;
          work_email?: string;
          phone_number?: string;
          company_website?: string | null;
          industry?: string | null;
          company_size?: string | null;
          description?: string | null;
          is_verified?: boolean;
          profile_completed?: boolean;
          city?: string | null;
          state?: string | null;
          contact_person_name?: string;
          contact_person_designation?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      campaigns: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          niches: string[] | null;
          deliverables: string;
          timeline: string;
          base_payout: number;
          admin_user_id: string | null;
          brand_user_id: string | null; // NEW: for brand-created campaigns
          eligibility: Record<string, any> | null;
          requirements: Record<string, any> | null;
          can_negotiate: boolean; // NEW: false for brand campaigns
          status: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          niches?: string[] | null;
          deliverables?: string;
          timeline?: string;
          base_payout?: number;
          admin_user_id?: string | null;
          brand_user_id?: string | null;
          eligibility?: Record<string, any> | null;
          requirements?: Record<string, any> | null;
          can_negotiate?: boolean;
          status?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          niches?: string[] | null;
          deliverables?: string;
          timeline?: string;
          base_payout?: number;
          admin_user_id?: string | null;
          brand_user_id?: string | null;
          eligibility?: Record<string, any> | null;
          requirements?: Record<string, any> | null;
          can_negotiate?: boolean;
          status?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      niches: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      campaign_influencers: {
        Row: {
          id: string;
          campaign_id: string;
          influencer_id: string;
          requested_payout: number | null;
          final_payout: number | null;
          posted_link: string[] | null;
          posted_at: string | null;
          completed_at: string | null;
          status: string;
          created_at: string;
          contract_signed: boolean;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          influencer_id: string;
          requested_payout?: number | null;
          final_payout?: number | null;
          posted_link?: string[] | null;
          posted_at?: string | null;
          completed_at?: string | null;
          status?: string;
          created_at?: string;
          contract_signed?: boolean;
        };
        Update: {
          id?: string;
          campaign_id?: string;
          influencer_id?: string;
          requested_payout?: number | null;
          final_payout?: number | null;
          posted_link?: string[] | null;
          posted_at?: string | null;
          completed_at?: string | null;
          status?: string;
          created_at?: string;
          contract_signed?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "campaign_influencers_campaign_id_fkey";
            columns: ["campaign_id"];
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "campaign_influencers_influencer_id_fkey";
            columns: ["influencer_id"];
            referencedRelation: "influencer_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          role: string;
          type: string;
          title: string;
          message: string;
          metadata: any | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: string;
          type: string;
          title: string;
          message: string;
          metadata?: any | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: string;
          type?: string;
          title?: string;
          message?: string;
          metadata?: any | null;
          is_read?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      user_preferences: {
        Row: {
          id: string;
          user_id: string;
          ui_theme: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          ui_theme?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          ui_theme?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_user_role: {
        Args: { _user_id: string };
        Returns: Database["public"]["Enums"]["app_role"];
      };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      get_user_emails: {
        Args: {
          user_ids: string[];
        };
        Returns: {
          id: string;
          email: string;
        }[];
      };
    };
    Enums: {
      app_role: "admin" | "influencer" | "brand"; // UPDATED: Added "brand"
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "influencer", "brand"],
    },
  },
} as const;
