import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  try {
    // Get prematches with proper table alias
    const { data: prematches, error: prematchesError } = await supabase
      .from('prematches_users_1 as p1')
      .select(`
        *,
        user1:users!prematches_users_1_user1_id_fkey(*),
        user2:users!prematches_users_1_user2_id_fkey(*)
      `);

    if (prematchesError) {
      console.error('Error fetching prematches:', prematchesError);
      return NextResponse.json(
        { error: 'Failed to fetch prematches' },
        { status: 500 }
      );
    }

    return NextResponse.json({ prematches });
    
  } catch (error: any) {
    console.error('Error in prematches route:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 