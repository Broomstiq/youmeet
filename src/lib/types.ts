import { Database } from './database.types'

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Commonly used types
export interface User {
  id: string;
  name: string;
  email: string;
  birth_date: string;
  city?: string;
  profile_picture?: string;
  matching_param: number;
  needs_onboarding: boolean;
  created_at: string;
}

export interface CommonSubscription {
  channel_id: string;
  channel_name: string;
  category?: string;
}

export interface Prematch {
  id: string;
  user_id: string;
  match_user_id: string;
  relevancy_score: number;
  created_at: string;
  skipped: boolean;
}

export interface Match {
  id: string;
  user_1_id: string;
  user_2_id: string;
  relevancy_score: number;
  created_at: string;
} 