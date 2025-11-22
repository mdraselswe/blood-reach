/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Database } from '@/types/database';
import { supabaseBrowserClient } from '@/lib/supabase-browser';
import { useAuth } from '@/components/auth/auth-provider';
import { DonorProfileForm } from '@/app/dashboard/donor/profile/profile-form';
import { ensureDonorProfileForCurrentUser } from '@/app/dashboard/donor/profile/actions';

type DonorProfile = Pick<
  Database['public']['Tables']['donors']['Row'],
  | 'id'
  | 'display_name'
  | 'blood_group'
  | 'phone_primary'
  | 'district'
  | 'area'
  | 'last_donation_at'
  | 'donation_count'
  | 'emergency_ready'
  | 'share_contact'
  | 'about'
  | 'institute'
>;

export default function DonorProfilePage() {
  const router = useRouter();
  const { user, loading, session } = useAuth();
  const [donor, setDonor] = useState<DonorProfile | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [linkMessage, setLinkMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login?redirectTo=/dashboard/donor/profile');
    }
  }, [loading, user]);

  useEffect(() => {
    const loadDonorProfile = async () => {
      if (!user) return;
      setIsFetching(true);
      setFetchError(null);
      setLinkMessage(null);

      const supabase = supabaseBrowserClient();
      const { data, error } = await supabase
        .from('donors')
        .select(
          'id, display_name, blood_group, phone_primary, district, area, last_donation_at, donation_count, emergency_ready, share_contact, about, institute',
        )
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        if (error.code === 'PGRST116') {
          // handled below
        } else {
          console.error('Failed to load donor profile', error);
          setFetchError('ডোনার প্রোফাইল লোড করতে সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।');
          setIsFetching(false);
          return;
        }
      }

      if (data) {
        setDonor(data as DonorProfile);
        setIsFetching(false);
        return;
      }

      // Attempt to auto-link existing donor profile by email
      const result = await ensureDonorProfileForCurrentUser({
        accessToken: session?.access_token,
      });

      if (result.message) {
        setLinkMessage(result.message);
      }

      if (result.success) {
        const { data: refetched, error: refetchError } = await supabase
          .from('donors')
          .select(
            'id, display_name, blood_group, phone_primary, district, area, last_donation_at, donation_count, emergency_ready, share_contact, about, institute',
          )
          .eq('user_id', user.id)
          .maybeSingle();

        if (!refetchError && refetched) {
          setDonor(refetched as DonorProfile);
        } else {
          if (refetchError) {
            console.error('Failed to reload donor profile after linking', refetchError);
            setFetchError('ডোনার প্রোফাইল লোড করতে সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।');
          }
          setDonor(null);
        }
      } else {
        setDonor(null);
      }

      setIsFetching(false);
    };

    if (user) {
      loadDonorProfile();
    }
  }, [user?.id, session?.access_token]);

  if (loading || (user && isFetching)) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-4xl items-center justify-center px-4">
        <p className="rounded-3xl border border-slate-100 bg-white/80 px-6 py-4 text-sm text-slate-500">
          ডোনার প্রোফাইল লোড হচ্ছে...
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-slate-900">ডোনার প্রোফাইল আপডেট</h1>
          <p className="text-sm text-slate-600">
            সর্বশেষ রক্তদানের তারিখ ও মোট ডোনেশনের সংখ্যা আপডেট রাখলে সার্চ তালিকায় আপনাকে দ্রুত খুঁজে পাওয়া যাবে।
          </p>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-primary hover:text-primary-600"
        >
          ← ড্যাশবোর্ডে ফিরে যান
        </Link>
      </div>

      {linkMessage ? (
        <div className="mb-6 rounded-3xl border border-emerald-100 bg-emerald-50/80 p-4 text-sm text-emerald-700">
          {linkMessage}
        </div>
      ) : null}

      {fetchError ? (
        <div className="rounded-3xl border border-rose-100 bg-rose-50/80 p-6 text-sm text-rose-700">{fetchError}</div>
      ) : donor ? (
        <DonorProfileForm
          donor={donor}
          onUpdated={(updates) =>
            setDonor((previous) => (previous ? { ...previous, ...updates } : previous))
          }
        />
      ) : (
        <div className="rounded-3xl border border-amber-100 bg-amber-50/80 p-6 text-sm text-amber-700">
          <p className="font-semibold">আপনার ডোনার প্রোফাইল খুঁজে পাওয়া যায়নি।</p>
          <p className="mt-2">
            আপনি যদি আগেই ডোনার হিসেবে নিবন্ধন করে থাকেন, অনুগ্রহ করে অ্যাডমিনের সাথে যোগাযোগ করুন অথবা নতুন করে{' '}
            <Link href="/donor-application" className="underline">
              ডোনার আবেদন
            </Link>{' '}
            জমা দিন।
          </p>
        </div>
      )}
    </div>
  );
}

