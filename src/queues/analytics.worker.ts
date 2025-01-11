import { Worker, Job } from 'bullmq';
import { redisConnection, QUEUES, redis } from './config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const worker = new Worker(
  QUEUES.ANALYTICS,
  async (job: Job) => {
    console.log('Starting analytics calculation...');
    const startTime = Date.now();
    
    // Fetch required data
    const [
      { count: totalUsers },
      { data: activeUsers },
      { data: subscriptions },
      { data: prematches },
      { data: matches24h },
      { data: skippedPrematches24h },
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      
      supabase.from('users')
        .select('id')
        .or(`
          id.in.(select sender_id from chats where created_at > now() - interval '24 hours'),
          id.in.(select user_1_id from matches where created_at > now() - interval '24 hours'),
          id.in.(select user_2_id from matches where created_at > now() - interval '24 hours')
        `),
      
      supabase.from('subscriptions').select('*'),
      supabase.from('prematches').select('*'),
      
      supabase.from('matches')
        .select('*')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      
      supabase.from('prematches')
        .select('*')
        .eq('skipped', true)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
    ]);

    // Calculate metrics
    const active_users_24h = activeUsers?.length || 0;
    const avg_subscriptions_per_user = totalUsers ? (subscriptions?.length || 0) / totalUsers : 0;
    const total_prematches = prematches?.length || 0;
    const avg_prematches_per_user = totalUsers ? total_prematches / totalUsers : 0;
    const successful_matches_24h = matches24h?.length || 0;
    const skip_ratio_24h = successful_matches_24h ? 
      (skippedPrematches24h?.length || 0) / successful_matches_24h : 0;

    // Calculate distributions
    const prematch_distribution = prematches?.reduce((acc: Record<number, number>, match) => {
      acc[match.relevancy_score] = (acc[match.relevancy_score] || 0) + 1;
      return acc;
    }, {});

    // Calculate popular channels
    const channelCounts = subscriptions?.reduce((acc: Record<string, number>, sub) => {
      acc[sub.channel_id] = (acc[sub.channel_id] || 0) + 1;
      return acc;
    }, {});

    const popular_channels = Object.entries(channelCounts || {})
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([channel_id, count]) => ({
        channel_id,
        count,
        channel_name: subscriptions?.find(s => s.channel_id === channel_id)?.channel_name
      }));

    // Calculate matching parameter distribution
    const { data: users } = await supabase.from('users').select('matching_param');
    const matching_param_distribution = users?.reduce((acc: Record<number, number>, user) => {
      acc[user.matching_param] = (acc[user.matching_param] || 0) + 1;
      return acc;
    }, {});

    // Get cache metrics
    const [cacheHits, cacheMisses] = await Promise.all([
      redis.get('prematch_cache_hits'),
      redis.get('prematch_cache_misses')
    ]);
    
    const total_hits = parseInt(cacheHits || '0');
    const total_misses = parseInt(cacheMisses || '0');
    const total_requests = total_hits + total_misses;
    const cache_hit_ratio = total_requests ? total_hits / total_requests : 0;

    // Get current queue length
    const queue_length = await redis.llen(QUEUES.PREMATCH);

    // Calculate average relevancy score
    const avg_relevancy_score = prematches?.reduce((sum, match) => 
      sum + match.relevancy_score, 0) / (prematches?.length || 1);

    // Create analytics snapshot
    const analyticsData = {
      timestamp: new Date().toISOString(),
      total_users: totalUsers || 0,
      active_users_24h,
      avg_subscriptions_per_user,
      total_prematches,
      avg_prematches_per_user,
      avg_relevancy_score,
      prematch_distribution,
      calculation_time_ms: Date.now() - startTime,
      cache_hit_ratio,
      queue_length,
      successful_matches_24h,
      skip_ratio_24h,
      popular_channels,
      matching_param_distribution,
    };

    // Store analytics snapshot
    const { error } = await supabase
      .from('analytics_snapshots')
      .insert([analyticsData]);

    if (error) throw error;

    console.log('Analytics calculation completed');
    return analyticsData;
  },
  { connection: redisConnection }
);

worker.on('completed', (job) => {
  console.log(`Analytics job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`Analytics job ${job?.id} failed with error: ${err.message}`);
});

export default worker; 