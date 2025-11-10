'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { supabaseAdminClient } from '@/lib/supabase-admin';
import { supabaseServerClient } from '@/lib/supabase-server';
import type { Database } from '@/types/database';

const donorSchema = z.object({
  display_name: z.string().min(3, 'নাম কমপক্ষে ৩ অক্ষরের হওয়া প্রয়োজন'),
  blood_group: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
  phone_primary: z
    .string()
    .min(10, 'বৈধ ফোন নম্বর লিখুন')
    .regex(/^[0-9+\-\s]+$/, 'শুধুমাত্র সংখ্যা এবং + চিহ্ন ব্যবহার করুন'),
  district: z.string().min(2, 'জেলার নাম লিখুন'),
  area: z.string().min(2, 'এলাকার নাম লিখুন'),
  email: z.string().email('বৈধ ইমেল লিখুন').optional().or(z.literal('')),
  emergency_ready: z.boolean().optional(),
  note: z.string().max(400).optional(),
  last_donation_at: z
    .string()
    .optional()
    .refine((value) => !value || !Number.isNaN(Date.parse(value)), 'বৈধ তারিখ নির্বাচন করুন'),
  donation_count: z
    .union([z.string(), z.number()])
    .optional()
    .transform((value) => {
      if (value === undefined || value === null || value === '') return undefined;
      const parsed = Number(value);
      if (Number.isNaN(parsed)) return undefined;
      return Math.min(200, Math.max(0, Math.floor(parsed)));
    }),
});

export async function registerDonor(formData: FormData) {
  const rawBloodGroup = formData.get('blood_group');
  const result = donorSchema.safeParse({
    display_name: formData.get('display_name')?.toString().trim(),
    blood_group: rawBloodGroup?.toString(),
    phone_primary: formData.get('phone_primary')?.toString().trim(),
    district: formData.get('district')?.toString().trim(),
    area: formData.get('area')?.toString().trim(),
    email: formData.get('email')?.toString().trim(),
    emergency_ready: formData.get('emergency_ready') === 'on',
    note: formData.get('note')?.toString().trim(),
    last_donation_at: formData.get('last_donation_at')?.toString(),
    donation_count: formData.get('donation_count')?.toString(),
  });

  if (!result.success) {
    return {
      success: false,
      errors: result.error.flatten().fieldErrors,
    } as const;
  }

  const payload = result.data;

  try {
    const supabase = supabaseAdminClient();
    const authClient = supabaseServerClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();
    const ip = headers().get('x-forwarded-for') ?? headers().get('x-real-ip');

    const insertPayload: Database['public']['Tables']['donors']['Insert'] = {
      display_name: payload.display_name,
      blood_group: payload.blood_group,
      phone_primary: payload.phone_primary,
      district: payload.district,
      area: payload.area,
      email: payload.email || null,
      emergency_ready: Boolean(payload.emergency_ready),
      about: payload.note,
      share_contact: true,
      verified: false,
      tags: payload.emergency_ready ? ['emergency-ready'] : [],
      response_rate: '0',
      last_donation_at: payload.last_donation_at ?? null,
      donation_count: payload.donation_count ?? 0,
    };

    if (user?.id) {
      insertPayload.user_id = user.id;
    }

    const { error } = await supabase.from('donors').insert(insertPayload);

    if (error) {
      console.error('Failed to create donor record', error);
      return {
        success: false,
        message:
          error.message ??
          'রেজিস্টার করতে সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।',
      } as const;
    }

    await supabase
      .from('audit_logs')
      .insert({
        action: 'donor.register_public',
        resource_type: 'donor',
        metadata: { ip },
      })
      .select()
      .single();

    revalidatePath('/donors');
    revalidatePath('/');

    return {
      success: true,
      message: 'আপনার আবেদনটি গ্রহণ করা হয়েছে! ভেরিফিকেশনের জন্য আমাদের টিম শীঘ্রই যোগাযোগ করবে।',
    } as const;
  } catch (error) {
    console.error('Unexpected error creating donor', error);
    return {
      success: false,
      message: 'সার্ভার ত্রুটির কারণে রেজিস্টার করা যায়নি।',
    } as const;
  }
}
