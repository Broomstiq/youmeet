import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@/auth';
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
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's email from database
    const { data: user } = await supabase
      .from('users')
      .select('email')
      .eq('id', session.user.id)
      .single();

    if (!user?.email) {
      return NextResponse.json({ error: 'User email not found' }, { status: 404 });
    }

    // Generate a secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    // Store the reset token in Supabase
    const { error: tokenError } = await supabase
      .from('password_resets')
      .upsert({
        user_id: session.user.id,
        token: resetToken,
        expires_at: tokenExpiry.toISOString(),
        used: false
      });

    if (tokenError) throw tokenError;

    // Generate reset link with token
    const resetLink = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}`;
    
    // Send email using SendGrid
    await sendPasswordResetEmail(user.email, resetLink);

    return NextResponse.json({ 
      success: true,
      message: 'Password reset email sent successfully'
    });

  } catch (error: any) {
    console.error('Error requesting password reset:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to request password reset' },
      { status: 500 }
    );
  }
} 