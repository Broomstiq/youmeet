import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { user1Id, user2Id } = await request.json()

    // Create a match between the two users
    const { data: match, error } = await supabase
      .from('matches')
      .insert({
        user_1_id: user1Id,
        user_2_id: user2Id,
        relevancy_score: 5  // Test score
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ match })
  } catch (error) {
    console.error('Error creating test match:', error)
    return NextResponse.json({ error: 'Failed to create match' }, { status: 500 })
  }
} 