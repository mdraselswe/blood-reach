'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/auth-provider';
import { supabaseBrowserClient } from '@/lib/supabase-browser';
import { ensureDonorProfileForCurrentUser } from '@/app/dashboard/donor/profile/actions';
import type { Database } from '@/types/database';
import { cn } from '@/lib/utils';

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
  | 'department'
  | 'batch'
  | 'verified'
  | 'availability'
>;

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading, session } = useAuth();
  const [donor, setDonor] = useState<DonorProfile | null>(null);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login?redirectTo=/dashboard');
    }
  }, [loading, user, router]);

  useEffect(() => {
    const loadDonorProfile = async () => {
      if (!user || !session) {
        console.log('No user or session, skipping profile load');
        return;
      }
      setIsFetching(true);

      const supabase = supabaseBrowserClient();
      
      console.log('Loading donor profile for user:', { userId: user.id, email: user.email });
      
      // First try to find by user_id
      let { data, error } = await supabase
        .from('donors')
        .select(
          'id, display_name, blood_group, phone_primary, district, area, last_donation_at, donation_count, emergency_ready, share_contact, about, institute, department, batch, verified, availability',
        )
        .eq('user_id', user.id)
        .maybeSingle();

      console.log('Query by user_id result:', { hasData: !!data, error: error?.message, errorCode: error?.code });

      if (error && error.code !== 'PGRST116') {
        console.error('Failed to load donor profile', error);
      }

      // If not found by user_id, try to find by email or phone and link it
      if (!data) {
        console.log('Profile not found by user_id, trying email/phone matching...');
        // Try email-based matching first
        if (user.email) {
          console.log('Searching by email:', user.email);
          const emailMatch = await supabase
            .from('donors')
            .select(
              'id, display_name, blood_group, phone_primary, district, area, last_donation_at, donation_count, emergency_ready, share_contact, about, institute, department, batch, verified, availability, user_id, email',
            )
            .ilike('email', user.email)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          console.log('Email match result:', { 
            hasData: !!emailMatch.data, 
            error: emailMatch.error?.message,
            candidateUserId: emailMatch.data?.user_id,
            candidateEmail: emailMatch.data?.email 
          });

          if (!emailMatch.error && emailMatch.data) {
            const candidate = emailMatch.data;
            console.log('Email match candidate:', { 
              id: candidate.id, 
              name: candidate.display_name,
              userId: candidate.user_id,
              currentUserId: user.id 
            });
            
            // If not linked to any user, link it to current user
            if (!candidate.user_id) {
              console.log('Linking donor profile to user...');
              const linkResult = await supabase
                .from('donors')
                .update({ user_id: user.id })
                .eq('id', candidate.id)
                .is('user_id', null);

              console.log('Link result:', { 
                error: linkResult.error?.message, 
                errorCode: linkResult.error?.code,
                success: !linkResult.error 
              });

              if (!linkResult.error) {
                // Reload the profile
                console.log('Reloading profile after linking...');
                const reloadResult = await supabase
                  .from('donors')
                  .select(
                    'id, display_name, blood_group, phone_primary, district, area, last_donation_at, donation_count, emergency_ready, share_contact, about, institute, department, batch, verified, availability',
                  )
                  .eq('user_id', user.id)
                  .maybeSingle();

                console.log('Reload result:', { 
                  hasData: !!reloadResult.data, 
                  error: reloadResult.error?.message,
                  errorCode: reloadResult.error?.code 
                });

                if (!reloadResult.error && reloadResult.data) {
                  data = reloadResult.data;
                  console.log('Profile loaded successfully after linking');
                } else {
                  // If reload fails, use the candidate data directly
                  console.log('Reload failed, using candidate data directly');
                  data = {
                    id: candidate.id,
                    display_name: candidate.display_name,
                    blood_group: candidate.blood_group,
                    phone_primary: candidate.phone_primary,
                    district: candidate.district,
                    area: candidate.area,
                    last_donation_at: candidate.last_donation_at,
                    donation_count: candidate.donation_count,
                    emergency_ready: candidate.emergency_ready,
                    share_contact: candidate.share_contact,
                    about: candidate.about,
                    institute: candidate.institute,
                    department: candidate.department,
                    batch: candidate.batch,
                    verified: candidate.verified,
                    availability: candidate.availability,
                  };
                }
              } else {
                console.error('Failed to link donor profile:', linkResult.error);
                // Even if linking fails, use the candidate data
                data = {
                  id: candidate.id,
                  display_name: candidate.display_name,
                  blood_group: candidate.blood_group,
                  phone_primary: candidate.phone_primary,
                  district: candidate.district,
                  area: candidate.area,
                  last_donation_at: candidate.last_donation_at,
                  donation_count: candidate.donation_count,
                  emergency_ready: candidate.emergency_ready,
                  share_contact: candidate.share_contact,
                  about: candidate.about,
                  institute: candidate.institute,
                  department: candidate.department,
                  batch: candidate.batch,
                  verified: candidate.verified,
                  availability: candidate.availability,
                };
              }
            } else if (candidate.user_id === user.id) {
              // Already linked to this user, use the data
              console.log('Donor already linked to this user, using data');
              data = {
                id: candidate.id,
                display_name: candidate.display_name,
                blood_group: candidate.blood_group,
                phone_primary: candidate.phone_primary,
                district: candidate.district,
                area: candidate.area,
                last_donation_at: candidate.last_donation_at,
                donation_count: candidate.donation_count,
                emergency_ready: candidate.emergency_ready,
                share_contact: candidate.share_contact,
                about: candidate.about,
                institute: candidate.institute,
                department: candidate.department,
                batch: candidate.batch,
                verified: candidate.verified,
                availability: candidate.availability,
              };
            } else {
              console.log('Donor linked to different user:', candidate.user_id);
            }
          }
        }

        // If still not found, try phone number from user profile
        if (!data) {
          console.log('Trying phone number matching...');
          const profileResult = await supabase
            .from('profiles')
            .select('phone')
            .eq('id', user.id)
            .maybeSingle();

          console.log('Profile phone result:', { 
            hasPhone: !!profileResult.data?.phone, 
            phone: profileResult.data?.phone,
            error: profileResult.error?.message 
          });

          if (!profileResult.error && profileResult.data?.phone) {
            const phoneMatch = await supabase
              .from('donors')
              .select(
                'id, display_name, blood_group, phone_primary, district, area, last_donation_at, donation_count, emergency_ready, share_contact, about, institute, department, batch, verified, availability, user_id',
              )
              .eq('phone_primary', profileResult.data.phone)
              .is('user_id', null)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            console.log('Phone match result:', { 
              hasData: !!phoneMatch.data, 
              error: phoneMatch.error?.message,
              candidatePhone: phoneMatch.data?.phone_primary 
            });

            if (!phoneMatch.error && phoneMatch.data) {
              const candidate = phoneMatch.data;
              // Link this donor profile to current user
              const linkResult = await supabase
                .from('donors')
                .update({ user_id: user.id })
                .eq('id', candidate.id)
                .is('user_id', null);

              if (!linkResult.error) {
                // Reload the profile
                const reloadResult = await supabase
                  .from('donors')
                  .select(
                    'id, display_name, blood_group, phone_primary, district, area, last_donation_at, donation_count, emergency_ready, share_contact, about, institute, department, batch, verified, availability',
                  )
                  .eq('user_id', user.id)
                  .maybeSingle();

                if (!reloadResult.error && reloadResult.data) {
                  data = reloadResult.data;
                }
              }
            }
          }
        }

        // If still not found, try the server action for linking
        if (!data) {
          const linkResult = await ensureDonorProfileForCurrentUser({
            accessToken: session.access_token,
          });

          if (linkResult.success) {
            // Retry loading after linking
            const retryResult = await supabase
              .from('donors')
              .select(
                'id, display_name, blood_group, phone_primary, district, area, last_donation_at, donation_count, emergency_ready, share_contact, about, institute, department, batch, verified, availability',
              )
              .eq('user_id', user.id)
              .maybeSingle();

            if (!retryResult.error && retryResult.data) {
              data = retryResult.data;
            }
          }
        }
      }

      if (data) {
        console.log('Donor profile found and set:', { id: data.id, name: data.display_name });
        setDonor(data as DonorProfile);
      } else {
        console.log('No donor profile found after all attempts');
        // Try to find any donor with this email (for debugging)
        if (user.email) {
          const debugQuery = await supabase
            .from('donors')
            .select('id, display_name, email, user_id, phone_primary')
            .ilike('email', user.email)
            .limit(5);
          console.log('Debug: All donors with this email:', debugQuery.data);
        }
      }

      setIsFetching(false);
    };

    if (user && session) {
      loadDonorProfile();
    }
  }, [user?.id, session?.access_token]);

  const lastDonationText = useMemo(() => {
    if (!donor?.last_donation_at) return 'তথ্য নেই';
    const lastDate = new Date(donor.last_donation_at);
    if (Number.isNaN(lastDate.getTime())) return 'তথ্য নেই';
    const today = new Date();
    const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return 'আজই দান করেছেন';
    if (diffDays === 1) return '১ দিন আগে';
    if (diffDays < 30) return `${diffDays} দিন আগে`;
    if (diffDays < 365) return `${Math.round(diffDays / 30)} মাস আগে`;
    return `${Math.round(diffDays / 365)} বছর আগে`;
  }, [donor?.last_donation_at]);

  const isEligible = useMemo(() => {
    if (!donor?.last_donation_at) return true;
    const lastDate = new Date(donor.last_donation_at);
    if (Number.isNaN(lastDate.getTime())) return true;
    const today = new Date();
    const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 120; // 4 months
  }, [donor?.last_donation_at]);

  const locationLabel = useMemo(() => {
    if (!donor) return 'তথ্য নেই';
    if (donor.area && donor.district) {
      return `${donor.area}, ${donor.district}`;
    }
    return donor.district ?? 'তথ্য নেই';
  }, [donor]);

  if (loading || !user || isFetching) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-6xl items-center justify-center px-4">
        <p className="rounded-3xl border border-slate-100 bg-white/80 px-6 py-4 text-sm text-slate-500">
          ড্যাশবোর্ড লোড হচ্ছে...
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold text-slate-900">
          স্বাগতম, {donor?.display_name || user.email}
        </h1>
        <p className="text-sm text-slate-600">
          আপনার ডোনার প্রোফাইল আপডেট রাখুন এবং সাম্প্রতিক কার্যক্রম ট্র্যাক করুন।
        </p>
      </div>

      {donor ? (
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {/* Profile Summary Card */}
          <div className="lg:col-span-2 rounded-3xl border border-white bg-white/90 p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">ডোনার প্রোফাইল</h2>
                <p className="mt-1 text-sm text-slate-600">আপনার বর্তমান প্রোফাইল তথ্য</p>
              </div>
              <Link
                href="/dashboard/donor/profile"
                className="inline-flex items-center rounded-full border border-primary px-4 py-2 text-xs font-semibold text-primary-600 hover:bg-primary-50 transition"
              >
                আপডেট করুন
              </Link>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <dt className="text-xs font-semibold text-slate-500">ব্লাড গ্রুপ</dt>
                <dd className="flex items-center gap-2">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                    {donor.blood_group}
                  </span>
                  {donor.verified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                      ★ Verified
                    </span>
                  )}
                </dd>
              </div>

              <div className="space-y-1">
                <dt className="text-xs font-semibold text-slate-500">লোকেশন</dt>
                <dd className="text-sm font-medium text-slate-900">{locationLabel}</dd>
              </div>

              <div className="space-y-1">
                <dt className="text-xs font-semibold text-slate-500">সর্বশেষ দান</dt>
                <dd className="text-sm font-medium text-slate-900">{lastDonationText}</dd>
                {!isEligible && (
                  <p className="text-[10px] text-amber-600">৪ মাস অপেক্ষা করুন</p>
                )}
              </div>

              <div className="space-y-1">
                <dt className="text-xs font-semibold text-slate-500">মোট ডোনেশন</dt>
                <dd className="text-sm font-medium text-slate-900">
                  {donor.donation_count > 0 ? `${donor.donation_count} বার` : 'তথ্য নেই'}
                </dd>
              </div>

              {donor.institute && (
                <div className="space-y-1 sm:col-span-2">
                  <dt className="text-xs font-semibold text-slate-500">প্রতিষ্ঠান</dt>
                  <dd className="text-sm font-medium text-slate-900">
                    {donor.institute}
                    {donor.department && ` • ${donor.department}`}
                    {donor.batch && ` • Batch ${donor.batch}`}
                  </dd>
                </div>
              )}

              <div className="space-y-2 sm:col-span-2">
                <div className="flex flex-wrap gap-2">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold',
                      donor.availability === 'available'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700',
                    )}
                  >
                    {donor.availability === 'available' ? '🟢' : '⏳'}
                    {donor.availability === 'available' ? 'এখন Available' : 'শীঘ্রই Available'}
                  </span>
                  {donor.emergency_ready && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-[10px] font-semibold text-rose-700">
                      ⚡ Emergency Ready
                    </span>
                  )}
                  {donor.share_contact ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-1 text-[10px] font-semibold text-indigo-700">
                      📞 Contact Share
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">
                      🔒 Contact Private
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-white bg-white/90 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-800">দ্রুত কাজ</h2>
              <div className="mt-4 space-y-3">
                <Link
                  href="/dashboard/donor/profile"
                  className="block w-full rounded-2xl border border-primary bg-primary px-4 py-3 text-center text-sm font-semibold text-white shadow-sm hover:bg-primary-600 transition"
                >
                  প্রোফাইল আপডেট
                </Link>
                <Link
                  href="/dashboard/donor/stories"
                  className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  স্টোরি ম্যানেজ
                </Link>
              </div>
            </div>

            {/* Data Entry Reminder */}
            {(!donor.last_donation_at || !donor.donation_count || donor.donation_count === 0) && (
              <div className="rounded-3xl border border-amber-200 bg-amber-50/50 p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-amber-800">তথ্য আপডেট করুন</h3>
                <p className="mt-2 text-xs text-amber-700">
                  আপনার সর্বশেষ দানের তারিখ ও মোট ডোনেশন সংখ্যা আপডেট করুন যাতে সার্চ তালিকায় আপনাকে সঠিকভাবে দেখানো যায়।
                </p>
                <Link
                  href="/dashboard/donor/profile"
                  className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-700 transition"
                >
                  এখনই আপডেট করুন
                </Link>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-amber-200 bg-amber-50/50 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-amber-800">ডোনার প্রোফাইল নেই</h2>
            <p className="mt-2 text-sm text-amber-700">
              আপনার ডোনার প্রোফাইল এখনও তৈরি হয়নি। অনুগ্রহ করে ডোনার হিসেবে নিবন্ধন করুন।
            </p>
            <Link
              href="/donor-application"
              className="mt-4 inline-flex items-center justify-center rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-soft hover:bg-amber-700"
            >
              ডোনার আবেদন করুন
            </Link>
          </div>
          <div className="rounded-3xl border border-white bg-white/90 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800">স্টোরি প্রকাশ</h2>
            <p className="mt-2 text-sm text-slate-600">
              আপনার সাম্প্রতিক রক্তদান অভিজ্ঞতা শেয়ার করুন যাতে অন্যরা অনুপ্রেরণা পায়।
            </p>
            <Link
              href="/dashboard/donor/stories"
              className="mt-4 inline-flex items-center justify-center rounded-full border border-primary px-4 py-2 text-sm font-semibold text-primary-600 hover:bg-primary-50"
            >
              স্টোরি ম্যানেজ করুন
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
