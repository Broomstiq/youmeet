import { Database } from './database.types'

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Commonly used types
export type User = Tables<'users'>
export type Subscription = Tables<'subscriptions'>
export type Match = Tables<'matches'>
export type Prematch = Tables<'prematches'>
export type Chat = Tables<'chats'> 