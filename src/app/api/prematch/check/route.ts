import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data: prematches, error } = await supabase
      .from('prematches')
      .select(`
        id,
        user_id,
        match_user_id,
        relevancy_score,
        users!prematches_user_id_fkey (name),
        users!prematches_match_user_id_fkey (name)
      `)
      .order('relevancy_score', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ prematches });
  } catch (error) {
    console.error('Failed to fetch prematches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prematches' },
      { status: 500 }
    );
  }
} 