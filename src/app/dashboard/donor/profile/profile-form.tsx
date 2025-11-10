'use client';

import type { Database } from '@/types/database';
import { useMemo, useState, useTransition } from 'react';
import { supabaseBrowserClient } from '@/lib/supabase-browser';

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
>;

type Props = {
  donor: DonorProfile;
  onUpdated?: (updates: Partial<DonorProfile>) => void;
};

const inputDate = (value: string | null) => {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function DonorProfileForm({ donor, onUpdated }: Props) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const locationLabel = useMemo(() => {
    if (donor.area && donor.district) {
      return `${donor.area}, ${donor.district}`;
    }
    return donor.district ?? 'লোকেশন নিশ্চিত নয়';
  }, [donor.area, donor.district]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setErrorMessage(null);
    setFieldErrors({});

    startTransition(async () => {
      const supabase = supabaseBrowserClient();
      const formData = new FormData(event.currentTarget);

      const lastDonationAtRaw = formData.get('last_donation_at')?.toString() ?? '';
      const donationCountRaw = formData.get('donation_count')?.toString() ?? '';
      const emergencyReady = formData.get('emergency_ready') === 'on';
      const shareContact = formData.get('share_contact') === 'on';
      const about = formData.get('about')?.toString() ?? '';

      const updates: Record<string, unknown> = {
        emergency_ready: emergencyReady,
        share_contact: shareContact,
      };

      updates.about = about.trim().length ? about.trim() : null;

      let nextLastDonationAt: string | null = donor.last_donation_at;
      if (lastDonationAtRaw) {
        const parsedDate = new Date(lastDonationAtRaw);
        if (Number.isNaN(parsedDate.getTime())) {
          setFieldErrors({ last_donation_at: ['বৈধ তারিখ দিন'] });
          return;
        }
        const iso = parsedDate.toISOString();
        updates.last_donation_at = iso;
        nextLastDonationAt = iso;
      } else {
        updates.last_donation_at = null;
        nextLastDonationAt = null;
      }

      let nextDonationCount = donor.donation_count ?? 0;
      if (donationCountRaw) {
        const parsedCount = Number(donationCountRaw);
        if (Number.isNaN(parsedCount) || parsedCount < 0) {
          setFieldErrors({ donation_count: ['০ বা তার বেশি সংখ্যা দিন'] });
          return;
        }
        const normalized = Math.min(200, Math.floor(parsedCount));
        updates.donation_count = normalized;
        nextDonationCount = normalized;
      } else {
        updates.donation_count = nextDonationCount;
      }

      const { error } = await supabase.from('donors').update(updates).eq('id', donor.id);

      if (error) {
        console.error('Failed to update donor profile', error);
        setErrorMessage('প্রোফাইল আপডেট করা যায়নি। পরে আবার চেষ্টা করুন।');
        return;
      }

      setMessage('ডোনার প্রোফাইল সফলভাবে আপডেট হয়েছে।');
      if (onUpdated) {
        onUpdated({
          emergency_ready: emergencyReady,
          share_contact: shareContact,
          about: about.trim().length ? about.trim() : null,
          last_donation_at: nextLastDonationAt,
          donation_count: nextDonationCount,
        });
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-6 rounded-3xl border border-slate-100 bg-white/95 p-6 shadow-sm sm:p-10"
    >
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-slate-900">{donor.display_name}</h2>
        <p className="text-sm text-slate-600">
          {locationLabel} • ব্লাড গ্রুপ {donor.blood_group} • ফোন {donor.phone_primary}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm">
          <span className="font-semibold text-slate-700">সর্বশেষ রক্তদানের তারিখ</span>
          <input
            name="last_donation_at"
            type="date"
            max={new Date().toISOString().split('T')[0]}
            defaultValue={inputDate(donor.last_donation_at)}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm transition focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
          {fieldErrors.last_donation_at ? (
            <p className="text-xs font-medium text-rose-600">{fieldErrors.last_donation_at[0]}</p>
          ) : null}
        </label>
        <label className="grid gap-2 text-sm">
          <span className="font-semibold text-slate-700">মোট কতবার রক্ত দিয়েছেন?</span>
          <input
            name="donation_count"
            type="number"
            min={0}
            max={200}
            step={1}
            inputMode="numeric"
            defaultValue={donor.donation_count ?? ''}
            placeholder="যেমন: ৫"
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm transition focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
          {fieldErrors.donation_count ? (
            <p className="text-xs font-medium text-rose-600">{fieldErrors.donation_count[0]}</p>
          ) : null}
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
          <input
            type="checkbox"
            name="emergency_ready"
            defaultChecked={Boolean(donor.emergency_ready)}
            className="h-4 w-4 rounded border-slate-300"
          />
          জরুরি সাড়া দিতে প্রস্তুত
        </label>
        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
          <input
            type="checkbox"
            name="share_contact"
            defaultChecked={donor.share_contact ?? true}
            className="h-4 w-4 rounded border-slate-300"
          />
          যোগাযোগ তথ্য পাবলিকলি দেখান
        </label>
      </div>

      <label className="grid gap-2 text-sm">
        <span className="font-semibold text-slate-700">অতিরিক্ত নোট</span>
        <textarea
          name="about"
          rows={4}
          defaultValue={donor.about ?? ''}
          placeholder="রক্ত দেওয়ার সময়সূচি, স্বাস্থ্যগত নোট ইত্যাদি যোগ করুন"
          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm transition focus:border-primary focus:ring-2 focus:ring-primary/15"
        />
        {fieldErrors.about ? (
          <p className="text-xs font-medium text-rose-600">{fieldErrors.about[0]}</p>
        ) : null}
      </label>

      {message ? (
        <p className="rounded-2xl border border-emerald-100 bg-emerald-50/80 px-4 py-2 text-sm font-medium text-emerald-700">
          {message}
        </p>
      ) : null}
      {errorMessage ? (
        <p className="rounded-2xl border border-rose-100 bg-rose-50/80 px-4 py-2 text-sm font-medium text-rose-700">
          {errorMessage}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? 'আপডেট হচ্ছে…' : 'প্রোফাইল আপডেট করুন'}
        </button>
        <p className="text-xs text-slate-500">
          সর্বশেষ দান ও মোট ডোনেশন তথ্য আপডেট রাখলে সার্চ ফিল্টারে আপনার প্রোফাইল সহজে পাওয়া যাবে।
        </p>
      </div>
    </form>
  );
}

