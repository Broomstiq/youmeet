import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendPasswordResetEmail } from '@/lib/email-service';
import crypto from 'crypto';

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

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Get user from database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single();

    if (userError || !user) {
      // Don't reveal if user exists or not for security
      return NextResponse.json({ 
        success: true,
        message: 'If an account exists with this email, a password reset link will be sent.'
      });
    }

    // First, invalidate any existing unused tokens for this user
    await supabase
      .from('password_resets')
      .update({ used: true })
      .eq('user_id', user.id)
      .eq('used', false);

    // Generate a secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    // Store the reset token in Supabase
    const { error: tokenError } = await supabase
      .from('password_resets')
      .insert({
        user_id: user.id,
        token: resetToken,
        expires_at: tokenExpiry.toISOString(),
        used: false
      });

    if (tokenError) {
      console.error('Error storing reset token:', tokenError);
      throw tokenError;
    }

    // Generate reset link with token
    const resetLink = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}`;
    
    // Send email using SendGrid
    await sendPasswordResetEmail(user.email, resetLink);

    return NextResponse.json({ 
      success: true,
      message: 'If an account exists with this email, a password reset link will be sent.'
    });

  } catch (error: any) {
    console.error('Error requesting password reset:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to request password reset' },
      { status: 500 }
    );
  }
} 