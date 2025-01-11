import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Sample YouTube channels that might be common among users
const sampleChannels = [
  { id: 'UC_x5XG1OV2P6uZZ5FSM9Ttw', name: 'Google Developers' },
  { id: 'UCsBjURrPoezykLs9EqgamOA', name: 'Fireship' },
  { id: 'UCW5YeuERMmlnqo4oq8vwUpg', name: 'The Net Ninja' },
  { id: 'UCvmINlrza7JHB1zkIOuXEbw', name: 'Ben Awad' },
  { id: 'UC8butISFwT-Wl7EV0hUK0BQ', name: 'freeCodeCamp' },
  { id: 'UCFbNIlppjAuEX4znoulh0Cw', name: 'Web Dev Simplified' },
  { id: 'UClb90NQQcskPUGDIXsQEz5Q', name: 'Dev Ed' },
  { id: 'UCmXmlB4-HJytD7wek0Uo97A', name: 'JavaScript Mastery' },
  { id: 'UC-T8W79DN6PBnzomelvqJYw', name: 'Academy' },
  { id: 'UC29ju8bIPH5as8OGnQzwJyA', name: 'Traversy Media' },
];

const generateRandomUser = (index: number) => ({
  email: `testuser${index}@example.com`,
  name: `Test User ${index}`,
  birth_date: new Date(1990 + Math.floor(Math.random() * 15), 
                       Math.floor(Math.random() * 12), 
                       Math.floor(Math.random() * 28)).toISOString(),
  matching_param: Math.floor(Math.random() * 3) + 2, // Random number between 2-4
  needs_onboarding: false
});

const assignRandomSubscriptions = (userId: string) => {
  // Randomly select 4-8 channels for each user
  const numSubscriptions = Math.floor(Math.random() * 5) + 4;
  const shuffled = [...sampleChannels].sort(() => 0.5 - Math.random());
  const selectedChannels = shuffled.slice(0, numSubscriptions);

  return selectedChannels.map(channel => ({
    user_id: userId,
    channel_id: channel.id,
    channel_name: channel.name,
    created_at: new Date().toISOString()
  }));
};

async function seedTestData() {
  try {
    console.log('Starting to seed test data...');

    // Create 10 test users
    const users = Array.from({ length: 10 }, (_, i) => generateRandomUser(i + 1));
    
    // Insert users
    const { data: insertedUsers, error: userError } = await supabase
      .from('users')
      .insert(users)
      .select();

    if (userError) {
      throw userError;
    }

    console.log(`Created ${insertedUsers.length} test users`);

    // Insert subscriptions for each user
    for (const user of insertedUsers) {
      const subscriptions = assignRandomSubscriptions(user.id);
      const { error: subError } = await supabase
        .from('subscriptions')
        .insert(subscriptions);

      if (subError) {
        throw subError;
      }
    }

    console.log('Successfully seeded test data!');
    
    // Print test users for reference
    console.log('\nTest Users Created:');
    insertedUsers.forEach(user => {
      console.log(`- ${user.name} (ID: ${user.id})`);
    });

  } catch (error) {
    console.error('Error seeding test data:', error);
  }
}

// Run the seeding
seedTestData(); 