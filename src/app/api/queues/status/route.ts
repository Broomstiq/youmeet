import { NextResponse } from 'next/server';
import prematchQueue from '../../../../queues/prematch.queue';
import analyticsQueue from '../../../../queues/analytics.queue';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const [prematchJobs, analyticsJobs] = await Promise.all([
      prematchQueue.getJobs(['waiting', 'active', 'completed', 'failed']),
      analyticsQueue.getJobs(['waiting', 'active', 'completed', 'failed'])
    ]);

    // Debug log for Supabase queries
    console.log('Fetching data from Supabase...');

    // Use the same query structure as in prematch/test/route.ts
    const [usersResult, prematchesResult] = await Promise.all([
      supabase
        .from('users')
        .select(`
          id,
          name,
          matching_param,
          subscriptions (
            channel_id,
            channel_name
          )
        `),
      supabase
        .from('prematches')
        .select(`
          *,
          users!prematches_user_id_fkey (name),
          users!prematches_match_user_id_fkey (name)
        `)
        .eq('skipped', false)
    ]);

    // Debug logs for query results
    console.log('Users query result:', usersResult);
    console.log('Prematches query result:', prematchesResult);

    if (usersResult.error) throw usersResult.error;
    if (prematchesResult.error) throw prematchesResult.error;

    // Process users data
    const users = usersResult.data.map(user => ({
      id: user.id,
      name: user.name,
      matching_param: user.matching_param,
      subscriptionCount: user.subscriptions?.length || 0,
      subscriptions: user.subscriptions || []
    }));

    // Process prematches data using the same structure as test route
    const prematches = prematchesResult.data?.map(prematch => ({
      id: prematch.id,
      user_id: prematch.user_id,
      match_user_id: prematch.match_user_id,
      relevancy_score: prematch.relevancy_score,
      created_at: prematch.created_at,
      user_name: prematch.users?.name,
      match_user_name: prematch.users?.name,
      commonSubscriptions: [] // You can add this calculation if needed
    })) || [];

    const formatJobs = (jobs: any[]) => {
      return jobs.map(job => ({
        id: job.id,
        name: job.name,
        state: job.state,
        timestamp: job.timestamp,
        failedReason: job.failedReason,
        returnvalue: job.returnvalue,
      }));
    };

    const status = {
      prematch: {
        waiting: prematchJobs.filter(job => job.state === 'waiting').length,
        active: prematchJobs.filter(job => job.state === 'active').length,
        completed: prematchJobs.filter(job => job.state === 'completed').length,
        failed: prematchJobs.filter(job => job.state === 'failed').length,
        recentJobs: formatJobs(prematchJobs.slice(0, 5)),
      },
      analytics: {
        waiting: analyticsJobs.filter(job => job.state === 'waiting').length,
        active: analyticsJobs.filter(job => job.state === 'active').length,
        completed: analyticsJobs.filter(job => job.state === 'completed').length,
        failed: analyticsJobs.filter(job => job.state === 'failed').length,
        recentJobs: formatJobs(analyticsJobs.slice(0, 5)),
      },
      users,
      prematches
    };

    return NextResponse.json(status);
  } catch (error) {
    console.error('Failed to fetch queue status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch queue status' },
      { status: 500 }
    );
  }
} 