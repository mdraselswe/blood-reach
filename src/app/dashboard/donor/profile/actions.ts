'use server';

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { supabaseAdminClient } from '@/lib/supabase-admin';

export type EnsureDonorResult = {
  success: boolean;
  linked: boolean;
  message?: string;
};

const getSupabaseClientForToken = (accessToken: string) => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error('Missing Supabase environment variables for ensureDonorProfileForCurrentUser.');
  }

  return createClient<Database>(url, anonKey, {
    auth: {
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
};

export async function ensureDonorProfileForCurrentUser({
  accessToken,
}: {
  accessToken: string | null | undefined;
}): Promise<EnsureDonorResult> {
  if (!accessToken) {
    return {
      success: false,
      linked: false,
      message: 'গল্প লিখতে হলে আগে সাইন ইন করুন।',
    };
  }

  const supabase = getSupabaseClientForToken(accessToken);
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      linked: false,
      message: 'গল্প লিখতে হলে আগে সাইন ইন করুন।',
    };
  }

  const admin = supabaseAdminClient();

  const { data: existingDonor, error: existingError } = await admin
    .from('donors')
    .select('id, user_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!existingError && existingDonor) {
    return {
      success: true,
      linked: false,
      message: undefined,
    };
  }

  const email = user.email?.toLowerCase();
  if (!email) {
    return {
      success: false,
      linked: false,
      message: 'আপনার অ্যাকাউন্টে ইমেইল পাওয়া যায়নি। অনুগ্রহ করে অ্যাডমিনের সাথে যোগাযোগ করুন।',
    };
  }

  const { data: candidate, error: candidateError } = await admin
    .from('donors')
    .select('id, user_id, email')
    .ilike('email', email)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (candidateError) {
    console.error('Failed to lookup donor by email', candidateError);
    return {
      success: false,
      linked: false,
      message: 'ডোনার প্রোফাইল খুঁজতে গিয়ে সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।',
    };
  }

  if (!candidate) {
    return {
      success: false,
      linked: false,
      message: 'আপনার ইমেইল দিয়ে কোন ডোনার আবেদন পাওয়া যায়নি।',
    };
  }

  if (candidate.user_id && candidate.user_id !== user.id) {
    return {
      success: false,
      linked: false,
      message: 'এই ডোনার প্রোফাইলটি আগে থেকেই অন্য একটি অ্যাকাউন্টের সাথে যুক্ত রয়েছে।',
    };
  }

  const { error: updateError } = await admin
    .from('donors')
    .update({ user_id: user.id })
    .eq('id', candidate.id)
    .is('user_id', null);

  if (updateError) {
    console.error('Failed to link donor profile to user', updateError);
    return {
      success: false,
      linked: false,
      message: 'ডোনার প্রোফাইল অ্যাকাউন্টের সাথে যুক্ত করতে সমস্যা হয়েছে।',
    };
  }

  return {
    success: true,
    linked: true,
    message: 'আপনার পূর্বের ডোনার আবেদনটি এই অ্যাকাউন্টের সাথে যুক্ত করা হয়েছে।',
  };
}

