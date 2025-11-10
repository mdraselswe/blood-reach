'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdminClient } from '@/lib/supabase-admin';

const getAllowedEmails = () => (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? '')
  .split(',')
  .map((item) => item.trim().toLowerCase())
  .filter(Boolean);

const isAuthorized = (email: string | null | undefined) => {
  if (!email) return false;
  const allowed = getAllowedEmails();
  if (!allowed.length) return false;
  return allowed.includes(email.toLowerCase());
};

type ActionResult = {
  success: boolean;
  message: string;
};

export async function toggleVerification({
  donorId,
  verify,
  adminEmail,
}: {
  donorId: string;
  verify: boolean;
  adminEmail: string | null;
}): Promise<ActionResult> {
  if (!isAuthorized(adminEmail)) {
    return { success: false, message: 'আপনি এই কাজটি করার অনুমতি পাননি।' };
  }

  const supabase = supabaseAdminClient();
  const { error } = await supabase
    .from('donors')
    .update({ verified: verify })
    .eq('id', donorId);

  if (error) {
    console.error('Failed to toggle verification', error);
    return { success: false, message: 'ভেরিফিকেশন আপডেট করা যায়নি।' };
  }

  revalidatePath('/dashboard/admin/donors');
  revalidatePath('/donors');
  return { success: true, message: verify ? 'ডোনার ভেরিফিকেশন সম্পন্ন হয়েছে।' : 'ভেরিফিকেশন বাতিল করা হয়েছে।' };
}

export async function toggleAvailability({
  donorId,
  availability,
  adminEmail,
}: {
  donorId: string;
  availability: 'available' | 'temporarily_unavailable' | 'not_available';
  adminEmail: string | null;
}): Promise<ActionResult> {
  if (!isAuthorized(adminEmail)) {
    return { success: false, message: 'আপনি এই কাজটি করার অনুমতি পাননি।' };
  }

  const supabase = supabaseAdminClient();
  const { error } = await supabase
    .from('donors')
    .update({ availability })
    .eq('id', donorId);

  if (error) {
    console.error('Failed to update availability', error);
    return { success: false, message: 'উপলভ্যতা আপডেট করা যায়নি।' };
  }

  revalidatePath('/dashboard/admin/donors');
  revalidatePath('/donors');
  return { success: true, message: 'উপলভ্যতা আপডেট হয়েছে।' };
}

export async function deleteDonor({ donorId, adminEmail }: { donorId: string; adminEmail: string | null }): Promise<ActionResult> {
  if (!isAuthorized(adminEmail)) {
    return { success: false, message: 'আপনি এই কাজটি করার অনুমতি পাননি।' };
  }

  const supabase = supabaseAdminClient();
  const { error } = await supabase.from('donors').delete().eq('id', donorId);

  if (error) {
    console.error('Failed to delete donor', error);
    return { success: false, message: 'ডোনার মুছতে সমস্যা হয়েছে।' };
  }

  revalidatePath('/dashboard/admin/donors');
  revalidatePath('/donors');
  return { success: true, message: 'ডোনার সফলভাবে মুছে ফেলা হয়েছে।' };
}
