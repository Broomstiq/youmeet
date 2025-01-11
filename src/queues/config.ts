import { ConnectionOptions } from 'bullmq';
import Redis from 'ioredis';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

console.log('Redis URL:', process.env.UPSTASH_REDIS_URL);

if (!process.env.UPSTASH_REDIS_URL) {
  throw new Error('Upstash Redis configuration is missing');
}

// Create a shared Redis instance
export const redis = new Redis(process.env.UPSTASH_REDIS_URL);

// BullMQ connection configuration
export const redisConnection: ConnectionOptions = {
  host: redis.options.host!,
  port: redis.options.port!,
  username: redis.options.username,
  password: redis.options.password,
  tls: redis.options.tls
};

export const QUEUES = {
  PREMATCH: 'prematch-queue',
  ANALYTICS: 'analytics-queue',
} as const; 