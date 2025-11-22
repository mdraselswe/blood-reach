'use client';

import type { Route } from 'next';
import { useMemo, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { Database } from '@/types/database';

type Filters = {
  query?: string;
  bloodGroup?: Database['public']['Enums']['blood_group'];
  district?: string;
  area?: string;
  availability?: 'available' | 'temporarily_unavailable';
  institute?: string;
};

type AreaLookup = Record<string, string[]>;

const bloodGroups: Database['public']['Enums']['blood_group'][] = [
  'A+',
  'A-',
  'B+',
  'B-',
  'AB+',
  'AB-',
  'O+',
  'O-',
];

export function DonorSearchForm({ 
  filters, 
  areaLookup,
  institutes,
}: { 
  filters: Filters; 
  areaLookup: AreaLookup;
  institutes: Array<{ id: number; name: string; name_en: string | null; type: string | null; }>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const districts = useMemo(() => Object.keys(areaLookup), [areaLookup]);
  const selectedDistrict = filters.district;
  const selectedArea = filters.area;
  const districtAreas = useMemo(() => {
    if (!selectedDistrict) return [];
    return areaLookup[selectedDistrict] ?? [];
  }, [selectedDistrict, areaLookup]);

  const updateQueryParam = (key: string, value?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (key === 'district' && value !== searchParams.get('district')) {
      params.delete('area');
    }
    if (value && value.length) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set('page', '1');

    startTransition(() => {
      const queryString = params.toString();
      const targetUrl = (queryString ? `${pathname}?${queryString}` : pathname) as Route;
      router.push(targetUrl, { scroll: true });
    });
  };

  return (
    <aside className="sticky top-24 flex flex-col gap-6 rounded-3xl border border-white bg-white/90 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">ফিল্টার</h2>
        <button
          type="button"
          onClick={() => {
            startTransition(() => {
              router.push(pathname as Route, { scroll: true });
            });
          }}
          className="text-xs font-semibold text-primary-600 hover:underline"
        >
          রিসেট
        </button>
      </div>
      <label className="grid gap-2 text-sm font-medium text-slate-600">
        <span>ডোনার সার্চ</span>
        <input
          type="search"
          placeholder="নাম, এলাকা বা হাসপাতাল"
          defaultValue={filters.query ?? ''}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              const value = (event.target as HTMLInputElement).value.trim();
              updateQueryParam('q', value || undefined);
            }
          }}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <p className="text-xs text-slate-400">এন্টার চাপুন সার্চ করতে</p>
      </label>
      <div className="grid gap-3 text-sm font-medium text-slate-600">
        <span>শিক্ষা প্রতিষ্ঠান</span>
        <input
          type="text"
          list="institutes-filter-list"
          value={filters.institute ?? ''}
          onChange={(e) => updateQueryParam('institute', e.target.value || undefined)}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          placeholder="টাইপ করুন বা নির্বাচন করুন"
        />
        <datalist id="institutes-filter-list">
          {institutes.map((inst) => (
            <option 
              key={inst.id} 
              value={inst.name}
            >
              {inst.name_en ? `${inst.name_en} (${inst.name})` : inst.name}
            </option>
          ))}
        </datalist>
        <p className="text-xs text-slate-400">
          খালি করতে চাইলে backspace চাপুন
        </p>
      </div>
      <div className="grid gap-3 text-sm font-medium text-slate-600">
        <span>ব্লাড গ্রুপ</span>
        <div className="flex flex-wrap gap-2">
          {bloodGroups.map((group) => (
            <button
              key={group}
              type="button"
              onClick={() => updateQueryParam('group', filters.bloodGroup === group ? undefined : group)}
              className={cn(
                'rounded-full border px-4 py-2 text-sm font-semibold transition',
                filters.bloodGroup === group
                  ? 'border-primary bg-primary text-white shadow-soft'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-primary hover:bg-primary-50 hover:text-primary-600',
              )}
            >
              {group}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-3 text-sm font-medium text-slate-600">
        <span>উপলভ্যতা</span>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'তৎক্ষণাৎ প্রাপ্য', value: 'available' },
            { label: 'অল্প সময় পর প্রাপ্য', value: 'temporarily_unavailable' },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() =>
                updateQueryParam(
                  'availability',
                  filters.availability === option.value ? undefined : option.value,
                )
              }
              className={cn(
                'rounded-full border px-4 py-2 text-xs font-semibold transition',
                filters.availability === option.value
                  ? 'border-primary bg-primary text-white shadow-soft'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-primary hover:bg-primary-50 hover:text-primary-600',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-3 text-sm font-medium text-slate-600">
        <span>জেলা</span>
        <div className="grid gap-2">
          {districts.map((district) => {
            const isActive = filters.district === district;
            return (
              <button
                key={district}
                type="button"
                onClick={() => updateQueryParam('district', isActive ? undefined : district)}
                className={cn(
                  'rounded-2xl border px-4 py-2 text-left text-sm transition',
                  isActive
                    ? 'border-primary bg-primary-50 text-primary-700'
                    : 'border-slate-200 hover:border-primary hover:bg-primary-50/70 hover:text-primary-600',
                )}
              >
                {district}
                {isActive && areaLookup[district]?.length ? (
                  <span className="mt-1 block text-xs font-normal text-primary-600">
                    {areaLookup[district].slice(0, 3).join(', ')}
                    {areaLookup[district].length > 3 ? '…' : ''}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
      {selectedDistrict ? (
        <div className="grid gap-3 text-sm font-medium text-slate-600">
          <span>
            এলাকা{' '}
            {districtAreas.length ? (
              <span className="text-xs font-normal text-slate-500">({districtAreas.length})</span>
            ) : null}
          </span>
          {districtAreas.length ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => updateQueryParam('area', undefined)}
                className={cn(
                  'rounded-full border px-4 py-2 text-xs font-semibold transition',
                  !selectedArea
                    ? 'border-primary bg-primary text-white shadow-soft'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-primary hover:bg-primary-50 hover:text-primary-600',
                )}
              >
                সব এলাকা
              </button>
              {districtAreas.map((area) => (
                <button
                  key={area}
                  type="button"
                  onClick={() => updateQueryParam('area', selectedArea === area ? undefined : area)}
                  className={cn(
                    'rounded-full border px-4 py-2 text-xs font-semibold transition',
                    selectedArea === area
                      ? 'border-primary bg-primary text-white shadow-soft'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-primary hover:bg-primary-50 hover:text-primary-600',
                  )}
                >
                  {area}
                </button>
              ))}
            </div>
          ) : (
            <p className="rounded-2xl border border-slate-100 bg-white px-4 py-3 text-xs text-slate-500">
              এই জেলার জন্য কোন এলাকা তালিকা নেই। অনুগ্রহ করে আগে সাপোর্ট টিমকে জানান।
            </p>
          )}
        </div>
      ) : null}
      {isPending ? (
        <p className="text-xs text-slate-400">ফিল্টার প্রয়োগ হচ্ছে…</p>
      ) : null}
    </aside>
  );
}
