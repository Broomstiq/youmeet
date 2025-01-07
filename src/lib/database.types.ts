export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          password_hash: string | null
          google_id: string | null
          name: string
          birth_date: string
          city: string | null
          profile_picture: string | null
          matching_param: number
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          password_hash?: string | null
          google_id?: string | null
          name: string
          birth_date: string
          city?: string | null
          profile_picture?: string | null
          matching_param?: number
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          password_hash?: string | null
          google_id?: string | null
          name?: string
          birth_date?: string
          city?: string | null
          profile_picture?: string | null
          matching_param?: number
          created_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          channel_id: string
          channel_name: string
          category: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          channel_id: string
          channel_name: string
          category?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          channel_id?: string
          channel_name?: string
          category?: string | null
          created_at?: string
        }
      }
      matches: {
        Row: {
          id: string
          user_1_id: string
          user_2_id: string
          relevancy_score: number
          created_at: string
        }
        Insert: {
          id?: string
          user_1_id: string
          user_2_id: string
          relevancy_score: number
          created_at?: string
        }
        Update: {
          id?: string
          user_1_id?: string
          user_2_id?: string
          relevancy_score?: number
          created_at?: string
        }
      }
      prematches: {
        Row: {
          id: string
          user_id: string
          match_user_id: string
          relevancy_score: number
          created_at: string
          skipped: boolean
        }
        Insert: {
          id?: string
          user_id: string
          match_user_id: string
          relevancy_score: number
          created_at?: string
          skipped?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          match_user_id?: string
          relevancy_score?: number
          created_at?: string
          skipped?: boolean
        }
      }
      chats: {
        Row: {
          id: string
          match_id: string
          sender_id: string
          message: string
          created_at: string
        }
        Insert: {
          id?: string
          match_id: string
          sender_id: string
          message: string
          created_at?: string
        }
        Update: {
          id?: string
          match_id?: string
          sender_id?: string
          message?: string
          created_at?: string
        }
      }
    }
  }
} 