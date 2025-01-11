import { Worker, Job } from 'bullmq';
import { redisConnection, QUEUES, redis } from './config';
import analyticsQueue from './analytics.queue';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const worker = new Worker(
  QUEUES.PREMATCH,
  async (job: Job) => {
    console.log('Starting prematch calculation...');

    // 1. Fetch all users and their subscriptions
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, matching_param');

    if (usersError) throw usersError;

    // 2. For each user, calculate potential matches
    for (const user of users) {
      // Get user's subscriptions
      const { data: userSubs } = await supabase
        .from('subscriptions')
        .select('channel_id, channel_name')
        .eq('user_id', user.id);

      if (!userSubs) continue;

      // Get existing prematches to avoid duplicates
      const { data: existingPrematches } = await supabase
        .from('prematches')
        .select('match_user_id')
        .eq('user_id', user.id);

      const existingMatchIds = new Set(existingPrematches?.map(m => m.match_user_id) || []);

      // Calculate matches for each other user
      for (const potentialMatch of users) {
        if (
          user.id === potentialMatch.id || // Skip self
          existingMatchIds.has(potentialMatch.id) // Skip existing prematches
        ) {
          continue;
        }

        // Get potential match's subscriptions
        const { data: matchSubs } = await supabase
          .from('subscriptions')
          .select('channel_id, channel_name')
          .eq('user_id', potentialMatch.id);

        if (!matchSubs) continue;

        // Calculate common subscriptions
        const commonSubs = userSubs.filter(sub1 =>
          matchSubs.some(sub2 => sub2.channel_id === sub1.channel_id)
        );

        // Check if they meet the matching criteria
        const requiredCommonSubs = Math.max(
          user.matching_param,
          potentialMatch.matching_param
        );

        if (commonSubs.length >= requiredCommonSubs) {
          // Create prematch record
          const prematchData = {
            user_id: user.id,
            match_user_id: potentialMatch.id,
            relevancy_score: commonSubs.length,
            created_at: new Date().toISOString(),
            skipped: false,
          };

          await supabase.from('prematches').insert([prematchData]);

          // Cache the common subscriptions in Redis
          const cacheKey = `prematch:${user.id}:${potentialMatch.id}`;
          await redis.set(
            cacheKey,
            JSON.stringify(commonSubs),
            'EX',
            60 * 60 * 24 // 24 hours
          );
        }
      }
    }

    console.log('Prematch calculation completed, queueing analytics...');
    
    // Queue analytics calculation
    await analyticsQueue.add('calculate-analytics', {});
    
    return { prematchCompleted: true, analyticsQueued: true };
  },
  { connection: redisConnection }
);

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed with error: ${err.message}`);
});

export default worker; 