'use client';

import type { Route } from 'next';
import { useMemo, useTransition, useState, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { Database } from '@/types/database';

type Filters = {
  bloodGroup?: string;
  district?: string;
  area?: string;
  availability?: string;
  institute?: string;
  department?: string;
  batch?: string;
  gender?: string;
  query?: string;
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
  institutes: Array<{ id: number; name: string; name_en: string | null; type: string | null; departments: string[]; batches: string[]; }>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const districts = useMemo(() => Object.keys(areaLookup), [areaLookup]);
  const selectedDistrict = filters.district;
  const selectedArea = filters.area;
  const selectedInstitute = filters.institute;
  
  const districtAreas = useMemo(() => {
    if (!selectedDistrict) return [];
    return areaLookup[selectedDistrict] ?? [];
  }, [selectedDistrict, areaLookup]);

  // Get departments and batches for selected institute
  const currentInstitute = useMemo(() => {
    if (!selectedInstitute) return null;
    return institutes.find(inst => inst.name === selectedInstitute);
  }, [selectedInstitute, institutes]);

  const availableDepartments = currentInstitute?.departments || [];
  const availableBatches = currentInstitute?.batches || [];

  // Local state for institute to prevent lag
  const [instituteValue, setInstituteValue] = useState(selectedInstitute ?? '');

  // Sync with URL param
  useEffect(() => {
    setInstituteValue(selectedInstitute ?? '');
  }, [selectedInstitute]);

  const updateQueryParam = (key: string, value?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (key === 'district' && value !== searchParams.get('district')) {
      params.delete('area');
    }
    if (key === 'institute' && value !== searchParams.get('institute')) {
      // Clear department and batch when institute changes
      params.delete('department');
      params.delete('batch');
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
          <span>ইনস্টিটিউট</span>
          <input
            type="text"
            list="institutes-filter-list"
            value={instituteValue}
            onChange={(e) => setInstituteValue(e.target.value)}
            onBlur={() => updateQueryParam('institute', instituteValue || undefined)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                updateQueryParam('institute', instituteValue || undefined);
              }
            }}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="ইনস্টিটিউট টাইপ করুন বা নির্বাচন করুন"
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

      {/* Conditional Department Filter */}
      {selectedInstitute && availableDepartments.length > 0 && (
        <div className="grid gap-3 text-sm font-medium text-slate-600">
          <span>Department</span>
          <select
            value={filters.department ?? ''}
            onChange={(e) => updateQueryParam('department', e.target.value || undefined)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="">সব Department</option>
            {availableDepartments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Conditional Batch Filter */}
      {selectedInstitute && availableBatches.length > 0 && (
        <div className="grid gap-3 text-sm font-medium text-slate-600">
          <span>Batch</span>
          <select
            value={filters.batch ?? ''}
            onChange={(e) => updateQueryParam('batch', e.target.value || undefined)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="">সব Batch</option>
            {availableBatches.map((batch) => (
              <option key={batch} value={batch}>
                {batch}
              </option>
            ))}
          </select>
        </div>
      )}
        {/* Gender Filter */}
        <div className="grid gap-3 text-sm font-medium text-slate-600">
          <span>লিঙ্গ</span>
          <select
            value={filters.gender ?? ''}
            onChange={(e) => updateQueryParam('gender', e.target.value || undefined)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="">সব লিঙ্গ</option>
            <option value="Male">পুরুষ</option>
            <option value="Female">মহিলা</option>
            <option value="Other">অন্যান্য</option>
          </select>
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
          <select
            value={filters.district ?? ''}
            onChange={(e) => {
              const value = e.target.value || undefined;
              updateQueryParam('district', value);
            }}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="">সকল জেলা</option>
            {districts.map((district) => (
              <option key={district} value={district}>
                {district}
              </option>
            ))}
          </select>
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
