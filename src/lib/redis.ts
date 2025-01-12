import { Redis } from '@upstash/redis'

// Only create Redis client if environment variables are available
const getRedisClient = () => {
  if (typeof window === 'undefined') {
    // Server-side
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      console.error('Redis environment variables are missing')
      return null
    }
    return new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  } else {
    // Client-side
    if (!process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_URL || !process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_TOKEN) {
      console.error('Redis environment variables are missing')
      return null
    }
    return new Redis({
      url: process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_URL,
      token: process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_TOKEN,
    })
  }
}

export const redis = getRedisClient()

// Cache keys
export const CACHE_KEYS = {
  chatList: (userId: string) => `chat:list:${userId}`,
  chatMessages: (matchId: string) => `chat:messages:${matchId}`,
  matchDetails: (matchId: string) => `match:details:${matchId}`,
}

// Cache TTL in seconds
export const CACHE_TTL = {
  chatList: 60 * 5, // 5 minutes
  chatMessages: 60 * 15, // 15 minutes
  matchDetails: 60 * 30, // 30 minutes
} 