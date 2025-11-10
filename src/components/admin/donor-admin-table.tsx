'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { Database } from '@/types/database';
import { useAuth } from '@/components/auth/auth-provider';
import { toggleVerification, toggleAvailability, deleteDonor } from '@/app/dashboard/admin/donors/actions';

const formatDate = (input: string | null) => {
  if (!input) return 'অজানা';
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return 'অজানা';
  return date.toLocaleDateString('bn-BD', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

type Donor = Database['public']['Tables']['donors']['Row'];

type Props = {
  donors: Donor[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  searchQuery: string;
  error: string | null;
  adminEmails: string[];
};

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

export function DonorAdminTable({
  donors,
  totalCount,
  currentPage,
  pageSize,
  searchQuery,
  error,
  adminEmails,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(searchQuery);

  useEffect(() => {
    setSearchValue(searchQuery);
  }, [searchQuery]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const hasResults = donors.length > 0;
  const rangeStart = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = totalCount === 0 ? 0 : Math.min(rangeStart + donors.length - 1, totalCount);
  const pageSizeChoices = useMemo(() => {
    const merged = Array.from(new Set<number>([...PAGE_SIZE_OPTIONS, pageSize]));
    return merged.sort((a, b) => a - b);
  }, [pageSize]);
  const hasActiveSearch = searchQuery.trim().length > 0;

  const isAdmin = useMemo(() => {
    if (!user?.email) return false;
    if (!adminEmails.length) return true;
    return adminEmails.includes(user.email.toLowerCase());
  }, [user?.email, adminEmails]);

  const buildUrl = (update: (params: URLSearchParams) => void) => {
    const current = new URLSearchParams(searchParams.toString());
    update(current);
    return current.toString() ? `${pathname}?${current.toString()}` : pathname;
  };

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = searchValue.trim();
    const url = buildUrl((params) => {
      if (value) {
        params.set('q', value);
      } else {
        params.delete('q');
      }
      params.set('page', '1');
    });
    router.push(url);
  };

  const handleClearSearch = () => {
    setSearchValue('');
    const url = buildUrl((params) => {
      params.delete('q');
      params.set('page', '1');
    });
    router.push(url);
  };

  const handlePageSizeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const url = buildUrl((params) => {
      params.set('pageSize', event.target.value);
      params.set('page', '1');
    });
    router.push(url);
  };

  const handlePageChange = (nextPage: number) => {
    const safePage = Math.min(Math.max(nextPage, 1), totalPages);
    const url = buildUrl((params) => {
      params.set('page', safePage.toString());
    });
    router.push(url);
  };

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[40vh] max-w-6xl items-center justify-center px-4">
        <p className="rounded-3xl border border-slate-100 bg-white/80 px-6 py-4 text-sm text-slate-500">
          তথ্য লোড হচ্ছে...
        </p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">অনধিকার প্রবেশ</h1>
        <p className="mt-3 text-sm text-slate-600">
          এই পৃষ্ঠাটি শুধুমাত্র অনুমোদিত অ্যাডমিন সদস্যদের জন্য। প্রয়োজনে সিস্টেম অ্যাডমিনের সাথে যোগাযোগ করুন।
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="rounded-3xl border border-rose-100 bg-rose-50 p-6 text-sm text-rose-700">
          ডেটা লোড করা যায়নি: {error}
        </div>
      </div>
    );
  }

  const handleToggleVerification = (donorId: string, nextValue: boolean) => {
    if (!user?.email) return;
    startTransition(async () => {
      const result = await toggleVerification({ donorId, verify: nextValue, adminEmail: user.email });
      setStatusMessage(result.message);
      if (result.success) {
        router.refresh();
      }
    });
  };

  const handleToggleAvailability = (donorId: string, nextValue: Database['public']['Enums']['availability_status']) => {
    if (!user?.email) return;
    startTransition(async () => {
      const result = await toggleAvailability({ donorId, availability: nextValue, adminEmail: user.email });
      setStatusMessage(result.message);
      if (result.success) {
        router.refresh();
      }
    });
  };

  const handleDelete = (donorId: string) => {
    if (!user?.email) return;
    if (!window.confirm('এই ডোনারকে মুছে ফেলতে চান? এটি অপরিবর্তনীয়।')) return;
    startTransition(async () => {
      const result = await deleteDonor({ donorId, adminEmail: user.email });
      setStatusMessage(result.message);
      if (result.success) {
        router.refresh();
      }
    });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">ডোনার ম্যানেজমেন্ট</h1>
          <p className="text-sm text-slate-600">
            মোট {totalCount} জন ডোনার তালিকাভুক্ত। ভেরিফিকেশন ও উপলভ্যতা এখান থেকে নিয়ন্ত্রণ করুন।
          </p>
        </div>
        {statusMessage ? (
          <div className="rounded-2xl border border-primary/30 bg-primary-50 px-4 py-2 text-sm text-primary-700">
            {statusMessage}
          </div>
        ) : null}
      </div>
      <div className="mt-8 flex flex-col gap-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <form
          onSubmit={handleSearchSubmit}
          className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
        >
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <input
                type="search"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="নাম, ফোন, জেলা বা ইমেইল দিয়ে খুঁজুন…"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow hover:bg-primary-600"
              >
                অনুসন্ধান
              </button>
              {hasActiveSearch ? (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  পরিষ্কার করুন
                </button>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="pageSize" className="text-sm text-slate-600">
              প্রতি পৃষ্ঠায়
            </label>
            <select
              id="pageSize"
              value={pageSize}
              onChange={handlePageSizeChange}
              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              {pageSizeChoices.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </form>
        <div className="flex flex-col items-start justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center">
          <div>
            {hasResults ? (
              <span>
                দেখানো হচ্ছে {rangeStart}-{rangeEnd} / {totalCount}
              </span>
            ) : (
              <span>কোনো ফলাফল পাওয়া যায়নি।</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              পূর্ববর্তী
            </button>
            <span className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow">
              পৃষ্ঠা {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              পরবর্তী
            </button>
          </div>
        </div>
      </div>
      <div className="mt-6 overflow-x-auto rounded-3xl border border-slate-100 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">নাম</th>
              <th className="px-4 py-3">ব্লাড গ্রুপ</th>
              <th className="px-4 py-3">অবস্থান</th>
              <th className="px-4 py-3">অবস্থা</th>
              <th className="px-4 py-3">যোগাযোগ</th>
              <th className="px-4 py-3">ক্রিয়াকলাপ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {donors.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                  বর্তমানে প্রদর্শনের জন্য কোনো ডেটা নেই।
                </td>
              </tr>
            ) : null}
            {donors.map((donor) => (
              <tr key={donor.id} className="align-top">
                <td className="px-4 py-4">
                  <div className="font-semibold text-slate-800">{donor.display_name}</div>
                  <div className="text-xs text-slate-500">রেজিস্টার: {formatDate(donor.created_at)}</div>
                  {donor.last_donation_at ? (
                    <div className="text-xs text-slate-500">সর্বশেষ দান: {formatDate(donor.last_donation_at)}</div>
                  ) : null}
                </td>
                <td className="px-4 py-4 font-semibold text-primary-600">{donor.blood_group}</td>
                <td className="px-4 py-4 text-sm text-slate-600">
                  {donor.area ? `${donor.area}, ` : ''}
                  {donor.district}
                </td>
                <td className="px-4 py-4 space-y-2">
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                    donor.verified ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                  }`}
                  >
                    {donor.verified ? 'ভেরিফায়েড' : 'অনভেরিফায়েড'}
                  </span>
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                    donor.availability === 'available'
                      ? 'bg-emerald-50 text-emerald-700'
                      : donor.availability === 'temporarily_unavailable'
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                  >
                    {donor.availability === 'available'
                      ? 'উপলভ্য'
                      : donor.availability === 'temporarily_unavailable'
                      ? 'শীঘ্রই উপলভ্য'
                      : 'অনুপলভ্য'}
                  </span>
                  {donor.emergency_ready ? (
                    <span className="inline-flex items-center rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
                      ⚡ জরুরি সাড়া দেয়
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-4 text-sm text-slate-600">
                  <div>📞 {donor.phone_primary}</div>
                  {donor.phone_secondary ? <div>📞 {donor.phone_secondary}</div> : null}
                  {donor.email ? <div>✉️ {donor.email}</div> : null}
                </td>
                <td className="px-4 py-4 space-y-2 text-sm">
                  <button
                    type="button"
                    onClick={() => handleToggleVerification(donor.id, !donor.verified)}
                    disabled={pending}
                    className="flex w-full items-center justify-center rounded-full border border-primary/40 px-3 py-2 font-semibold text-primary-600 hover:bg-primary-50 disabled:opacity-50"
                  >
                    {donor.verified ? 'ভেরিফিকেশন বাতিল করুন' : 'ভেরিফাই করুন'}
                  </button>
                  <select
                    value={donor.availability}
                    disabled={pending}
                    onChange={(event) =>
                      handleToggleAvailability(
                        donor.id,
                        event.target.value as Database['public']['Enums']['availability_status'],
                      )
                    }
                    className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="available">উপলভ্য</option>
                    <option value="temporarily_unavailable">অল্প সময় পর প্রাপ্য</option>
                    <option value="not_available">অনুপলভ্য</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => handleDelete(donor.id)}
                    disabled={pending}
                    className="flex w-full items-center justify-center rounded-full border border-rose-200 px-3 py-2 font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                  >
                    ডোনার মুছে ফেলুন
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
