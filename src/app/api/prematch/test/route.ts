import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // Fetch existing data with proper counts and relationships
    const [usersResult, prematchesCountResult, prematchesDataResult, analyticsResult, subscriptionsResult] = await Promise.all([
      supabase
        .from('users')
        .select(`
          *,
          subscriptions (
            channel_id,
            channel_name
          )
        `, { count: 'exact' }),
      // Separate count query for prematches
      supabase
        .from('prematches')
        .select('*', { count: 'exact', head: true })  // head: true for count only
        .eq('skipped', false),
      // Data query for prematches with joins
      supabase
        .from('prematches')
        .select(`
          *,
          users!prematches_user_id_fkey (name),
          users!prematches_match_user_id_fkey (name)
        `)
        .eq('skipped', false),
      supabase
        .from('analytics_snapshots')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(31),
      supabase
        .from('subscriptions')
        .select('*', { count: 'exact' }),
    ]);

    // Process users data to include subscription count
    const processedUsers = usersResult.data?.map(user => ({
      id: user.id,
      name: user.name,
      matching_param: user.matching_param,
      subscriptionCount: user.subscriptions?.length || 0,
      subscriptions: user.subscriptions || [],
    })) || [];

    // Process prematches data to include common subscriptions
    const processedPrematches = prematchesDataResult.data?.map(prematch => ({
      id: prematch.id,
      user_id: prematch.user_id,
      match_user_id: prematch.match_user_id,
      relevancy_score: prematch.relevancy_score,
      created_at: prematch.created_at,
      user_name: prematch.users?.name,
      match_user_name: prematch.users?.name,
      commonSubscriptions: [], // You would need to calculate this based on user subscriptions
    })) || [];

    // Format analytics data
    const currentAnalytics = analyticsResult.data?.[0] || null;
    const historicalAnalytics = analyticsResult.data?.slice(1) || [];

    const formattedHistorical = historicalAnalytics.map(snapshot => ({
      ...snapshot,
      timestamp: new Date(snapshot.timestamp).toISOString(),
      total_users: Number(snapshot.total_users),
      active_users_24h: Number(snapshot.active_users_24h),
      avg_subscriptions_per_user: Number(snapshot.avg_subscriptions_per_user),
      total_prematches: Number(snapshot.total_prematches),
      avg_prematches_per_user: Number(snapshot.avg_prematches_per_user),
      avg_relevancy_score: Number(snapshot.avg_relevancy_score),
      calculation_time_ms: Number(snapshot.calculation_time_ms),
      cache_hit_ratio: Number(snapshot.cache_hit_ratio),
      queue_length: Number(snapshot.queue_length),
      successful_matches_24h: Number(snapshot.successful_matches_24h),
      skip_ratio_24h: Number(snapshot.skip_ratio_24h),
      prematch_distribution: snapshot.prematch_distribution || {},
      popular_channels: Array.isArray(snapshot.popular_channels) 
        ? snapshot.popular_channels 
        : [],
      matching_param_distribution: snapshot.matching_param_distribution || {},
    }));

    const formattedCurrent = currentAnalytics ? {
      ...currentAnalytics,
      timestamp: new Date(currentAnalytics.timestamp).toISOString(),
      total_users: Number(currentAnalytics.total_users),
      active_users_24h: Number(currentAnalytics.active_users_24h),
      avg_subscriptions_per_user: Number(currentAnalytics.avg_subscriptions_per_user),
      total_prematches: Number(currentAnalytics.total_prematches),
      avg_prematches_per_user: Number(currentAnalytics.avg_prematches_per_user),
      avg_relevancy_score: Number(currentAnalytics.avg_relevancy_score),
      calculation_time_ms: Number(currentAnalytics.calculation_time_ms),
      cache_hit_ratio: Number(currentAnalytics.cache_hit_ratio),
      queue_length: Number(currentAnalytics.queue_length),
      successful_matches_24h: Number(currentAnalytics.successful_matches_24h),
      skip_ratio_24h: Number(currentAnalytics.skip_ratio_24h),
      prematch_distribution: currentAnalytics.prematch_distribution || {},
      popular_channels: Array.isArray(currentAnalytics.popular_channels) 
        ? currentAnalytics.popular_channels 
        : [],
      matching_param_distribution: currentAnalytics.matching_param_distribution || {},
    } : null;

    // Debug logs
    console.log('Users:', processedUsers);
    console.log('Prematches:', processedPrematches);
    console.log('Current Analytics:', formattedCurrent);
    console.log('Historical Analytics:', formattedHistorical);

    // Debug logs for counts
    console.log('Counts:', {
      users: usersResult.count,
      prematches: prematchesCountResult.count,  // Use the count from the separate query
      subscriptions: subscriptionsResult.count
    });

    return NextResponse.json({
      summary: {
        totalUsers: usersResult.count || 0,
        totalSubscriptions: subscriptionsResult.count || 0,
        totalPrematches: prematchesCountResult.count || 0,  // Use the count from the separate query
      },
      users: processedUsers,
      prematches: processedPrematches,
      redis: {
        status: 'connected',
        sampleCacheData: 'sample data',
      },
      analytics: {
        current: formattedCurrent,
        historical: formattedHistorical,
      },
    });
  } catch (error) {
    console.error('Error fetching test data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch test data' },
      { status: 500 }
    );
  }
} 