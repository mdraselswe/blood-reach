'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdminClient } from '@/lib/supabase-admin';

const getAllowedEmails = () =>
  (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? '')
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

export async function deleteStory({
  storyId,
  adminEmail,
}: {
  storyId: string;
  adminEmail: string | null;
}): Promise<ActionResult> {
  if (!isAuthorized(adminEmail)) {
    return { success: false, message: 'আপনি এই কাজটি করার অনুমতি পাননি।' };
  }

  const supabase = supabaseAdminClient();
  const { error } = await supabase.from('donation_posts').delete().eq('id', storyId);

  if (error) {
    console.error('Failed to delete story', error);
    return { success: false, message: 'স্টোরি মুছতে সমস্যা হয়েছে।' };
  }

  revalidatePath('/dashboard/admin/stories');
  revalidatePath('/stories');
  return { success: true, message: 'স্টোরিটি সফলভাবে মুছে ফেলা হয়েছে।' };
}

