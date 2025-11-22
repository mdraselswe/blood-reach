export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          phone: string | null;
          whatsapp: string | null;
          avatar_url: string | null;
          role: 'donor' | 'volunteer' | 'moderator' | 'admin';
          preferred_language: string | null;
          consent_marketing: boolean;
          last_seen_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          phone?: string | null;
          whatsapp?: string | null;
          avatar_url?: string | null;
          role?: 'donor' | 'volunteer' | 'moderator' | 'admin';
          preferred_language?: string | null;
          consent_marketing?: boolean;
          last_seen_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Row']>;
        Relationships: [];
      };
      donors: {
        Row: {
          id: string;
          user_id: string | null;
          display_name: string;
          blood_group: Database['public']['Enums']['blood_group'];
          gender: string | null;
          birth_year: number | null;
          phone_primary: string;
          phone_secondary: string | null;
          email: string | null;
          district: string;
          area: string | null;
          latitude: string | null;
          longitude: string | null;
          availability: Database['public']['Enums']['availability_status'];
          last_donation_at: string | null;
          donation_frequency: string | null;
          verified: boolean;
          response_rate: string | null;
          donation_count: number;
          emergency_ready: boolean;
          about: string | null;
          tags: string[] | null;
          share_contact: boolean;
          institute: string | null;
          department: string | null;
          batch: string | null;
          approved: boolean;
          approved_at: string | null;
          approved_by: string | null;
          created_at: string;
          updated_at: string;
          searchable_text: unknown;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          display_name: string;
          blood_group: Database['public']['Enums']['blood_group'];
          gender?: string | null;
          birth_year?: number | null;
          phone_primary: string;
          phone_secondary?: string | null;
          email?: string | null;
          district: string;
          area?: string | null;
          latitude?: string | null;
          longitude?: string | null;
          availability?: Database['public']['Enums']['availability_status'];
          last_donation_at?: string | null;
          donation_frequency?: string | null;
          verified?: boolean;
          response_rate?: string | null;
          donation_count?: number;
          emergency_ready?: boolean;
          about?: string | null;
          tags?: string[] | null;
          share_contact?: boolean;
          institute?: string | null;
          department?: string | null;
          batch?: string | null;
          approved?: boolean;
          approved_at?: string | null;
          approved_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['donors']['Row']>;
        Relationships: [
          {
            foreignKeyName: 'donors_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      donation_posts: {
        Row: {
          id: string;
          donor_id: string | null;
          title: string | null;
          story: string;
          donation_date: string;
          images: string[] | null;
          location: string | null;
          created_at: string;
          updated_at: string;
          reactions_count: number;
          comments_count: number;
          is_published: boolean;
        };
        Insert: {
          id?: string;
          donor_id?: string | null;
          title?: string | null;
          story: string;
          donation_date: string;
          images?: string[] | null;
          location?: string | null;
          created_at?: string;
          updated_at?: string;
          reactions_count?: number;
          comments_count?: number;
          is_published?: boolean;
        };
        Update: Partial<Database['public']['Tables']['donation_posts']['Row']>;
        Relationships: [
          {
            foreignKeyName: 'donation_posts_donor_id_fkey';
            columns: ['donor_id'];
            referencedRelation: 'donors';
            referencedColumns: ['id'];
          },
        ];
      };
      post_reactions: {
        Row: {
          id: string;
          post_id: string | null;
          user_id: string | null;
          reaction: Database['public']['Enums']['reaction_type'];
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id?: string | null;
          user_id?: string | null;
          reaction?: Database['public']['Enums']['reaction_type'];
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['post_reactions']['Row']>;
        Relationships: [
          {
            foreignKeyName: 'post_reactions_post_id_fkey';
            columns: ['post_id'];
            referencedRelation: 'donation_posts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'post_reactions_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      post_comments: {
        Row: {
          id: string;
          post_id: string | null;
          user_id: string | null;
          content: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          post_id?: string | null;
          user_id?: string | null;
          content: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['post_comments']['Row']>;
        Relationships: [
          {
            foreignKeyName: 'post_comments_post_id_fkey';
            columns: ['post_id'];
            referencedRelation: 'donation_posts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'post_comments_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      blood_requests: {
        Row: {
          id: string;
          requester_id: string | null;
          patient_name: string;
          contact_name: string | null;
          contact_phone: string;
          contact_whatsapp: string | null;
          hospital_name: string | null;
          hospital_address: string | null;
          district: string;
          area: string | null;
          blood_group: Database['public']['Enums']['blood_group'];
          units_needed: number;
          needed_on: string;
          note: string | null;
          status: Database['public']['Enums']['request_status'];
          matched_donor_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          requester_id?: string | null;
          patient_name: string;
          contact_name?: string | null;
          contact_phone: string;
          contact_whatsapp?: string | null;
          hospital_name?: string | null;
          hospital_address?: string | null;
          district: string;
          area?: string | null;
          blood_group: Database['public']['Enums']['blood_group'];
          units_needed?: number;
          needed_on: string;
          note?: string | null;
          status?: Database['public']['Enums']['request_status'];
          matched_donor_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['blood_requests']['Row']>;
        Relationships: [
          {
            foreignKeyName: 'blood_requests_match_fkey';
            columns: ['matched_donor_id'];
            referencedRelation: 'donors';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'blood_requests_requester_fkey';
            columns: ['requester_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      social_links: {
        Row: {
          id: string;
          platform: string;
          label: string;
          description: string | null;
          invite_url: string;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          platform: string;
          label: string;
          description?: string | null;
          invite_url: string;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['social_links']['Row']>;
        Relationships: [];
      };
      notification_tokens: {
        Row: {
          id: string;
          user_id: string | null;
          platform: string;
          token: string;
          is_active: boolean;
          last_used_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          platform: string;
          token: string;
          is_active?: boolean;
          last_used_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['notification_tokens']['Row']>;
        Relationships: [
          {
            foreignKeyName: 'notification_tokens_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      audit_logs: {
        Row: {
          id: string;
          actor_id: string | null;
          action: string;
          resource_type: string;
          resource_id: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          action: string;
          resource_type: string;
          resource_id?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['audit_logs']['Row']>;
        Relationships: [
          {
            foreignKeyName: 'audit_logs_actor_id_fkey';
            columns: ['actor_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      area_lookup: {
        Row: {
          id: number;
          district: string;
          area: string;
          is_active: boolean;
        };
        Insert: {
          id?: number;
          district: string;
          area: string;
          is_active?: boolean;
        };
        Update: Partial<Database['public']['Tables']['area_lookup']['Row']>;
        Relationships: [];
      };
      institute_lookup: {
        Row: {
          id: number;
          name: string;
          name_en: string | null;
          type: string | null;
          district: string | null;
          departments: string[];
          batches: string[];
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          name_en?: string | null;
          type?: string | null;
          district?: string | null;
          departments?: string[];
          batches?: string[];
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['institute_lookup']['Row']>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      blood_group: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
      availability_status: 'available' | 'temporarily_unavailable' | 'not_available';
      user_role: 'donor' | 'volunteer' | 'moderator' | 'admin';
      request_status: 'open' | 'matched' | 'fulfilled' | 'expired' | 'cancelled';
      reaction_type: 'heart' | 'support' | 'pray';
    };
    CompositeTypes: Record<string, never>;
  };
};
