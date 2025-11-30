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

export async function linkDonorProfileToUser({
  accessToken,
  donorId,
}: {
  accessToken: string | null | undefined;
  donorId: string;
}): Promise<{ success: boolean; message?: string }> {
  if (!accessToken) {
    return {
      success: false,
      message: 'সেশন শেষ হয়ে গেছে। অনুগ্রহ করে আবার লগইন করুন।',
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
      message: 'সেশন শেষ হয়ে গেছে। অনুগ্রহ করে আবার লগইন করুন।',
    };
  }

  const admin = supabaseAdminClient();

  // First, ensure the user profile exists in profiles table
  const { data: existingProfile, error: profileCheckError } = await admin
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (profileCheckError && profileCheckError.code !== 'PGRST116') {
    console.error('Failed to check profile', profileCheckError);
    return {
      success: false,
      message: 'প্রোফাইল যাচাই করতে সমস্যা হয়েছে।',
    };
  }

  // Create profile if it doesn't exist
  if (!existingProfile) {
    console.log('Creating user profile...', { userId: user.id });
    const { error: createProfileError } = await admin
      .from('profiles')
      .insert({
        id: user.id,
        role: 'donor',
      });

    if (createProfileError) {
      console.error('Failed to create profile', createProfileError);
      return {
        success: false,
        message: 'প্রোফাইল তৈরি করতে সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।',
      };
    }
    console.log('User profile created successfully');
  }

  // Check if donor exists and is not linked to another user
  const { data: donor, error: donorError } = await admin
    .from('donors')
    .select('id, user_id')
    .eq('id', donorId)
    .maybeSingle();

  if (donorError) {
    console.error('Failed to check donor', donorError);
    return {
      success: false,
      message: 'প্রোফাইল খুঁজে পাওয়া যায়নি।',
    };
  }

  if (!donor) {
    return {
      success: false,
      message: 'প্রোফাইল খুঁজে পাওয়া যায়নি।',
    };
  }

  if (donor.user_id && donor.user_id !== user.id) {
    console.error('Donor already linked to different user', { 
      donorUserId: donor.user_id, 
      currentUserId: user.id 
    });
    return {
      success: false,
      message: 'এই প্রোফাইলটি অন্য অ্যাকাউন্টের সাথে যুক্ত রয়েছে।',
    };
  }

  if (donor.user_id === user.id) {
    console.log('Donor already linked to current user');
    return {
      success: true,
      message: 'প্রোফাইল ইতিমধ্যে যুক্ত রয়েছে।',
    };
  }

  // Link the donor profile
  console.log('Attempting to link donor profile', { donorId, userId: user.id });
  const { error: updateError, data: updateData } = await admin
    .from('donors')
    .update({ user_id: user.id })
    .eq('id', donorId)
    .is('user_id', null)
    .select('id, user_id')
    .single();

  console.log('Link update result:', { 
    error: updateError?.message, 
    errorCode: updateError?.code,
    errorDetails: updateError?.details,
    hasData: !!updateData,
    updatedUserId: updateData?.user_id 
  });

  if (updateError) {
    console.error('Failed to link donor profile', updateError);
    return {
      success: false,
      message: `প্রোফাইল যুক্ত করতে সমস্যা হয়েছে: ${updateError.message || 'অজানা ত্রুটি'}`,
    };
  }

  if (!updateData || updateData.user_id !== user.id) {
    console.error('Link update did not set user_id correctly', { updateData });
    return {
      success: false,
      message: 'প্রোফাইল যুক্ত করা হয়েছে কিন্তু যাচাই করতে সমস্যা হয়েছে।',
    };
  }

  console.log('Donor profile successfully linked');
  return {
    success: true,
    message: 'প্রোফাইল সফলভাবে যুক্ত করা হয়েছে।',
  };
}

