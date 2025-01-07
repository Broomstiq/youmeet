import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { Database } from "../../../lib/database.types";

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json();
    
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const { data, error } = await supabase
      .from('users')
      .insert({
        email,
        password_hash: hashedPassword,
        name,
        birth_date: new Date().toISOString(),
      })
      .select('*')  // Make sure to select all fields
      .single();

    if (error) throw error;

    // Return user data without password_hash
    const { password_hash, ...userWithoutPassword } = data;
    return NextResponse.json({ 
      success: true, 
      user: userWithoutPassword 
    });
  } catch (error) {
    console.error('Error creating test user:', error);
    return NextResponse.json(
      { error: 'Failed to create test user' },
      { status: 500 }
    );
  }
} 