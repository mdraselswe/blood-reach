'use client';

import type { Route } from 'next';
import { FormEvent, useEffect, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { Database } from '@/types/database';
import { useAuth } from '@/components/auth/auth-provider';
import { approveDonor, rejectDonor, deleteDonor, toggleVerification } from '@/app/dashboard/admin/donors/actions';

type Donor = Database['public']['Tables']['donors']['Row'];

type Props = {
  donors: Donor[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  searchQuery: string;
  approvalFilter: string;
  error: string | null;
  adminEmails: string[];
};

const formatDate = (input: string | null) => {
  if (!input) return '-';
  return new Date(input).toLocaleDateString('bn-BD', { year: 'numeric', month: 'short', day: 'numeric' });
};

export function DonorAdminTable({
  donors,
  totalCount,
  currentPage,
  pageSize,
  searchQuery,
  approvalFilter,
  error,
  adminEmails,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(searchQuery);

  useEffect(() => {
    setSearchValue(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => setStatusMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  const isAdmin = user?.email && adminEmails.some(email => email.toLowerCase() === user.email!.toLowerCase());
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const buildUrl = (update: (params: URLSearchParams) => void): Route => {
    const params = new URLSearchParams(searchParams.toString());
    update(params);
    return (params.toString() ? `${pathname}?${params}` : pathname) as Route;
  };

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    router.push(buildUrl(p => {
      if (searchValue.trim()) {
        p.set('q', searchValue.trim());
      } else {
        p.delete('q');
      }
      p.set('page', '1');
    }));
  };

  const handleFilterChange = (approval: string) => {
    router.push(buildUrl(p => {
      p.set('approval', approval);
      p.set('page', '1');
    }));
  };

  const handleApprove = (donorId: string) => {
    if (!user?.email || !user.id) return;
    startTransition(async () => {
      const result = await approveDonor({ donorId, adminEmail: user.email ?? null, adminUserId: user.id ?? null });
      setStatusMessage(result.message);
      if (result.success) router.refresh();
    });
  };

  const handleToggleVerification = (donorId: string, currentStatus: boolean) => {
    if (!user?.email) return;
    startTransition(async () => {
      const result = await toggleVerification({ 
        donorId, 
        verify: !currentStatus, 
        adminEmail: user.email ?? null 
      });
      setStatusMessage(result.message);
      if (result.success) router.refresh();
    });
  };

  const handleReject = (donorId: string) => {
    if (!user?.email) return;
    startTransition(async () => {
      const result = await rejectDonor({ donorId, adminEmail: user.email ?? null });
      setStatusMessage(result.message);
      if (result.success) router.refresh();
    });
  };

  const handleDelete = (donorId: string, name: string) => {
    if (!user?.email || !confirm(`"${name}" কে মুছে ফেলতে চান?`)) return;
    startTransition(async () => {
      const result = await deleteDonor({ donorId, adminEmail: user.email ?? null });
      setStatusMessage(result.message);
      if (result.success) router.refresh();
    });
  };

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">অনুমতি নেই</h1>
        <p className="mt-3 text-sm text-slate-600">এই পেজটি শুধুমাত্র অ্যাডমিনদের জন্য।</p>
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

  // Count pending donors
  const pendingCount = donors.filter(d => !d.approved).length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">ডোনার ম্যানেজমেন্ট</h1>
        <p className="mt-1 text-sm text-slate-600">
          মোট {totalCount} জন ডোনার {approvalFilter === 'pending' && `(${pendingCount} পেন্ডিং)`}
        </p>
      </div>

      {/* Status Message */}
      {statusMessage && (
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {statusMessage}
        </div>
      )}

      {/* Filters & Search */}
      <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-4">
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => handleFilterChange('all')}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              approvalFilter === 'all'
                ? 'bg-primary text-white'
                : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            সব ({totalCount})
          </button>
          <button
            onClick={() => handleFilterChange('pending')}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              approvalFilter === 'pending'
                ? 'bg-amber-500 text-white'
                : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            পেন্ডিং {pendingCount > 0 && `(${pendingCount})`}
          </button>
          <button
            onClick={() => handleFilterChange('approved')}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              approvalFilter === 'approved'
                ? 'bg-emerald-500 text-white'
                : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            অ্যাপ্রুভড
          </button>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="search"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="নাম, ফোন, জেলা দিয়ে খুঁজুন..."
            className="flex-1 rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <button
            type="submit"
            className="rounded-2xl bg-primary px-6 py-2 text-sm font-semibold text-white hover:bg-primary-600"
          >
            খুঁজুন
          </button>
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchValue('');
                router.push(buildUrl(p => p.delete('q')));
              }}
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {/* Donors List */}
      <div className="space-y-4">
        {donors.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center">
            <p className="text-slate-500">কোনো ডোনার পাওয়া যায়নি</p>
          </div>
        ) : (
          donors.map((donor) => (
            <div key={donor.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                {/* Donor Info */}
                <div className="flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">{donor.display_name}</h3>
                    <span className="rounded-full bg-primary-100 px-3 py-1 text-sm font-semibold text-primary-700">
                      {donor.blood_group}
                    </span>
                    {donor.verified && (
                      <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                        ✓ ভেরিফাইড
                      </span>
                    )}
                    {!donor.approved && (
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700">
                        ⏳ পেন্ডিং
                      </span>
                    )}
                    {donor.approved && (
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
                        ✓ অ্যাপ্রুভড
                      </span>
                    )}
                  </div>

                  <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                    <div>📍 {donor.area ? `${donor.area}, ` : ''}{donor.district}</div>
                    <div>📞 {donor.phone_primary}</div>
                    {donor.email && <div>✉️ {donor.email}</div>}
                    {donor.institute && <div>🎓 {donor.institute}</div>}
                    <div>📅 রেজিস্টার: {formatDate(donor.created_at)}</div>
                    {donor.approved_at && <div>✅ অ্যাপ্রুভ: {formatDate(donor.approved_at)}</div>}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 lg:flex-col lg:items-end">
                  <button
                    onClick={() => handleToggleVerification(donor.id, donor.verified ?? false)}
                    disabled={pending}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold disabled:opacity-50 ${
                      donor.verified
                        ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {donor.verified ? '✓ ভেরিফাইড' : '○ ভেরিফাই করুন'}
                  </button>

                  {!donor.approved ? (
                    <>
                      <button
                        onClick={() => handleApprove(donor.id)}
                        disabled={pending}
                        className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
                      >
                        ✓ অ্যাপ্রুভ করুন
                      </button>
                      <button
                        onClick={() => handleDelete(donor.id, donor.display_name)}
                        disabled={pending}
                        className="rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                      >
                        ✕ মুছে ফেলুন
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleReject(donor.id)}
                        disabled={pending}
                        className="rounded-full border border-amber-200 px-4 py-2 text-sm font-semibold text-amber-600 hover:bg-amber-50 disabled:opacity-50"
                      >
                        ↩ বাতিল করুন
                      </button>
                      <button
                        onClick={() => handleDelete(donor.id, donor.display_name)}
                        disabled={pending}
                        className="rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                      >
                        ✕ মুছুন
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => router.push(buildUrl(p => p.set('page', String(currentPage - 1))))}
            disabled={currentPage <= 1}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            ← পূর্ববর্তী
          </button>
          <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow">
            পৃষ্ঠা {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => router.push(buildUrl(p => p.set('page', String(currentPage + 1))))}
            disabled={currentPage >= totalPages}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            পরবর্তী →
          </button>
        </div>
      )}
    </div>
  );
}
