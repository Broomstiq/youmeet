import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

interface User {
  email: string;
  id: string;
}

interface ResetData {
  user_id: string;
  users: User;
}

export async function POST(request: Request) {
  try {
    const { token, password, userId } = await request.json();

    console.log('Attempting password update for:', { userId, token });

    // First verify the token is valid and unused
    const { data: resetData, error: resetError } = await supabase
      .from('password_resets')
      .select(`
        user_id,
        users!inner (
          id,
          email
        )
      `)
      .eq('token', token)
      .eq('used', false)
      .eq('user_id', userId)
      .gt('expires_at', new Date().toISOString())
      .single() as { data: ResetData | null, error: any };

    if (resetError || !resetData) {
      console.error('Token verification failed:', resetError);
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    console.log('Reset data:', resetData);

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update the password in the database
    const { error: updateError } = await supabase
      .from('users')
      .update({ password_hash: hashedPassword })
      .eq('id', resetData.user_id);

    if (updateError) {
      console.error('Password update failed:', updateError);
      throw updateError;
    }

    console.log('Password updated successfully');

    // Mark the token as used
    const { error: tokenError } = await supabase
      .from('password_resets')
      .update({ used: true })
      .eq('token', token);

    if (tokenError) {
      console.error('Failed to mark token as used:', tokenError);
      // Don't throw here as password was already updated
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error updating password:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update password' },
      { status: 500 }
    );
  }
} 