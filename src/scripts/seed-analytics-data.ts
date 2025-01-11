import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Note: Using service role key like in seed-test-data.ts
);

const generateHistoricalData = (daysBack: number) => {
  const data = [];
  const now = new Date();

  for (let i = daysBack; i >= 0; i--) {
    const timestamp = new Date(now);
    timestamp.setDate(now.getDate() - i);

    // Generate some realistic-looking data with slight variations
    const baseUsers = 100 + Math.floor(Math.random() * 50);
    const activeUsers = Math.floor(baseUsers * (0.3 + Math.random() * 0.4));

    data.push({
      timestamp: timestamp.toISOString(),
      total_users: baseUsers,
      active_users_24h: activeUsers,
      avg_subscriptions_per_user: 15 + Math.random() * 10,
      total_prematches: baseUsers * 3 + Math.floor(Math.random() * 100),
      avg_prematches_per_user: 3 + Math.random() * 2,
      avg_relevancy_score: 65 + Math.random() * 20,
      prematch_distribution: {
        '0-20': Math.floor(Math.random() * 10),
        '21-40': Math.floor(Math.random() * 20),
        '41-60': Math.floor(Math.random() * 30),
        '61-80': Math.floor(Math.random() * 40),
        '81-100': Math.floor(Math.random() * 20),
      },
      calculation_time_ms: 1000 + Math.floor(Math.random() * 2000),
      cache_hit_ratio: 0.7 + Math.random() * 0.2,
      queue_length: Math.floor(Math.random() * 10),
      successful_matches_24h: Math.floor(activeUsers * 0.3),
      skip_ratio_24h: 0.4 + Math.random() * 0.3,
      popular_channels: [
        {
          channel_id: 'UC1',
          channel_name: 'Tech Channel',
          count: 50 + Math.floor(Math.random() * 30),
        },
        {
          channel_id: 'UC2',
          channel_name: 'Gaming Channel',
          count: 40 + Math.floor(Math.random() * 25),
        },
        {
          channel_id: 'UC3',
          channel_name: 'Music Channel',
          count: 30 + Math.floor(Math.random() * 20),
        },
        {
          channel_id: 'UC4',
          channel_name: 'Education Channel',
          count: 25 + Math.floor(Math.random() * 15),
        },
        {
          channel_id: 'UC5',
          channel_name: 'Entertainment Channel',
          count: 20 + Math.floor(Math.random() * 10),
        },
      ],
      matching_param_distribution: {
        '1': Math.floor(Math.random() * 10),
        '2': Math.floor(Math.random() * 20),
        '3': Math.floor(Math.random() * 40),
        '4': Math.floor(Math.random() * 20),
        '5+': Math.floor(Math.random() * 10),
      },
    });
  }
  return data;
};

async function seedAnalyticsData() {
  try {
    console.log('Starting to seed analytics data...');

    // Generate 30 days of historical data
    const analyticsData = generateHistoricalData(30);

    // Insert data into analytics_snapshots table
    const { data, error } = await supabase
      .from('analytics_snapshots')
      .insert(analyticsData);

    if (error) {
      throw error;
    }

    console.log(`Successfully seeded ${analyticsData.length} analytics snapshots`);
    
  } catch (error) {
    console.error('Error seeding analytics data:', error);
  }
}

// Run the seeding
seedAnalyticsData(); 