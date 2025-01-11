import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Additional sample channels as fallback
const sampleChannels = [
  { id: 'UC_x5XG1OV2P6uZZ5FSM9Ttw', name: 'Google Developers' },
  { id: 'UCsBjURrPoezykLs9EqgamOA', name: 'Fireship' },
  { id: 'UCW5YeuERMmlnqo4oq8vwUpg', name: 'The Net Ninja' },
  { id: 'UCvmINlrza7JHB1zkIOuXEbw', name: 'Ben Awad' },
  { id: 'UC8butISFwT-Wl7EV0hUK0BQ', name: 'freeCodeCamp' },
];

const targetUserId = 'c189d81a-8881-4832-8a62-b339dad00224';

// Sample profile pictures (you can add more)
const sampleProfilePics = [
  'https://i.pravatar.cc/300?img=1',
  'https://i.pravatar.cc/300?img=2',
  'https://i.pravatar.cc/300?img=3',
  'https://i.pravatar.cc/300?img=4',
  'https://i.pravatar.cc/300?img=5',
];

const sampleCities = [
  'Paris',
  'Lyon',
  'Marseille',
  'Bordeaux',
  'Toulouse',
  'Nantes',
  'Strasbourg',
  'Lille',
];

const generateRandomUser = async (index: number) => {
  const timestamp = Date.now();
  const hashedPassword = await bcrypt.hash('testpass123', 10);
  const randomCity = sampleCities[Math.floor(Math.random() * sampleCities.length)];
  const randomProfilePic = sampleProfilePics[Math.floor(Math.random() * sampleProfilePics.length)];
  
  return {
    email: `testprematch${index}_${timestamp}@example.com`,
    password_hash: hashedPassword,
    name: `Potential Match ${index}`,
    birth_date: new Date(1990 + Math.floor(Math.random() * 15), 
                       Math.floor(Math.random() * 12), 
                       Math.floor(Math.random() * 28)).toISOString(),
    city: randomCity,
    profile_picture: randomProfilePic,
    matching_param: Math.floor(Math.random() * 3) + 2,
    needs_onboarding: false,
    created_at: new Date().toISOString()
  };
};

async function seedUserPrematches() {
  try {
    console.log('Starting to seed prematches...');

    // 1. Fetch target user's subscriptions
    const { data: targetUserSubs, error: subsError } = await supabase
      .from('subscriptions')
      .select('channel_id, channel_name')
      .eq('user_id', targetUserId);

    if (subsError) throw subsError;

    if (!targetUserSubs || targetUserSubs.length === 0) {
      throw new Error('No subscriptions found for target user');
    }

    console.log(`Found ${targetUserSubs.length} subscriptions for target user`);

    // Clear existing prematches for the user
    const { error: deleteError } = await supabase
      .from('prematches')
      .delete()
      .eq('user_id', targetUserId);

    if (deleteError) throw deleteError;

    console.log('Cleared existing prematches');

    // 2. Create 10 potential matches with complete profiles
    const users = await Promise.all(
      Array.from({ length: 10 }, (_, i) => generateRandomUser(i + 1))
    );
    
    const { data: insertedUsers, error: insertError } = await supabase
      .from('users')
      .insert(users)
      .select();

    if (insertError) throw insertError;

    console.log(`Created ${insertedUsers.length} potential matches with complete profiles`);

    // 3. Create subscriptions for each user with overlapping channels
    for (const user of insertedUsers) {
      // Calculate how many common subscriptions this user should have
      const commonSubsCount = Math.floor(Math.random() * 6) + 3; // 3-8 common subs
      const uniqueSubsCount = Math.floor(Math.random() * 4) + 2; // 2-5 unique subs

      // Select random common subscriptions from target user's subs
      const shuffledCommonSubs = [...targetUserSubs].sort(() => 0.5 - Math.random());
      const selectedCommonSubs = shuffledCommonSubs.slice(0, commonSubsCount);

      // Select random unique subscriptions from sample channels
      const shuffledUniqueSubs = [...sampleChannels].sort(() => 0.5 - Math.random());
      const selectedUniqueSubs = shuffledUniqueSubs.slice(0, uniqueSubsCount);

      // Combine both sets of subscriptions
      const userSubscriptions = [
        ...selectedCommonSubs,
        ...selectedUniqueSubs.map(sub => ({
          channel_id: sub.id,
          channel_name: sub.name
        }))
      ];

      const { error: subError } = await supabase
        .from('subscriptions')
        .insert(userSubscriptions.map(sub => ({
          user_id: user.id,
          channel_id: sub.channel_id,
          channel_name: sub.channel_name
        })));

      if (subError) throw subError;
    }

    // 4. Create prematches with relevancy scores based on common subscription count
    const prematches = await Promise.all(insertedUsers.map(async (user) => {
      // Count common subscriptions
      const { data: commonSubs } = await supabase.rpc('get_common_subscriptions', {
        user_1_id: targetUserId,
        user_2_id: user.id
      });

      const commonCount = commonSubs?.length || 0;
      // Calculate relevancy score based on common subscriptions
      const relevancyScore = Math.min(50 + (commonCount * 5), 100);

      return {
        user_id: targetUserId,
        match_user_id: user.id,
        relevancy_score: relevancyScore,
        skipped: false
      };
    }));

    const { error: prematchError } = await supabase
      .from('prematches')
      .insert(prematches);

    if (prematchError) throw prematchError;

    console.log('Successfully created prematches!');
    console.log('\nPotential matches created with subscription overlap:');
    prematches.forEach((prematch, index) => {
      const user = insertedUsers[index];
      console.log(`- ${user.name} (ID: ${user.id})`);
      console.log(`  City: ${user.city}`);
      console.log(`  Relevancy Score: ${prematch.relevancy_score}`);
    });

  } catch (error) {
    console.error('Error seeding prematches:', error);
  }
}

// Run the seeding
seedUserPrematches(); 