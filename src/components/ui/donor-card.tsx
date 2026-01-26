'use client';

import { useMemo, useState } from 'react';
import type { Database } from '@/types/database';
import { cn } from '@/lib/utils';

const availabilityBadgeMeta: Record<
  Database['public']['Enums']['availability_status'],
  { label: string; icon: string; tone: string }
> = {
  available: { label: 'এখন Available', icon: '🟢', tone: 'bg-emerald-100 text-emerald-700 border border-emerald-200' },
  temporarily_unavailable: {
    label: 'শীঘ্রই Available',
    icon: '⏳',
    tone: 'bg-amber-100 text-amber-700 border border-amber-200',
  },
  not_available: { label: 'Available নেই', icon: '🚫', tone: 'bg-slate-200 text-slate-600 border border-slate-300' },
};

type Donor = Pick<Database['public']['Tables']['donors']['Row'],
  | 'id'
  | 'display_name'
  | 'district'
  | 'area'
  | 'blood_group'
  | 'availability'
  | 'verified'
  | 'donation_count'
  | 'response_rate'
  | 'last_donation_at'
  | 'emergency_ready'
  | 'phone_primary'
  | 'phone_secondary'
  | 'share_contact'
  | 'tags'
  | 'about'
  | 'institute'
  | 'department'
  | 'batch'
  | 'gender'
  | 'birth_year'
>;

export function DonorCard({ donor }: { donor: Donor }) {
  const [shared, setShared] = useState(false);
  const [copied, setCopied] = useState(false);
  const [phoneCopied, setPhoneCopied] = useState(false);

  const locationLabel = useMemo(() => {
    if (!donor.area) return donor.district;
    return `${donor.area}, ${donor.district}`;
  }, [donor.area, donor.district]);

  const age = useMemo(() => {
    if (!donor.birth_year) return null;
    const currentYear = new Date().getFullYear();
    return currentYear - donor.birth_year;
  }, [donor.birth_year]);

  const lastDonation = useMemo(() => {
    if (!donor.last_donation_at) return 'তারিখ অজানা';
    const lastDate = new Date(donor.last_donation_at);
    if (Number.isNaN(lastDate.getTime())) return 'তারিখ অজানা';
    const today = new Date();
    const diff = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diff <= 0) return 'আজই ডোনেট করেছেন';
    if (diff === 1) return '১ দিন আগে ডোনেট করেছেন';
    if (diff < 7) return `${diff} দিন আগে`;
    if (diff < 30) return `${Math.round(diff / 7)} সপ্তাহ আগে`;
    if (diff < 365) return `${Math.round(diff / 30)} মাস আগে`;
    return `${Math.round(diff / 365)} বছর আগে`;
  }, [donor.last_donation_at]);

  // Check if donor is eligible (hasn't donated in last 4 months = 120 days)
  const isEligible = useMemo(() => {
    if (!donor.last_donation_at) return true; // No donation record means eligible
    const lastDate = new Date(donor.last_donation_at);
    if (Number.isNaN(lastDate.getTime())) return true;
    const today = new Date();
    const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 120; // 4 months = ~120 days
  }, [donor.last_donation_at]);

  const responseRate = useMemo(() => {
    if (!donor.response_rate) return null;
    const value = Number(donor.response_rate);
    if (Number.isNaN(value)) return null;
    return `${Math.round(value)}% রেসপন্স`;
  }, [donor.response_rate]);

  const formattedPrimaryPhone = useMemo(() => {
    if (!donor.phone_primary) return null;
    const digits = donor.phone_primary.replace(/[^0-9+]/g, '');
    if (digits.startsWith('+')) return digits;
    if (digits.startsWith('0')) return `+88${digits}`;
    return `+88${digits}`;
  }, [donor.phone_primary]);

  const dialLink = useMemo(() => {
    if (!formattedPrimaryPhone) return null;
    return formattedPrimaryPhone.replace(/\s+/g, '');
  }, [formattedPrimaryPhone]);

  const whatsappLink = donor.share_contact && formattedPrimaryPhone
    ? `https://wa.me/${formattedPrimaryPhone.replace(/[^0-9]/g, '')}`
    : undefined;

  const donorSharePayload = useMemo(() => {
    const baseText = `BloodReach ডোনার: ${donor.display_name} (${locationLabel}) • ব্লাড গ্রুপ ${donor.blood_group}`;
    const phoneLine = formattedPrimaryPhone ? `\nযোগাযোগ: ${formattedPrimaryPhone}` : '';
    return {
      title: `${donor.display_name} • ${donor.blood_group}`,
      text: `${baseText}${phoneLine}`.trim(),
      url: typeof window !== 'undefined' ? window.location.href : '',
    };
  }, [donor.display_name, donor.blood_group, locationLabel, formattedPrimaryPhone]);

  const handleCopyPhone = async () => {
    if (!formattedPrimaryPhone) return;
    try {
      await navigator.clipboard.writeText(formattedPrimaryPhone);
      setPhoneCopied(true);
      setTimeout(() => setPhoneCopied(false), 2000);
    } catch (error) {
      console.error('Clipboard unavailable', error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share(donorSharePayload);
        setShared(true);
        setTimeout(() => setShared(false), 2500);
      } catch (error) {
        console.warn('Share cancelled', error);
      }
      return;
    }

    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(
          `${donorSharePayload.text}\n${donorSharePayload.url}`.trim(),
        );
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch (error) {
        console.error('Clipboard unavailable', error);
      }
    }
  };

  const telLink = donor.share_contact && dialLink ? `tel:${dialLink}` : undefined;

  return (
    <article className={cn(
      "relative flex h-full w-full min-w-0 flex-col justify-between gap-3 overflow-hidden rounded-2xl border p-4 shadow-sm transition hover:-translate-y-[2px] hover:shadow-lg sm:rounded-3xl sm:gap-4 sm:p-6",
      isEligible 
        ? "border-white bg-white" 
        : "border-amber-300 bg-amber-50/50"
    )}>
      {donor.verified ? (
        <div className="pointer-events-none absolute right-0 top-0 flex items-center gap-0.5 rounded-bl-2xl bg-emerald-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm sm:gap-1 sm:rounded-bl-3xl sm:px-4 sm:py-1 sm:text-xs">
          <span className="text-xs sm:text-sm">★</span> <span className="hidden sm:inline">ভেরিফায়েড</span>
        </div>
      ) : null}
      {!isEligible ? (
        <div className="pointer-events-none absolute left-0 top-0 flex items-center gap-0.5 rounded-br-2xl bg-amber-500 px-2 py-0.5 text-[9px] font-semibold text-white shadow-sm sm:gap-1 sm:rounded-br-3xl sm:px-3 sm:py-1 sm:text-[10px]">
          ⏸️ <span className="hidden sm:inline">৪ মাস অপেক্ষা</span>
        </div>
      ) : null}
      
      <header className="flex min-w-0 items-start justify-between gap-2 sm:gap-4">
        <div className="flex min-w-0 items-start gap-2 sm:gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-base font-bold text-white shadow-soft sm:h-14 sm:w-14 sm:rounded-3xl sm:text-lg">
            {donor.blood_group}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5 sm:gap-1">
            <h3 className="min-w-0 break-words text-base font-semibold leading-tight text-slate-900 sm:text-lg">
              {donor.display_name}
            </h3>
            <div className="flex min-w-0 flex-wrap items-center gap-1.5 text-[10px] font-medium text-slate-500 sm:gap-2 sm:text-xs">
              <span className="min-w-0 break-words">{locationLabel}</span>
              {donor.gender || age ? (
                <>
                  <span className="h-0.5 w-0.5 rounded-full bg-slate-300 sm:h-1 sm:w-1" />
                  <span>
                    {[
                      donor.gender === 'Male' ? 'পুরুষ' : donor.gender === 'Female' ? 'মহিলা' : donor.gender,
                      age ? `${age} বছর` : null
                    ].filter(Boolean).join(' • ')}
                  </span>
                </>
              ) : null}
            </div>
            <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-1.5 sm:mt-1 sm:gap-2">
              <span
                className={cn(
                  'inline-flex shrink-0 items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold sm:gap-1 sm:px-2.5 sm:text-[11px]',
                  availabilityBadgeMeta[donor.availability].tone,
                )}
              >
                <span>{availabilityBadgeMeta[donor.availability].icon}</span>
                <span className="whitespace-nowrap">{availabilityBadgeMeta[donor.availability].label}</span>
              </span>
              {!isEligible ? (
                <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800 border border-amber-300 sm:gap-1 sm:px-2.5 sm:text-[11px]">
                  ⏸️ <span className="hidden sm:inline">এখন দান করতে পারবেন না</span>
                </span>
              ) : null}
              {donor.emergency_ready ? (
                <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700 sm:gap-1 sm:px-2 sm:text-[11px]">
                  ⚡ <span className="hidden sm:inline">Emergency Ready</span>
                </span>
              ) : null}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-0.5 text-right sm:gap-1">
          {responseRate ? (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-600 sm:gap-1 sm:px-3 sm:text-[11px]">
              {responseRate}
            </span>
          ) : null}
        </div>
      </header>

      <div className="grid min-w-0 gap-2 text-xs text-slate-600 sm:gap-3 sm:text-sm">
        {(donor.institute || donor.department || donor.batch) ? (
          <div className="min-w-0 rounded-xl bg-slate-50 px-3 py-2 text-[10px] sm:rounded-2xl sm:px-4 sm:py-3 sm:text-xs">
            {donor.institute && <p className="min-w-0 break-words font-semibold text-slate-700">{donor.institute}</p>}
            {(donor.department || donor.batch) && (
              <p className={cn("min-w-0 break-words text-slate-500", donor.institute && "mt-0.5")}>
                {[donor.department, donor.batch ? `ব্যাচ ${donor.batch}` : null]
                  .filter(Boolean)
                  .join(' • ')}
              </p>
            )}
          </div>
        ) : null}

        <div className="grid min-w-0 gap-2 rounded-xl border border-slate-100 bg-slate-50/40 p-3 sm:gap-3 sm:rounded-2xl sm:p-4">
          <dl className="grid min-w-0 gap-2 text-[10px] text-slate-500 sm:grid-cols-3 sm:gap-3 sm:text-xs">
            <div className="space-y-0.5 sm:space-y-1">
              <dt className="font-semibold text-slate-600">সর্বশেষ দান</dt>
              <dd className="text-xs text-slate-900 sm:text-sm">{lastDonation}</dd>
            </div>
            <div className="space-y-0.5 sm:space-y-1">
              <dt className="font-semibold text-slate-600">মোট ডোনেশন</dt>
              <dd className="text-xs text-slate-900 sm:text-sm">
                {donor.donation_count > 0 ? `${donor.donation_count} বার` : 'তথ্য নেই'}
              </dd>
            </div>
            <div className="space-y-0.5 sm:space-y-1">
              <dt className="font-semibold text-slate-600">যোগাযোগ</dt>
              <dd className="text-xs text-slate-900 sm:text-sm">{donor.share_contact ? 'সরাসরি' : 'সীমিত'}</dd>
            </div>
          </dl>
          
          {donor.about ? (
            <p className="min-w-0 break-words rounded-xl bg-white/90 p-2 text-xs text-slate-600 sm:rounded-2xl sm:p-3 sm:text-sm">{donor.about}</p>
          ) : null}
          
          {donor.share_contact && formattedPrimaryPhone ? (
            <div className="flex min-w-0 flex-col items-stretch gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-medium text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:rounded-2xl sm:px-3 sm:py-2 sm:text-xs">
              <span className="min-w-0 break-all text-xs font-semibold text-slate-900 sm:text-sm">{formattedPrimaryPhone}</span>
              <button
                type="button"
                onClick={handleCopyPhone}
                className="shrink-0 inline-flex items-center justify-center gap-1 rounded-full border border-slate-200 px-2.5 py-1 text-[10px] font-semibold text-slate-600 hover:border-primary hover:text-primary-600 sm:px-3 sm:text-xs"
              >
                {phoneCopied ? 'কপি হয়েছে ✔️' : 'কপি করুন'}
              </button>
            </div>
          ) : null}
          
          {donor.tags?.length ? (
            <div className="flex min-w-0 flex-wrap gap-1.5 text-[10px] font-semibold text-primary-700 sm:gap-2 sm:text-xs">
              {donor.tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="shrink-0 inline-flex items-center justify-center rounded-full bg-primary-50 px-2 py-0.5 sm:px-3 sm:py-1"
                >
                  #{tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <footer className="grid min-w-0 gap-1.5 text-xs sm:gap-2 sm:text-sm">
        {telLink || whatsappLink ? (
          <div className="flex min-w-0 flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
            {telLink ? (
              <a
                href={telLink}
                className="shrink-0 inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-soft hover:bg-primary-600 sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
              >
                📞 কল করুন
              </a>
            ) : (
              <span className="min-w-0 break-words text-[10px] text-slate-400 sm:text-xs">ফোন নম্বর লগইন ছাড়া দেখা যাবে না।</span>
            )}
            {whatsappLink ? (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 inline-flex items-center justify-center gap-1.5 rounded-full border border-primary px-3 py-1.5 text-xs font-semibold text-primary-700 hover:bg-primary-100 sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
              >
                💬 WhatsApp
              </a>
            ) : null}
            <button
              type="button"
              onClick={handleShare}
              className="shrink-0 inline-flex items-center justify-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-primary hover:text-primary-600 sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
            >
              {shared ? 'শেয়ার হয়েছে ✔️' : copied ? 'কপি হয়েছে ✔️' : 'শেয়ার'}
            </button>
          </div>
        ) : (
          <p className="min-w-0 break-words rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2 text-[10px] text-slate-500 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-xs">
            যোগাযোগ তথ্য প্রকাশ্য নয়। অনুগ্রহ করে সাপোর্ট টিমের সাথে যোগাযোগ করুন।
          </p>
        )}
      </footer>
    </article>
  );
}
