import { unstable_noStore } from 'next/cache';
import type { Database } from '@/types/database';
import { supabaseServerClient } from '@/lib/supabase-server';
import { DonorCard } from '@/components/ui/donor-card';
import { DonorResultsEmptyState } from '@/app/(public)/donors/empty-results';
import { DonorPaginationControls } from '@/app/(public)/donors/pagination-controls';

type Filters = {
  query?: string;
  bloodGroup?: Database['public']['Enums']['blood_group'];
  district?: string;
  area?: string;
  availability?: 'available' | 'temporarily_unavailable';
};

export async function DonorResults({ filters, page, pageSize }: { filters: Filters; page: number; pageSize: number }) {
  unstable_noStore();

  const supabase = supabaseServerClient();
  const offset = (page - 1) * pageSize;
  const rangeEnd = offset + pageSize - 1;

  const buildQuery = (includeCount: boolean) => {
    let query = supabase
      .from('donors')
      .select(
        `
        id,
        display_name,
        district,
        area,
        blood_group,
        availability,
        verified,
        donation_count,
        response_rate,
        last_donation_at,
        emergency_ready,
        phone_primary,
        phone_secondary,
        share_contact,
        tags,
        about
      `,
        includeCount ? { count: 'exact' } : undefined,
      )
      .order('verified', { ascending: false })
      .order('donation_count', { ascending: false })
      .order('last_donation_at', { ascending: true });

    if (filters.bloodGroup) {
      query = query.eq('blood_group', filters.bloodGroup);
    }
    if (filters.district) {
      query = query.eq('district', filters.district);
    }
    if (filters.area) {
      query = query.eq('area', filters.area);
    }
    if (filters.availability) {
      query = query.eq('availability', filters.availability);
    } else {
      query = query.not('availability', 'eq', 'not_available');
    }
    if (filters.query) {
      query = query.textSearch('searchable_text', filters.query, {
        type: 'websearch',
        config: 'simple',
      });
    }

    return query;
  };

  const { data, error, count } = await buildQuery(true).range(offset, rangeEnd);
  const totalCount = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const effectivePage = Math.min(page, totalPages);

  let donors = data ?? [];
  let finalError = error;

  if (donors.length === 0 && totalCount > 0 && effectivePage !== page) {
    const correctedOffset = (effectivePage - 1) * pageSize;
    const correctedRangeEnd = correctedOffset + pageSize - 1;
    const { data: correctedData, error: correctedError } = await buildQuery(false).range(correctedOffset, correctedRangeEnd);

    donors = correctedData ?? [];
    finalError = correctedError ?? finalError;
  }

  if (finalError) {
    console.error('Failed to load donors', finalError);
    return (
      <div className="rounded-3xl border border-red-100 bg-red-50/70 p-6 text-sm text-red-600">
        ডোনার তালিকা লোড করতে সমস্যা হয়েছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।
      </div>
    );
  }

  if (!donors.length) {
    return <DonorResultsEmptyState />;
  }

  const visibleStart = totalCount === 0 ? 0 : (effectivePage - 1) * pageSize + 1;
  const visibleEnd = totalCount === 0 ? 0 : Math.min(visibleStart + donors.length - 1, totalCount);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-100 bg-white/70 px-4 py-3 text-sm text-slate-600 shadow-sm">
        <p className="text-sm text-slate-500 sm:text-base">
          মোট {totalCount} জন ডোনার পাওয়া গেছে
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {donors.map((donor) => (
          <DonorCard key={donor.id} donor={donor} />
        ))}
      </div>
      <DonorPaginationControls
        totalCount={totalCount}
        currentPage={effectivePage}
        pageSize={pageSize}
        visibleStart={visibleStart}
        visibleEnd={visibleEnd}
      />
    </div>
  );
}
