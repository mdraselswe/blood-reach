'use client';

import { useMemo, useState } from 'react';
import type { Database } from '@/types/database';
import { cn } from '@/lib/utils';

const availabilityBadgeMeta: Record<
  Database['public']['Enums']['availability_status'],
  { label: string; icon: string; tone: string }
> = {
  available: { label: 'উপলভ্য', icon: '🟢', tone: 'bg-emerald-100 text-emerald-700 border border-emerald-200' },
  temporarily_unavailable: {
    label: 'শীঘ্রই উপলভ্য',
    icon: '⏳',
    tone: 'bg-amber-100 text-amber-700 border border-amber-200',
  },
  not_available: { label: 'অনুপলভ্য', icon: '🚫', tone: 'bg-slate-200 text-slate-600 border border-slate-300' },
};

type Donor = Pick<Database['public']['Tables']['donors']['Row'],
  |
    'id'
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
>;

export function DonorCard({ donor }: { donor: Donor }) {
  const [shared, setShared] = useState(false);
  const [copied, setCopied] = useState(false);
  const [phoneCopied, setPhoneCopied] = useState(false);

  const locationLabel = useMemo(() => {
    if (!donor.area) return donor.district;
    return `${donor.area}, ${donor.district}`;
  }, [donor.area, donor.district]);

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
    <article className="relative flex h-full flex-col justify-between gap-4 overflow-hidden rounded-3xl border border-white bg-white p-6 shadow-sm transition hover:-translate-y-[2px] hover:shadow-lg">
      {donor.verified ? (
        <div className="pointer-events-none absolute right-0 top-0 flex items-center gap-1 rounded-bl-3xl bg-emerald-500 px-4 py-1 text-xs font-semibold text-white shadow-sm">
          <span className="text-sm">★</span> ভেরিফায়েড ডোনার
        </div>
      ) : null}
      <header className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-primary text-lg font-bold text-white shadow-soft">
            {donor.blood_group}
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <h3 className="text-lg font-semibold leading-tight text-slate-900">
              {donor.display_name}
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
                  availabilityBadgeMeta[donor.availability].tone,
                )}
              >
                <span>{availabilityBadgeMeta[donor.availability].icon}</span>
                {availabilityBadgeMeta[donor.availability].label}
              </span>
              {donor.emergency_ready ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
                  ⚡ জরুরি প্রস্তুত
                </span>
              ) : null}
            </div>
            <p className="text-xs font-medium text-slate-500">{locationLabel}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 text-right">
          {responseRate ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold text-indigo-600">
              {responseRate}
            </span>
          ) : null}
        </div>
      </header>

      <div className="grid gap-3 text-sm text-slate-600">
        <div className="grid gap-3 rounded-2xl border border-slate-100 bg-slate-50/40 p-4">
          <dl className="grid gap-3 text-xs text-slate-500 sm:grid-cols-3">
            <div className="space-y-1">
              <dt className="font-semibold text-slate-600">সর্বশেষ দান</dt>
              <dd className="text-sm text-slate-900">{lastDonation}</dd>
            </div>
            <div className="space-y-1">
              <dt className="font-semibold text-slate-600">মোট ডোনেশন</dt>
              <dd className="text-sm text-slate-900">
                {donor.donation_count > 0 ? `${donor.donation_count} বার` : 'তথ্য নেই'}
              </dd>
            </div>
            <div className="space-y-1">
              <dt className="font-semibold text-slate-600">যোগাযোগ</dt>
              <dd className="text-sm text-slate-900">{donor.share_contact ? 'সরাসরি' : 'সীমিত'}</dd>
            </div>
          </dl>
          {donor.about ? (
            <p className="rounded-2xl bg-white/90 p-3 text-sm text-slate-600">{donor.about}</p>
          ) : null}
          {donor.share_contact && formattedPrimaryPhone ? (
            <div className="flex items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600">
              <span className="text-sm font-semibold text-slate-900">{formattedPrimaryPhone}</span>
              <button
                type="button"
                onClick={handleCopyPhone}
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-primary hover:text-primary-600"
              >
                {phoneCopied ? 'কপি হয়েছে ✔️' : 'কপি করুন'}
              </button>
            </div>
          ) : null}
          {donor.tags?.length ? (
            <div className="grid grid-cols-2 items-center gap-2 text-xs font-semibold text-primary-700">
              {donor.tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center justify-center rounded-full bg-primary-50 px-3 py-1"
                >
                  #{tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <footer className="grid gap-2 text-sm">
        {telLink || whatsappLink ? (
          <div className="flex flex-wrap items-center gap-2">
            {telLink ? (
              <a
                href={telLink}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-soft hover:bg-primary-600"
              >
                📞 কল করুন
              </a>
            ) : (
              <span className="text-xs text-slate-400">ফোন নম্বর লগইন ছাড়া দেখা যাবে না।</span>
            )}
            {whatsappLink ? (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-primary px-4 py-2 text-sm font-semibold text-primary-700 hover:bg-primary-100"
              >
                💬 WhatsApp
              </a>
            ) : null}
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-primary hover:text-primary-600"
            >
              {shared ? 'শেয়ার হয়েছে ✔️' : copied ? 'কপি হয়েছে ✔️' : 'শেয়ার'}
            </button>
          </div>
        ) : (
          <p className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-xs text-slate-500">
            যোগাযোগ তথ্য প্রকাশ্য নয়। অনুগ্রহ করে সাপোর্ট টিমের সাথে যোগাযোগ করুন।
          </p>
        )}
      </footer>
    </article>
  );
}
