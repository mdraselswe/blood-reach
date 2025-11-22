import type { Database } from '@/types/database';
import { supabaseAdminClient } from '@/lib/supabase-admin';
import { DonorAdminTable } from '@/components/admin/donor-admin-table';

export const dynamic = 'force-dynamic';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

type SearchParams = Record<string, string | string[] | undefined>;

const getSingleParam = (params: SearchParams, key: string) => {
  const value = params[key];
  if (!value) return undefined;
  return Array.isArray(value) ? value[0] : value;
};

const parseInteger = (value: string | undefined, fallback: number, { min, max }: { min: number; max: number }) => {
  const parsed = Number.parseInt(value ?? '', 10);
  if (Number.isNaN(parsed)) return fallback;
  if (parsed < min) return min;
  if (parsed > max) return max;
  return parsed;
};

const sanitizeSearchTerm = (input: string | undefined) => {
  if (!input) return undefined;
  const trimmed = input.trim();
  if (!trimmed) return undefined;
  return trimmed.replace(/[%_]/g, '').replace(/[(),|]/g, ' ').slice(0, 120);
};

type DonorRow = Database['public']['Tables']['donors']['Row'];

export default async function AdminDonorsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const searchTerm = sanitizeSearchTerm(getSingleParam(searchParams, 'q'));
  const approvalFilter = getSingleParam(searchParams, 'approval') || 'all'; // 'all', 'pending', 'approved'
  const page = parseInteger(getSingleParam(searchParams, 'page'), 1, { min: 1, max: 10_000 });
  const pageSize = parseInteger(
    getSingleParam(searchParams, 'pageSize'),
    DEFAULT_PAGE_SIZE,
    { min: 5, max: MAX_PAGE_SIZE },
  );

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = supabaseAdminClient();

  const buildQuery = (includeCount: boolean) => {
    let query = supabase
      .from('donors')
      .select('*', includeCount ? { count: 'exact' } : undefined)
      .order('created_at', { ascending: false });

    // Filter by approval status
    if (approvalFilter === 'pending') {
      query = query.eq('approved', false);
    } else if (approvalFilter === 'approved') {
      query = query.eq('approved', true);
    }
    // 'all' - no filter

    if (!searchTerm) {
      return query;
    }

    const pattern = `%${searchTerm}%`;
    return query.or(
      [
        `display_name.ilike.${pattern}`,
        `phone_primary.ilike.${pattern}`,
        `phone_secondary.ilike.${pattern}`,
        `email.ilike.${pattern}`,
        `district.ilike.${pattern}`,
        `area.ilike.${pattern}`,
      ].join(','),
    );
  };

  const { data, error, count } = await buildQuery(true).range(from, to);

  const totalCount = count ?? 0;
  const effectivePage = totalCount === 0 ? 1 : Math.min(page, Math.max(1, Math.ceil(totalCount / pageSize)));
  let donors: DonorRow[] = (data ?? []) as DonorRow[];
  let finalError = error;

  if (totalCount > 0 && donors.length === 0 && effectivePage !== page) {
    const correctedFrom = (effectivePage - 1) * pageSize;
    const correctedTo = correctedFrom + pageSize - 1;
    const { data: correctedData, error: correctedError } = await buildQuery(false).range(correctedFrom, correctedTo);
    donors = (correctedData ?? donors) as DonorRow[];
    finalError = correctedError ?? finalError;
  }

  return (
    <DonorAdminTable
      donors={donors}
      totalCount={totalCount}
      currentPage={effectivePage}
      pageSize={pageSize}
      searchQuery={searchTerm ?? ''}
      approvalFilter={approvalFilter}
      error={finalError?.message ?? null}
      adminEmails={(process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? '').split(',').map((item) => item.trim()).filter(Boolean)}
    />
  );
}
