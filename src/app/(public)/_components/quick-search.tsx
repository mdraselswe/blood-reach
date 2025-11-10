/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { BloodGroupChip } from '@/components/ui/blood-group-chip';
import { supabaseBrowserClient } from '@/lib/supabase-browser';

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

type HighlightDonor = {
  id: string;
  display_name: string;
  blood_group: string;
  district: string | null;
  area: string | null;
  donation_count: number | null;
  last_donation_at: string | null;
  emergency_ready: boolean | null;
  share_contact: boolean | null;
  phone_primary: string;
  verified: boolean | null;
};

type AreaHighlight = {
  district: string | null;
  area: string | null;
  blood_group: string;
  verified: boolean | null;
};

function formatLastDonation(value: string | null) {
  if (!value) return 'সর্বশেষ দানের তথ্য নেই';
  const donationDate = new Date(value);
  if (Number.isNaN(donationDate.getTime())) return 'সর্বশেষ দানের তথ্য নেই';

  const now = new Date();
  const diffMs = now.getTime() - donationDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return 'আজই দান করেছেন';
  if (diffDays === 1) return '১ দিন আগে দান করেছেন';
  if (diffDays < 7) return `${diffDays} দিন আগে দান`;
  if (diffDays < 30) return `${Math.round(diffDays / 7)} সপ্তাহ আগে দান`;
  if (diffDays < 365) return `${Math.round(diffDays / 30)} মাস আগে দান`;
  return `${Math.round(diffDays / 365)} বছর আগে দান`;
}

export function QuickSearch() {
  const [loading, setLoading] = useState(true);
  const [totalActive, setTotalActive] = useState<number>(0);
  const [areaHotspots, setAreaHotspots] = useState<AreaHighlight[]>([]);
  const [featuredDonors, setFeaturedDonors] = useState<HighlightDonor[]>([]);

  useEffect(() => {
    let isCancelled = false;

    const loadHighlights = async () => {
      try {
        const supabase = supabaseBrowserClient();
        const { data, count, error } = await supabase
          .from('donors')
          .select(
            'id, display_name, blood_group, district, area, donation_count, last_donation_at, emergency_ready, share_contact, phone_primary, verified',
            { count: 'exact' },
          )
          .eq('availability', 'available')
          .order('verified', { ascending: false })
          .order('donation_count', { ascending: false })
          .limit(12);

        if (error) {
          console.error('Failed to load quick search highlights', error);
          if (!isCancelled) {
            setTotalActive(0);
            setAreaHotspots([]);
            setFeaturedDonors([]);
            setLoading(false);
          }
          return;
        }

        const donors = data ?? [];

        const hotspots: AreaHighlight[] = [];
        const seen = new Set<string>();
        for (const donor of donors) {
          const key = `${donor.district ?? 'unknown'}-${donor.area ?? ''}`;
          if (seen.has(key)) continue;
          seen.add(key);
          hotspots.push({
            district: donor.district,
            area: donor.area,
            blood_group: donor.blood_group,
            verified: donor.verified,
          });
          if (hotspots.length >= 6) break;
        }

        if (!isCancelled) {
          setTotalActive(count ?? donors.length);
          setAreaHotspots(hotspots);
          setFeaturedDonors(donors.slice(0, 3));
          setLoading(false);
        }
      } catch (err) {
        console.error('Unexpected error loading quick search highlights', err);
        if (!isCancelled) {
          setTotalActive(0);
          setAreaHotspots([]);
          setFeaturedDonors([]);
          setLoading(false);
        }
      }
    };

    loadHighlights();

    return () => {
      isCancelled = true;
    };
  }, []);

  const loadingSkeleton = useMemo(
    () => (
      <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-6 rounded-3xl border border-white bg-white/70 p-6 shadow-sm backdrop-blur">
          <div className="space-y-3">
            <div className="h-4 w-32 animate-pulse rounded-full bg-slate-200" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 8 }).map((_, idx) => (
                <span key={idx} className="h-8 w-16 animate-pulse rounded-full bg-slate-200" />
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <div className="h-4 w-36 animate-pulse rounded-full bg-slate-200" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="h-12 animate-pulse rounded-2xl bg-slate-100" />
              ))}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
            <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
          </div>
        </div>
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="grid gap-3 rounded-3xl border border-white bg-white/70 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="h-4 w-32 animate-pulse rounded-full bg-slate-200" />
                <span className="h-6 w-10 animate-pulse rounded-full bg-slate-200" />
              </div>
              <span className="h-3 w-48 animate-pulse rounded-full bg-slate-100" />
              <div className="flex gap-2">
                <span className="h-8 w-20 animate-pulse rounded-full bg-slate-100" />
                <span className="h-8 w-20 animate-pulse rounded-full bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    [],
  );

  return (
    <section id="donors" className="mx-auto max-w-6xl px-4 py-16">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="max-w-xl space-y-2">
          <h2 className="text-2xl font-semibold text-slate-900 sm:text-3xl">ডোনার সার্চ করুন মুহূর্তেই</h2>
          <p className="text-sm text-slate-600 sm:text-base">
            ব্লাড গ্রুপ, লোকেশন ও প্রাপ্যতা অনুযায়ী দ্রুত ফিল্টার করুন। বর্তমানে{' '}
            <span className="font-semibold text-primary-600">{totalActive}</span> জন ডোনার সক্রিয় আছেন।
          </p>
        </div>
        <Link
          href="/donors"
          className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-soft hover:bg-primary-600"
        >
          উন্নত সার্চ খুলুন
        </Link>
      </div>
      {loading ? (
        loadingSkeleton
      ) : (
        <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-6 rounded-3xl border border-white bg-white/90 p-6 shadow-sm backdrop-blur">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">ব্লাড গ্রুপ</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {bloodGroups.map((group) => (
                <BloodGroupChip
                  key={group}
                  group={group}
                  href={{ pathname: '/donors', query: { group } }}
                />
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">আঞ্চলিক ক্ষেত্র</h3>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              {areaHotspots.map((item, index) => {
                const query: Record<string, string> = { group: item.blood_group };
                if (item.district) query.district = item.district;
                if (item.area) query.area = item.area;

                return (
                  <Link
                    key={`${item.district ?? 'unknown'}-${item.area ?? 'any'}-${index}`}
                    href={{ pathname: '/donors', query }}
                    className="rounded-2xl border border-slate-200 px-4 py-3 text-left font-medium text-slate-600 transition hover:border-primary hover:bg-primary-50/80 hover:text-primary-600"
                  >
                    {item.area ?? item.district ?? 'অজানা লোকেশন'}
                    <span className="mt-1 block text-xs font-normal text-slate-500">
                      {item.verified ? 'ভেরিফায়েড ডোনার' : 'কমিউনিটি ডোনার'}
                    </span>
                  </Link>
                );
              })}
              {areaHotspots.length === 0 ? (
                <p className="col-span-full rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-xs text-slate-400">
                  ডোনার তথ্য পাওয়া যায়নি। ডাটাবেসে ডোনার যোগ করুন শুরু করার জন্য।
                </p>
              ) : null}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href={{ pathname: '/donors', query: { availability: 'available' } }}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:border-primary hover:bg-primary-50 hover:text-primary-600"
            >
              এখনই প্রাপ্য
            </Link>
            <Link
              href={{ pathname: '/donors', query: { availability: 'temporarily_unavailable' } }}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:border-primary hover:bg-primary-50 hover:text-primary-600"
            >
              সাম্প্রতিক হিরো
            </Link>
          </div>
        </div>
        <div className="grid gap-4">
          {featuredDonors.length ? (
            featuredDonors.map((donor) => {
              const location = donor.area ? `${donor.area}, ${donor.district ?? ''}` : donor.district ?? 'অজানা';
              const lastDonation = formatLastDonation(donor.last_donation_at);
              const donationCountLabel =
                donor.donation_count && donor.donation_count > 0
                  ? `${donor.donation_count} বার রক্তদান`
                  : 'প্রথমবার রক্তদানে প্রস্তুত';

              return (
                <article
                  key={donor.id}
                  className="grid gap-3 rounded-3xl border border-white bg-white/90 p-5 shadow-sm transition hover:border-primary/40 hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h4 className="text-base font-semibold text-slate-800">{donor.display_name}</h4>
                      <p className="text-xs text-slate-500">{location}</p>
                    </div>
                    <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-600">
                      {donor.blood_group}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {lastDonation} • {donationCountLabel}
                    {donor.verified ? ' • ভেরিফায়েড ডোনার' : ''}
                    {donor.emergency_ready ? ' • জরুরি সাড়ায় প্রস্তুত' : ''}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={{
                        pathname: '/donors',
                        query: {
                          group: donor.blood_group,
                          ...(donor.district ? { district: donor.district } : {}),
                          ...(donor.area ? { area: donor.area } : {}),
                        },
                      }}
                      className="inline-flex items-center gap-2 rounded-full border border-primary px-4 py-2 text-xs font-semibold text-primary-600 hover:bg-primary-100"
                    >
                      বিস্তারিত দেখুন
                    </Link>
                    {donor.share_contact && donor.phone_primary ? (
                      <>
                        <a
                          href={`tel:${donor.phone_primary.replace(/[^0-9+]/g, '')}`}
                          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white shadow-soft hover:bg-primary-600"
                        >
                          📞 কল করুন
                        </a>
                        <a
                          href={`https://wa.me/${donor.phone_primary.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-full border border-primary/30 px-4 py-2 text-xs font-semibold text-primary-600 hover:bg-primary-50"
                        >
                          💬 হোয়াটসঅ্যাপ
                        </a>
                      </>
                    ) : null}
                  </div>
                </article>
              );
            })
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white/80 p-6 text-center text-sm text-slate-500">
              দ্রুত সার্চের জন্য প্রকাশ্য কোনো ডোনার প্রোফাইল পাওয়া যায়নি।
            </div>
          )}
        </div>
        </div>
      )}
    </section>
  );
}
