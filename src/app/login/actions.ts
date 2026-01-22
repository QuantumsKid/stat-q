'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  console.log('[login action] Attempting login for email:', email);

  if (!email || !password) {
    console.log('[login action] Email or password missing');
    return { error: 'Email and password are required' };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('[login action] Supabase signInWithPassword error:', error.message);
    return { error: error.message };
  }

  console.log('[login action] Login successful, revalidating path and redirecting to /');
  revalidatePath('/', 'layout');
  redirect('/');
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  console.log('[signup action] Attempting signup for email:', email);

  if (!email || !password) {
    console.log('[signup action] Email or password missing');
    return { error: 'Email and password are required' };
  }

  if (password.length < 6) {
    console.log('[signup action] Password too short');
    return { error: 'Password must be at least 6 characters' };
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    console.error('[signup action] Supabase signUp error:', error.message);
    return { error: error.message };
  }

  console.log('[signup action] Signup successful, revalidating path and redirecting to /');
  revalidatePath('/', 'layout');
  redirect('/');
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  console.log('[logout action] User logged out, revalidating path and redirecting to /login');
  revalidatePath('/', 'layout');
  redirect('/login');
}
