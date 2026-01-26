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
  eligibility?: string;
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
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileOpen]);

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

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.query) count++;
    if (filters.bloodGroup) count++;
    if (filters.district) count++;
    if (filters.area) count++;
    if (filters.availability) count++;
    if (filters.institute) count++;
    if (filters.department) count++;
    if (filters.batch) count++;
    if (filters.gender) count++;
    if (filters.eligibility && filters.eligibility !== 'eligible') count++;
    return count;
  }, [filters]);

  const filterContent = (
    <div className="flex w-full min-w-0 flex-col gap-4 overflow-y-auto sm:gap-6">
      <label className="grid w-full min-w-0 gap-2 text-sm font-medium text-slate-700">
        <span className="min-w-0 break-words">ডোনার সার্চ</span>
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
          className="w-full min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <p className="text-xs text-slate-400">এন্টার চাপুন সার্চ করতে</p>
      </label>
      <div className="grid w-full min-w-0 gap-2 text-sm font-medium text-slate-700">
          <span className="min-w-0 break-words">College/University</span>
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
            className="w-full min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="College/University name type করুন"
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
        <div className="grid w-full min-w-0 gap-2 text-sm font-medium text-slate-700">
          <span className="min-w-0 break-words">Department</span>
          <select
            value={filters.department ?? ''}
            onChange={(e) => updateQueryParam('department', e.target.value || undefined)}
            className="w-full min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
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
        <div className="grid w-full min-w-0 gap-2 text-sm font-medium text-slate-700">
          <span className="min-w-0 break-words">Batch</span>
          <select
            value={filters.batch ?? ''}
            onChange={(e) => updateQueryParam('batch', e.target.value || undefined)}
            className="w-full min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
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
        <div className="grid w-full min-w-0 gap-2 text-sm font-medium text-slate-700">
          <span className="min-w-0 break-words">লিঙ্গ</span>
          <select
            value={filters.gender ?? ''}
            onChange={(e) => updateQueryParam('gender', e.target.value || undefined)}
            className="w-full min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="">সব লিঙ্গ</option>
            <option value="Male">পুরুষ</option>
            <option value="Female">মহিলা</option>
            <option value="Other">অন্যান্য</option>
          </select>
        </div>
      <div className="grid w-full min-w-0 gap-2 text-sm font-medium text-slate-700">
        <span className="min-w-0 break-words">ব্লাড গ্রুপ</span>
        <div className="flex min-w-0 flex-wrap gap-2">
          {bloodGroups.map((group) => (
            <button
              key={group}
              type="button"
              onClick={() => updateQueryParam('group', filters.bloodGroup === group ? undefined : group)}
              className={cn(
                'shrink-0 rounded-full border px-4 py-2.5 text-sm font-semibold transition active:scale-95',
                filters.bloodGroup === group
                  ? 'border-primary bg-primary text-white shadow-md'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-primary hover:bg-primary-50 hover:text-primary-600',
              )}
            >
              {group}
            </button>
          ))}
        </div>
      </div>
      <div className="grid w-full min-w-0 gap-2 text-sm font-medium text-slate-700">
        <span className="min-w-0 break-words">Availability</span>
        <div className="flex min-w-0 flex-wrap gap-2">
          {[
            { label: 'এখন Available', value: 'available' },
            { label: 'শীঘ্রই Available', value: 'temporarily_unavailable' },
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
                'shrink-0 rounded-full border px-4 py-2.5 text-xs font-semibold transition active:scale-95',
                filters.availability === option.value
                  ? 'border-primary bg-primary text-white shadow-md'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-primary hover:bg-primary-50 hover:text-primary-600',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid w-full min-w-0 gap-2 text-sm font-medium text-slate-700">
        <span className="min-w-0 break-words">এখন Donate করতে পারবেন?</span>
        <div className="flex min-w-0 flex-wrap gap-2">
          {[
            { label: 'হ্যাঁ', value: 'eligible' },
            { label: 'না (৪ মাস Wait)', value: 'ineligible' },
            { label: 'সব', value: 'all' },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() =>
                updateQueryParam(
                  'eligibility',
                  filters.eligibility === option.value ? undefined : option.value,
                )
              }
              className={cn(
                'shrink-0 rounded-full border px-4 py-2.5 text-xs font-semibold transition active:scale-95',
                (filters.eligibility === option.value || (!filters.eligibility && option.value === 'eligible'))
                  ? 'border-primary bg-primary text-white shadow-md'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-primary hover:bg-primary-50 hover:text-primary-600',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid w-full min-w-0 gap-2 text-sm font-medium text-slate-700">
          <span className="min-w-0 break-words">জেলা</span>
          <select
            value={filters.district ?? ''}
            onChange={(e) => {
              const value = e.target.value || undefined;
              updateQueryParam('district', value);
            }}
            className="w-full min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
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
        <div className="grid w-full min-w-0 gap-2 text-sm font-medium text-slate-700">
          <span className="min-w-0 break-words">
            এলাকা{' '}
            {districtAreas.length ? (
              <span className="text-xs font-normal text-slate-500">({districtAreas.length})</span>
            ) : null}
          </span>
          {districtAreas.length ? (
            <div className="flex min-w-0 flex-wrap gap-2">
              <button
                type="button"
                onClick={() => updateQueryParam('area', undefined)}
                className={cn(
                  'shrink-0 rounded-full border px-4 py-2.5 text-xs font-semibold transition active:scale-95',
                  !selectedArea
                    ? 'border-primary bg-primary text-white shadow-md'
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
                    'shrink-0 rounded-full border px-4 py-2.5 text-xs font-semibold transition active:scale-95',
                    selectedArea === area
                      ? 'border-primary bg-primary text-white shadow-md'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-primary hover:bg-primary-50 hover:text-primary-600',
                  )}
                >
                  {area}
                </button>
              ))}
            </div>
          ) : (
            <p className="min-w-0 break-words rounded-xl border border-slate-100 bg-white px-4 py-3 text-xs text-slate-500">
              এই জেলার জন্য কোন এলাকা তালিকা নেই। অনুগ্রহ করে আগে সাপোর্ট টিমকে জানান।
            </p>
          )}
        </div>
      ) : null}
      {isPending ? (
        <p className="text-xs text-slate-400">ফিল্টার প্রয়োগ হচ্ছে…</p>
      ) : null}
    </div>
  );

  if (!mounted) {
    return (
      <aside className="sticky top-16 z-10 hidden w-full min-w-0 flex-col gap-4 overflow-hidden rounded-2xl border border-white bg-white/90 p-4 shadow-sm sm:top-24 sm:gap-6 sm:rounded-3xl sm:p-6 lg:flex lg:w-auto">
        {filterContent}
      </aside>
    );
  }

  return (
    <>
      {/* Mobile Filter Button - Floating */}
      <button
        type="button"
        onClick={() => setIsMobileOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-primary px-5 py-3.5 text-sm font-semibold text-white shadow-lg transition-all hover:bg-primary-600 hover:shadow-xl active:scale-95 lg:hidden"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
        </svg>
        <span>ফিল্টার</span>
        {activeFilterCount > 0 && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-primary">
            {activeFilterCount}
          </span>
        )}
      </button>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <>
          <div
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
          <div
            className={cn(
              'fixed inset-x-0 bottom-0 z-[101] flex max-h-[85vh] flex-col rounded-t-3xl border-t border-slate-200 bg-white shadow-2xl transition-transform duration-300 ease-out lg:hidden',
              isMobileOpen ? 'translate-y-0' : 'translate-y-full',
            )}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-slate-900">ফিল্টার</h2>
                {activeFilterCount > 0 && (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                    {activeFilterCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    startTransition(() => {
                      router.push(pathname as Route, { scroll: true });
                      setIsMobileOpen(false);
                    });
                  }}
                  className="rounded-full px-4 py-2 text-sm font-semibold text-primary-600 hover:bg-primary-50 transition-colors"
                >
                  রিসেট
                </button>
                <button
                  type="button"
                  onClick={() => setIsMobileOpen(false)}
                  className="rounded-full p-2 text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6"
                  >
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {filterContent}
            </div>

            {/* Drawer Footer - Apply Button */}
            <div className="border-t border-slate-200 bg-slate-50 px-5 py-4">
              <button
                type="button"
                onClick={() => setIsMobileOpen(false)}
                className="w-full rounded-full bg-primary px-6 py-3.5 text-base font-semibold text-white shadow-md transition-all hover:bg-primary-600 active:scale-98"
              >
                {activeFilterCount > 0 ? `${activeFilterCount} টি ফিল্টার প্রয়োগ করুন` : 'ফিল্টার দেখুন'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Desktop Sidebar */}
      <aside className="sticky top-16 z-10 hidden w-full min-w-0 flex-col gap-4 overflow-hidden rounded-2xl border border-white bg-white/90 p-4 shadow-sm sm:top-24 sm:gap-6 sm:rounded-3xl sm:p-6 lg:flex lg:w-auto">
        <div className="flex min-w-0 items-center justify-between gap-2">
          <h2 className="min-w-0 truncate text-base font-semibold text-slate-800 sm:text-lg">ফিল্টার</h2>
          <button
            type="button"
            onClick={() => {
              startTransition(() => {
                router.push(pathname as Route, { scroll: true });
              });
            }}
            className="shrink-0 text-xs font-semibold text-primary-600 hover:underline"
          >
            রিসেট
          </button>
        </div>
        {filterContent}
      </aside>
    </>
  );
}
